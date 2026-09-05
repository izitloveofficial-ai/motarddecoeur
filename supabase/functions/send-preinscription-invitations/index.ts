import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: request.headers.get("Authorization") ?? "" } },
  });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const {
    data: { user },
  } = await caller.auth.getUser();
  if (!user) return json({ error: "authentication_required" }, 401);
  const { data: adminRow } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminRow) return json({ error: "admin_required" }, 403);
  const { data: campaign } = await admin
    .from("invitation_campaign")
    .select("enabled")
    .eq("id", true)
    .single();
  if (!campaign?.enabled) return json({ error: "campaign_suspended" }, 409);

  const body = (await request.json()) as { ids?: string[] };
  const ids = [...new Set(body.ids ?? [])].slice(0, 100);
  if (!ids.length) return json({ error: "no_registration_selected" }, 400);
  const { data: rows, error } = await admin
    .from("preinscriptions")
    .select("id,email,status,consent_rgpd,user_id")
    .in("id", ids);
  if (error) return json({ error: error.message }, 500);

  const results = [];
  for (const row of rows ?? []) {
    if (!row.consent_rgpd || ["declined", "invalid", "converted"].includes(row.status)) {
      results.push({ id: row.id, ok: false, reason: "not_eligible" });
      continue;
    }
    if (row.status === "invited") {
      results.push({ id: row.id, ok: true, reason: "already_invited" });
      continue;
    }
    const redirectTo = `${Deno.env.get("SITE_URL") ?? "https://motarddecoeur.lovable.app"}/activate?registration=${encodeURIComponent(row.id)}`;
    const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(row.email, {
      redirectTo,
    });
    if (inviteError) {
      // An existing Auth identity must be linked, never duplicated. It can sign in
      // normally and visit the same activation URL.
      results.push({ id: row.id, ok: false, reason: inviteError.message });
      continue;
    }
    const { error: updateError } = await admin
      .from("preinscriptions")
      .update({
        status: "invited",
        invitation_sent_at: new Date().toISOString(),
        user_id: data.user.id,
      })
      .eq("id", row.id)
      .eq("status", "pending");
    results.push({ id: row.id, ok: !updateError, reason: updateError?.message });
  }
  return json({ results });
});

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
