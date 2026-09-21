import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { BadgeCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { requireAdmin } from "@/lib/require-admin";
import { supabase } from "@/lib/supabase";

type MatchRow = {
  id: string;
  matched_at: string;
  otherName: string;
  isPremium: boolean;
  photoUrl: string | null;
  unreadCount: number;
};
export const Route = createFileRoute("/matches")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  component: Matches,
  beforeLoad: async () => {
    await requireAdmin();
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
});
function Matches() {
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void load();
  }, []);
  async function load() {
    if (!supabase) return setError("Supabase n'est pas configuré.");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: rows, error: rowsError } = await supabase
      .from("matches")
      .select("id, matched_at, profile_a_id, profile_b_id")
      .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`)
      .order("matched_at", { ascending: false });
    if (rowsError) {
      setError("Impossible de charger tes discussions.");
      setMatches([]);
      return;
    }
    const otherIds = (rows ?? []).map((row) =>
      row.profile_a_id === user.id ? row.profile_b_id : row.profile_a_id,
    );
    const names = new Map<string, string>();
    const premiumStatuses = new Map<string, boolean>();
    const photos = new Map<string, string>();
    if (otherIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, is_premium")
        .in("id", otherIds);
      for (const profile of profiles ?? []) {
        names.set(profile.id, profile.first_name);
        premiumStatuses.set(profile.id, profile.is_premium === true);
      }
      const { data: photoRows } = await supabase
        .from("profile_photos")
        .select("profile_id, storage_path, position")
        .in("profile_id", otherIds)
        .order("position", { ascending: true });
      for (const photo of photoRows ?? [])
        if (!photos.has(photo.profile_id))
          photos.set(
            photo.profile_id,
            supabase.storage.from("profile-photos").getPublicUrl(photo.storage_path).data.publicUrl,
          );
    }
    const matchIds = (rows ?? []).map((row) => row.id);
    const unreadByMatch = new Map<string, number>();
    if (matchIds.length) {
      const { data: unreadRows } = await supabase
        .from("messages")
        .select("match_id")
        .in("match_id", matchIds)
        .neq("sender_id", user.id)
        .is("read_at", null);
      for (const row of unreadRows ?? []) {
        unreadByMatch.set(row.match_id, (unreadByMatch.get(row.match_id) ?? 0) + 1);
      }
    }
    setMatches(
      (rows ?? []).map((row) => {
        const otherId = row.profile_a_id === user.id ? row.profile_b_id : row.profile_a_id;
        return {
          id: row.id,
          matched_at: row.matched_at,
          otherName: names.get(otherId) ?? "Motard(e)",
          isPremium: premiumStatuses.get(otherId) ?? false,
          photoUrl: photos.get(otherId) ?? null,
          unreadCount: unreadByMatch.get(row.id) ?? 0,
        };
      }),
    );
  }
  async function removeMatch(id: string) {
    if (!supabase) return;
    if (!window.confirm("Supprimer cette conversation et ce coup de cœur ?")) return;
    await supabase.from("matches").delete().eq("id", id);
    await load();
  }

  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <div className="mt-3 mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-3xl sm:text-4xl">
            Mes discussions{matches !== null && ` (${matches.length})`}
          </h1>
          <Link
            to="/profile/blocked"
            className="inline-flex min-h-11 items-center text-xs text-[#a99b95] hover:text-[#e8be6c] hover:underline"
          >
            Voir les personnes bloquées
          </Link>
        </div>
        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-primary/40 p-4 text-sm">
            {error}
          </p>
        )}
        {matches === null && !error && <p className="text-sm text-[#d4c6bf]">Chargement…</p>}
        {matches?.length === 0 && (
          <div className="rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-8 text-center text-sm text-[#d4c6bf]">
            Pas encore de discussion. Va faire un tour du côté de la{" "}
            <Link to="/discover" className="text-primary hover:underline">
              découverte
            </Link>{" "}
            !
          </div>
        )}
        <ul className="space-y-3">
          {matches?.map((match) => (
            <li
              key={match.id}
              className="flex items-center gap-4 rounded-2xl border border-[#d6a85c]/20 bg-[#302425]/80 p-4"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#211819]">
                {match.photoUrl && (
                  <img
                    src={match.photoUrl}
                    alt={match.otherName}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">
                  {match.otherName}
                  {match.isPremium && (
                    <BadgeCheck
                      aria-label="Profil Premium vérifié"
                      className="h-4 w-4 shrink-0 text-[#e8be6c]"
                    />
                  )}
                  {match.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                      {match.unreadCount}
                    </span>
                  )}
                </p>
                <p className="inline-flex min-h-11 items-center text-xs text-[#a99b95]">
                  Coup de cœur le {new Date(match.matched_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <Link
                to="/messages/$matchId"
                params={{ matchId: match.id }}
                className="rounded-full bg-gradient-red px-4 py-2 text-xs font-medium uppercase tracking-wider text-primary-foreground"
              >
                Discuter
              </Link>
              <button
                onClick={() => void removeMatch(match.id)}
                aria-label="Supprimer ce coup de cœur"
                className="text-[#a99b95] hover:text-[#e8be6c]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
