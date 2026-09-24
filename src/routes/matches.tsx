import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { BadgeCheck, Ban, Bike, Heart, HeartCrack, KeyRound, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { requireAppAccess } from "@/lib/require-admin";
import { requireDatingIntent } from "@/lib/require-dating-intent";
import { sendPushNotification } from "@/lib/push";
import { supabase } from "@/lib/supabase";

type MatchRow = {
  id: string;
  matched_at: string;
  otherName: string;
  isPremium: boolean;
  photoUrl: string | null;
  unreadCount: number;
};

type LikedProfile = {
  id: string;
  first_name: string;
  birth_date: string;
  moto_brand: string | null;
  moto_model: string | null;
  moto_type: string | null;
  photoUrl: string | null;
};

export const Route = createFileRoute("/matches")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  component: Matches,
  beforeLoad: async () => {
    await requireAppAccess();
    await requireDatingIntent();
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
});

function getAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) years--;
  return years;
}

function Matches() {
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [waitingProfiles, setWaitingProfiles] = useState<LikedProfile[] | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [swipingProfileId, setSwipingProfileId] = useState<string | null>(null);
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

    const [{ data: account, error: accountError }, { data: rows, error: rowsError }] =
      await Promise.all([
        supabase.from("profiles").select("is_premium").eq("id", user.id).maybeSingle(),
        supabase
          .from("matches")
          .select("id, matched_at, profile_a_id, profile_b_id, status")
          .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`)
          .eq("status", "mutual")
          .order("matched_at", { ascending: false }),
      ]);

    if (accountError || rowsError) {
      setError("Impossible de charger tes coups de cœur.");
      setMatches([]);
      setWaitingProfiles([]);
      return;
    }

    const premium = account?.is_premium === true;
    setIsPremium(premium);
    const otherIds = (rows ?? []).map((row) =>
      row.profile_a_id === user.id ? row.profile_b_id : row.profile_a_id,
    );
    const names = new Map<string, string>();
    const premiumStatuses = new Map<string, boolean>();
    const photos = new Map<string, string>();
    if (otherIds.length) {
      const [{ data: profiles }, { data: photoRows }] = await Promise.all([
        supabase.from("profiles").select("id, first_name, is_premium").in("id", otherIds),
        supabase
          .from("profile_photos")
          .select("profile_id, storage_path, position")
          .in("profile_id", otherIds)
          .order("position", { ascending: true }),
      ]);
      for (const profile of profiles ?? []) {
        names.set(profile.id, profile.first_name);
        premiumStatuses.set(profile.id, profile.is_premium === true);
      }
      for (const photo of photoRows ?? []) {
        if (!photos.has(photo.profile_id)) {
          photos.set(
            photo.profile_id,
            supabase.storage.from("profile-photos").getPublicUrl(photo.storage_path).data.publicUrl,
          );
        }
      }
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

    if (!premium) {
      setWaitingProfiles([]);
      return;
    }

    const { data: likedRows, error: likesError } = await supabase.rpc("who_liked_me");
    if (likesError) {
      setError("Impossible de charger les personnes en attente pour le moment.");
      setWaitingProfiles([]);
      return;
    }

    const likedProfiles = (likedRows ?? []) as Omit<LikedProfile, "photoUrl">[];
    const likedPhotos = new Map<string, string>();
    if (likedProfiles.length) {
      const { data: photoRows } = await supabase
        .from("profile_photos")
        .select("profile_id, storage_path, position")
        .in(
          "profile_id",
          likedProfiles.map((profile) => profile.id),
        )
        .order("position", { ascending: true });
      for (const photo of photoRows ?? []) {
        if (!likedPhotos.has(photo.profile_id)) {
          likedPhotos.set(
            photo.profile_id,
            supabase.storage.from("profile-photos").getPublicUrl(photo.storage_path).data.publicUrl,
          );
        }
      }
    }
    setWaitingProfiles(
      likedProfiles.map((profile) => ({
        ...profile,
        photoUrl: likedPhotos.get(profile.id) ?? null,
      })),
    );
  }

  async function answerLike(profile: LikedProfile, liked: boolean) {
    if (!supabase || swipingProfileId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setError("");
    setSwipingProfileId(profile.id);
    const { error: swipeError } = await supabase
      .from("swipes")
      .insert({ swiper_id: user.id, swiped_id: profile.id, liked });
    if (swipeError) {
      setError("Ton choix n'a pas pu être enregistré.");
      setSwipingProfileId(null);
      return;
    }

    if (liked) {
      void sendPushNotification(
        profile.id,
        "Nouveau coup de cœur sur Motards de Cœur ! 🎉",
        "Quelqu'un a eu un coup de cœur pour toi. Va y jeter un œil !",
      );
    }
    setSwipingProfileId(null);
    await load();
  }

  async function removeMatch(id: string) {
    if (!supabase) return;
    if (!window.confirm("Supprimer cette conversation et ce coup de cœur ?")) return;
    await supabase.from("matches").delete().eq("id", id);
    await load();
  }

  return (
    <Layout>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <div className="mt-3 mb-8 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-3xl sm:text-4xl">Coup de cœur</h1>
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

        {isPremium && (
          <section aria-labelledby="waiting-title" className="mb-12">
            <h2 id="waiting-title" className="font-display text-2xl text-[#fff9f0]">
              En attente de ta réponse
              {waitingProfiles !== null && ` (${waitingProfiles.length})`}
            </h2>
            {waitingProfiles === null && !error && (
              <p className="mt-4 text-sm text-[#d4c6bf]">Chargement…</p>
            )}
            {waitingProfiles?.length === 0 && (
              <div className="mt-5 rounded-2xl border border-[#d6a85c]/20 bg-[#302425]/80 p-8 text-center">
                <HeartCrack className="mx-auto h-12 w-12 text-[#e2b45f]" aria-hidden="true" />
                <p className="mt-4 text-sm text-[#d4c6bf]">
                  Personne n'attend encore ta réponse. Reviens bientôt !
                </p>
              </div>
            )}
            {waitingProfiles && waitingProfiles.length > 0 && (
              <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {waitingProfiles.map((profile) => (
                  <li key={profile.id}>
                    <article className="h-full overflow-hidden rounded-2xl border border-[#d6a85c]/20 bg-[#302425]/80">
                      <div className="aspect-[4/3] bg-[#211819]">
                        {profile.photoUrl ? (
                          <img
                            src={profile.photoUrl}
                            alt={`Photo de ${profile.first_name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center">
                            <Heart className="h-10 w-10 text-[#e8be6c]/50" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-display text-2xl">
                          {profile.first_name}, {getAge(profile.birth_date)} ans
                        </h3>
                        <p className="mt-2 flex items-center gap-2 text-sm text-[#d4c6bf]">
                          <Bike className="h-4 w-4 shrink-0 text-[#e8be6c]" aria-hidden="true" />
                          {[profile.moto_type, profile.moto_brand, profile.moto_model]
                            .filter(Boolean)
                            .join(" · ") || "Moto non renseignée"}
                        </p>
                        <div className="mt-5 flex justify-center gap-6">
                          <button
                            type="button"
                            onClick={() => void answerLike(profile, false)}
                            disabled={swipingProfileId !== null}
                            aria-label={`Passer ${profile.first_name}`}
                            className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-[#281e1f] text-[#d4c6bf] transition hover:scale-105 disabled:cursor-wait disabled:opacity-50"
                          >
                            <Ban aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void answerLike(profile, true)}
                            disabled={swipingProfileId !== null}
                            aria-label={`J'aime ${profile.first_name}`}
                            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-red text-primary-foreground shadow-glow transition hover:scale-105 disabled:cursor-wait disabled:opacity-50"
                          >
                            <KeyRound aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section aria-labelledby="confirmed-title">
          <h2 id="confirmed-title" className="mb-5 font-display text-2xl text-[#fff9f0]">
            Coups de cœur confirmés{matches !== null && ` (${matches.length})`}
          </h2>
          {matches === null && !error && <p className="text-sm text-[#d4c6bf]">Chargement…</p>}
          {matches?.length === 0 && (
            <div className="rounded-2xl border border-[#d6a85c]/20 bg-[#302425]/80 p-8 text-center sm:p-10">
              <Heart
                className="mx-auto h-16 w-16 text-[#e2b45f]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h3 className="mt-5 font-display text-2xl text-[#fff9f0]">
                Ton prochain coup de cœur
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[#d4c6bf]">
                Pas encore de coup de cœur confirmé. Va faire un tour du côté des{" "}
                <Link to="/discover" className="text-primary hover:underline">
                  rencontres
                </Link>{" "}
                !
              </p>
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
      </section>
    </Layout>
  );
}
