import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { requireAppAccess } from "@/lib/require-admin";
import { supabase } from "@/lib/supabase";

type NewMatch = {
  id: string;
  otherName: string;
  photoUrl: string | null;
};

export const Route = createFileRoute("/matches/new")({
  ssr: false,
  component: NewMatches,
  beforeLoad: async () => {
    await requireAppAccess();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
});

function NewMatches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<NewMatch[] | null>(null);
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    if (!supabase) return setError("Supabase n'est pas configuré.");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data: rows, error: rowsError } = await supabase
      .from("matches")
      .select("id, matched_at, profile_a_id, profile_b_id, seen_by_a_at, seen_by_b_at")
      .or(`profile_a_id.eq.${auth.user.id},profile_b_id.eq.${auth.user.id}`)
      .order("matched_at", { ascending: false });
    if (rowsError) {
      setError("Impossible de charger tes nouveaux coups de cœur.");
      setMatches([]);
      return;
    }

    const unseenRows = (rows ?? []).filter((row) =>
      row.profile_a_id === auth.user?.id ? row.seen_by_a_at === null : row.seen_by_b_at === null,
    );
    const otherIds = unseenRows.map((row) =>
      row.profile_a_id === auth.user?.id ? row.profile_b_id : row.profile_a_id,
    );
    const names = new Map<string, string>();
    const photos = new Map<string, string>();

    if (otherIds.length) {
      const [{ data: profiles }, { data: photoRows }] = await Promise.all([
        supabase.from("profiles").select("id, first_name").in("id", otherIds),
        supabase
          .from("profile_photos")
          .select("profile_id, storage_path, position")
          .in("profile_id", otherIds)
          .order("position", { ascending: true }),
      ]);
      for (const profile of profiles ?? []) names.set(profile.id, profile.first_name);
      for (const photo of photoRows ?? []) {
        if (!photos.has(photo.profile_id)) {
          photos.set(
            photo.profile_id,
            supabase.storage.from("profile-photos").getPublicUrl(photo.storage_path).data.publicUrl,
          );
        }
      }
    }

    setMatches(
      unseenRows.map((row) => {
        const otherId = row.profile_a_id === auth.user?.id ? row.profile_b_id : row.profile_a_id;
        return {
          id: row.id,
          otherName: names.get(otherId) ?? "Motard(e)",
          photoUrl: photos.get(otherId) ?? null,
        };
      }),
    );
  }

  async function sayHello(matchId: string) {
    if (!supabase || openingId) return;
    setOpeningId(matchId);
    setError("");
    const { error: rpcError } = await supabase.rpc("mark_match_seen", {
      p_match_id: matchId,
    });
    if (rpcError) {
      setError("Impossible d'ouvrir ce coup de cœur. Réessaie dans un instant.");
      setOpeningId(null);
      return;
    }
    await navigate({ to: "/messages/$matchId", params: { matchId } });
  }

  return (
    <Layout>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <h1 className="mb-6 mt-3 font-display text-3xl sm:text-4xl">
          Nouveaux coups de cœur{matches !== null && ` (${matches.length})`}
        </h1>
        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-primary/40 p-4 text-sm">
            {error}
          </p>
        )}
        {matches === null && !error && <p className="text-sm text-[#d4c6bf]">Chargement…</p>}
        {matches?.length === 0 && (
          <div className="rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-8 text-center text-sm text-[#d4c6bf]">
            <Heart className="mx-auto mb-3 h-7 w-7 text-[#e8be6c]" aria-hidden="true" />
            Pas de nouveau coup de cœur pour le moment.
          </div>
        )}
        <ul className="grid gap-4 sm:grid-cols-2">
          {matches?.map((match) => (
            <li
              key={match.id}
              className="overflow-hidden rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/90"
            >
              <div className="aspect-[4/3] bg-[#211819]">
                {match.photoUrl ? (
                  <img
                    src={match.photoUrl}
                    alt={match.otherName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-[#a99b95]">
                    <Heart className="h-10 w-10" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <p className="truncate text-lg font-medium">{match.otherName}</p>
                <button
                  type="button"
                  disabled={openingId !== null}
                  onClick={() => void sayHello(match.id)}
                  className="shrink-0 rounded-full bg-gradient-red px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-primary-foreground disabled:opacity-60"
                >
                  {openingId === match.id ? "Ouverture…" : "Dire bonjour"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
