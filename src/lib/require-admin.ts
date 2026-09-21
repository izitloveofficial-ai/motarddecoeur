import { redirect } from "@tanstack/react-router";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const TOKEN_REFRESH_MARGIN_SECONDS = 60;

type AdminClient = Pick<SupabaseClient, "auth" | "rpc">;

async function getFreshSession(client: AdminClient): Promise<Session | null> {
  const initial = await client.auth.getSession();
  let data = initial.data;
  const { error } = initial;

  if (!error && !data.session) {
    // On a full page load, Supabase may still be restoring the browser session
    // when getSession() first runs. Give its initial auth event one chance to
    // provide that session, without holding up genuinely signed-out visitors.
    const resolved = await new Promise<Session | null>((resolve) => {
      let settled = false;
      const subscriptionRef: { current?: { unsubscribe: () => void } } = {};
      const timeout = setTimeout(() => finish(null), 800);
      const finish = (session: Session | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        subscriptionRef.current?.unsubscribe();
        resolve(session);
      };

      const { data: sub } = client.auth.onAuthStateChange((_event, session) => finish(session));
      subscriptionRef.current = sub.subscription;
      // Accommodate auth clients or test doubles that deliver the initial
      // event synchronously, before onAuthStateChange returns its subscription.
      if (settled) subscriptionRef.current.unsubscribe();
    });

    if (resolved) data = { session: resolved };
  }

  if (error || !data.session) return null;

  const expiresSoon =
    data.session.expires_at !== undefined &&
    data.session.expires_at <= Math.floor(Date.now() / 1000) + TOKEN_REFRESH_MARGIN_SECONDS;

  if (!expiresSoon) return data.session;

  const refreshed = await client.auth.refreshSession({
    refresh_token: data.session.refresh_token,
  });
  return refreshed.error ? null : refreshed.data.session;
}

/**
 * Vérifie le rôle avec le jeton exact de la session qui vient d'être lu ou
 * rafraîchi. L'en-tête explicite évite qu'un appel RPC parte avec l'ancien
 * jeton pendant que Supabase propage un rafraîchissement de session.
 */
export async function hasAdminAccess(client: AdminClient): Promise<boolean> {
  const session = await getFreshSession(client);
  if (!session) return false;

  const { data, error } = await client
    .rpc("is_admin")
    .setHeader("Authorization", `Bearer ${session.access_token}`);

  return !error && data === true;
}

/**
 * À utiliser dans le `beforeLoad` d'une route pour la réserver au compte admin.
 * Les routes concernées désactivent leur SSR : la session Supabase est conservée
 * dans le stockage du navigateur et n'est donc pas disponible sur le serveur.
 */
export async function requireAdmin() {
  // Defensive fallback for accidental server-side calls. Protected routes use
  // `ssr: false`, so this branch never grants browser navigation by itself.
  if (typeof window === "undefined") return;

  if (!supabase || !(await hasAdminAccess(supabase))) {
    throw redirect({ to: "/join" });
  }
}

/** Browser guard for private administration pages. */
export async function requireAdminPage() {
  if (typeof window === "undefined") return;

  if (supabase && (await hasAdminAccess(supabase))) return;

  // The pre-registration administration uses the server-issued, HttpOnly
  // admin session. Supporting it here keeps every /admin page behind the same
  // navigation guard while the underlying data APIs retain their own checks.
  const serverSession = await fetch("/api/admin/session", {
    credentials: "same-origin",
    headers: { accept: "application/json" },
  }).catch(() => null);
  if (serverSession?.ok) return;

  throw redirect({ to: "/admin/login" });
}
