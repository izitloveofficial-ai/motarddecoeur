import { redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

/**
 * À utiliser dans le `beforeLoad` d'une route pour la réserver au compte admin.
 * Redirige silencieusement vers /join si la personne n'est pas connectée en admin —
 * jamais de message d'erreur qui confirmerait l'existence de la page à un visiteur normal.
 */
export async function requireAdmin() {
  if (!supabase) throw redirect({ to: "/join" });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw redirect({ to: "/join" });

  const { data, error } = await supabase.rpc("is_admin");
  if (error || data !== true) throw redirect({ to: "/join" });
}
