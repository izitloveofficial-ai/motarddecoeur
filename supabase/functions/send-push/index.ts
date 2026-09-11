import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base64Url(value: string | Uint8Array) {
  const binary = typeof value === "string" ? value : String.fromCharCode(...value);
  return btoa(binary).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const binary = atob(
    pem
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\s/g, ""),
  );
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer;
}

async function getFcmAccessToken(serviceAccount: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  )}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${base64Url(new Uint8Array(signature))}`,
    }),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error("Impossible d'obtenir un jeton FCM.");
  return data.access_token as string;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "authentication_required" }, 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const caller = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user },
    } = await caller.auth.getUser();
    if (!user) return json({ error: "authentication_required" }, 401);

    const { profile_id: profileId, title, body } = await request.json();
    if (typeof profileId !== "string" || typeof title !== "string" || typeof body !== "string") {
      return json({ error: "missing_fields" }, 400);
    }
    if (title.length > 100 || body.length > 500) return json({ error: "content_too_long" }, 400);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const { data: match } = await admin
      .from("matches")
      .select("id")
      .or(
        `and(profile_a_id.eq.${user.id},profile_b_id.eq.${profileId}),and(profile_a_id.eq.${profileId},profile_b_id.eq.${user.id})`,
      )
      .limit(1)
      .maybeSingle();
    if (!match) return json({ error: "recipient_not_matched" }, 403);

    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      return json(
        {
          error: "firebase_not_configured",
          message:
            "Le secret FIREBASE_SERVICE_ACCOUNT_JSON n'est pas configuré. Voir MOBILE_SETUP.md.",
        },
        503,
      );
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    const { data: tokens } = await admin
      .from("push_tokens")
      .select("token")
      .eq("profile_id", profileId);
    if (!tokens?.length) return json({ sent: 0, reason: "no_registered_device" });

    const accessToken = await getFcmAccessToken(serviceAccount);
    let sent = 0;
    for (const { token } of tokens) {
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ message: { token, notification: { title, body } } }),
        },
      );
      if (response.ok) sent++;
      else await admin.from("push_tokens").delete().eq("token", token);
    }
    return json({ sent, total: tokens.length });
  } catch (error) {
    return json({ error: "unexpected_error", message: String(error) }, 500);
  }
});
