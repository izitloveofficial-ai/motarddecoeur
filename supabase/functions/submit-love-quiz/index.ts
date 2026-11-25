import { quizSubmissionSchema } from "../../../src/lib/quiz-submission.ts";
import { getQuizResult, QUIZ_PROFILES, QUIZ_QUESTIONS } from "../../../src/lib/love-quiz.ts";

import { DATING_QUIZ_VERSION, buildDatingEmail } from "../../../src/lib/dating-quiz.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
const escape = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (Number(req.headers.get("content-length") ?? 0) > 8192) return json({ error: "too_large" }, 413);
  // Anonymous visitors are expected. Validate the project API key ourselves so both
  // modern publishable keys and legacy JWT keys work (verify_jwt=false).
  const projectUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("QUIZ_FROM") || Deno.env.get("PROGRESS_UPDATE_FROM");
  const suppliedKey = req.headers.get("apikey");
  if (!suppliedKey || suppliedKey.length > 1024) return json({ error: "unauthorized" }, 401);
  try {
    const auth = await fetch(`${projectUrl}/auth/v1/settings`, { headers: { apikey: suppliedKey } });
    if (!auth.ok) return json({ error: "unauthorized" }, 401);
  } catch { return json({ error: "temporarily_unavailable" }, 503); }
  const raw = await req.text();
  if (raw.length > 8192) return json({ error: "too_large" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "invalid_request" }, 400); }
  const parsed = quizSubmissionSchema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid_request" }, 400);
  const input = parsed.data;
  const isDating = input.quiz_version === DATING_QUIZ_VERSION;
  const profileKey = isDating ? "bilan" : getQuizResult(input.answers)!;
  const profile = profileKey === "bilan" ? null : QUIZ_PROFILES[profileKey];
  const headers = { authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "content-type": "application/json" };
  const rest = (path: string, init: RequestInit = {}) => fetch(`${projectUrl}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init.headers } });
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const hmac = await crypto.subtle.importKey("raw", new TextEncoder().encode(serviceKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const hash = [...new Uint8Array(await crypto.subtle.sign("HMAC", hmac, new TextEncoder().encode(ip)))].map(b => b.toString(16).padStart(2,"0")).join("");
    const saved = await rest(isDating ? "rpc/record_dating_quiz" : "rpc/record_love_quiz", { method: "POST", body: JSON.stringify({
      p_id: input.request_id, p_first_name: input.first_name, p_email: input.email, p_answers: input.answers,
      ...(isDating ? {p_quiz_version: DATING_QUIZ_VERSION} : {p_result: profileKey}), p_preinscribe: input.preinscribe, p_ip_hash: hash, p_consent_version: input.consent_version,
    }) });
    if (!saved.ok) {
      const details = await saved.text();
      return json({ error: details.includes("rate_limited") ? "rate_limited" : "save_failed" }, details.includes("rate_limited") ? 429 : 503);
    }
    const row = await saved.json();
    if (row.email_status === "sent") return json({ ok: true, email_sent: true, preinscribed: row.preinscribed });
    // Only one parallel request can claim the outgoing email.
    const claim = await rest(`love_quiz_participations?id=eq.${input.request_id}&email_status=in.(pending,failed)`, {
      method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify({ email_status: "sending" }),
    });
    const claimed = claim.ok ? await claim.json() : [];
    if (!claimed.length) return json({ ok: true, email_sent: false, preinscribed: row.preinscribed });
    let sent = false;
    if (key && from) {
      const recap = isDating ? "" : input.answers.map((answer,i) => `${QUIZ_QUESTIONS[i].title}\n${QUIZ_QUESTIONS[i].options[answer].label}`).join("\n\n");
      const ending = input.preinscribe ? "Votre demande de préinscription est enregistrée. Si votre adresse est déjà connue, son statut est conservé. Vous n’avez pas créé de compte membre." : "Vous n’avez pas demandé de préinscription. Cet e-mail ne vous abonne à aucune actualité.";
      const legacyText = profile ? `Bonjour ${input.first_name},\n\nVotre profil amoureux à moto : ${profile.title}\n\n${profile.description}\n\n${profile.date}\n\nVos réponses :\n${recap}\n\n${ending}\n\nCe quiz est ludique et ne garantit aucune compatibilité amoureuse.\nRetrouvez Motards de Cœur : https://motardsdecoeur.com\nPour supprimer votre participation : contact@motardsdecoeur.com` : "";
      const message = isDating ? buildDatingEmail(input.first_name, input.answers, input.preinscribe)! : {
        subject: "Votre profil amoureux à moto | Motards de Cœur", text: legacyText,
        html: `<html lang="fr"><body style="background:#21191a;color:#fff9f0;font-family:Arial,sans-serif;padding:24px"><div style="max-width:560px;margin:auto"><img src="https://motardsdecoeur.com/logo-motards-de-coeur-hd.png" width="100" alt="Motards de Cœur"><h1 style="color:#efbf87">${escape(profile!.title)}</h1>${legacyText.split("\n\n").map(p => `<p style="font-size:16px;line-height:1.6">${escape(p).replaceAll("\n","<br>")}</p>`).join("")}</div></body></html>`,
      };
      try {
        const email = await fetch("https://api.resend.com/emails", {
          method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "idempotency-key": `love-quiz/${input.request_id}` },
          body: JSON.stringify({ from, to: input.email, reply_to: "contact@motardsdecoeur.com", ...message }),
        });
        sent = email.ok;
      } catch { /* Preserve the participation even when the email provider is unavailable. */ }
    }
    const recorded = await rest(`love_quiz_participations?id=eq.${input.request_id}`, { method: "PATCH", body: JSON.stringify({ email_status: sent ? "sent" : "failed", email_sent_at: sent ? new Date().toISOString() : null }) });
    if (!recorded.ok) console.error("quiz_email_status_not_recorded");
    return json({ ok: true, email_sent: sent, preinscribed: row.preinscribed });
  } catch {
    console.error("quiz_submission_failed");
    return json({ error: "temporarily_unavailable" }, 503);
  }
});
