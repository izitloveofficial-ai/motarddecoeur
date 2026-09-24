import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAppAccess } from "@/lib/require-admin";
import { requireDatingIntent } from "@/lib/require-dating-intent";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/discover_/likes")({
  ssr: false,
  beforeLoad: async () => {
    await requireAppAccess();
    await requireDatingIntent();
    if (!supabase) throw redirect({ to: "/matches" });

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });

    throw redirect({ to: "/matches" });
  },
});
