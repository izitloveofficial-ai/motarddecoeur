// Permet à un administrateur de supprimer définitivement le compte d'un membre
// (bannissement), par opposition à la simple désactivation de profil (is_active).
// Contrairement à delete-account (auto-suppression), celle-ci vérifie que
// l'appelant est bien un administrateur avant d'agir sur un compte qui n'est pas
// le sien.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "authentication_required" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await caller.auth.getUser();
    if (!user) return json({ error: "authentication_required" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: isAdminRow } = await admin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!isAdminRow) return json({ error: "admin_required" }, 403);

    const { profile_id } = (await req.json()) as { profile_id?: string };
    if (!profile_id) return json({ error: "missing_profile_id" }, 400);
    if (profile_id === user.id) return json({ error: "cannot_ban_self" }, 400);

    const { error: deleteError } = await admin.auth.admin.deleteUser(profile_id);
    if (deleteError) return json({ error: "delete_failed", message: deleteError.message }, 500);

    return json({ success: true });
  } catch (error) {
    return json({ error: "unexpected_error", message: String(error) }, 500);
  }
});
