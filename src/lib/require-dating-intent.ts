import { redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

const NON_DATING_INTENTS = ["balades_moto", "communaute_motards"] as const;

/**
 * À utiliser dans le beforeLoad de /discover : bloque l'accès aux profils de rencontre
 * pour les personnes qui ont explicitement dit ne pas chercher de rencontre à l'inscription.
 */
export async function requireDatingIntent() {
  if (!supabase) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("looking_for")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile?.looking_for) return;

  if (NON_DATING_INTENTS.includes(profile.looking_for as (typeof NON_DATING_INTENTS)[number])) {
    const redirectTo = profile.looking_for === "balades_moto" ? "/rides" : "/community";
    throw redirect({ to: redirectTo });
  }
}
