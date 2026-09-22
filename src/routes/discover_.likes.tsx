import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { Ban, Bike, Crown, Heart, HeartCrack, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { requireAdmin } from "@/lib/require-admin";
import { requireDatingIntent } from "@/lib/require-dating-intent";
import { sendPushNotification } from "@/lib/push";
import { supabase } from "@/lib/supabase";

type LikedProfile = {
  id: string;
  first_name: string;
  birth_date: string;
  bio: string | null;
  moto_brand: string | null;
  moto_model: string | null;
  moto_type: string | null;
  liked_at: string;
  photoUrl: string | null;
};

export const Route = createFileRoute("/discover_/likes")({
  ssr: false,
  component: WhoLikedMe,
  beforeLoad: async () => {
    await requireAdmin();
    await requireDatingIntent();
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();
    if (!profile) throw redirect({ to: "/profile/setup" });
  },
});

function getAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) years--;
  return years;
}

function WhoLikedMe() {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<LikedProfile[] | null>(null);
  const [error, setError] = useState("");
  const [matchName, setMatchName] = useState("");
  const [swipingProfileId, setSwipingProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setError("Supabase n'est pas configuré.");
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: account, error: accountError } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .maybeSingle();
      if (accountError) {
        setError("Impossible de charger votre abonnement pour le moment.");
        return;
      }
      const premium = account?.is_premium === true;
      setIsPremium(premium);
      if (!premium) return;

      const { data, error: profilesError } = await supabase.rpc("who_liked_me");
      if (profilesError) {
        setError("Impossible de charger les coups de cœur pour le moment.");
        setProfiles([]);
        return;
      }

      const likedProfiles = (data ?? []) as Omit<LikedProfile, "photoUrl">[];
      const photos = new Map<string, string>();
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
          if (!photos.has(photo.profile_id)) {
            const { data: publicUrl } = supabase.storage
              .from("profile-photos")
              .getPublicUrl(photo.storage_path);
            photos.set(photo.profile_id, publicUrl.publicUrl);
          }
        }
      }
      setProfiles(
        likedProfiles.map((profile) => ({
          ...profile,
          photoUrl: photos.get(profile.id) ?? null,
        })),
      );
    }

    void load();
  }, []);

  async function swipe(profile: LikedProfile, liked: boolean) {
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
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(
          `and(profile_a_id.eq.${user.id},profile_b_id.eq.${profile.id}),and(profile_a_id.eq.${profile.id},profile_b_id.eq.${user.id})`,
        )
        .maybeSingle();
      if (match) {
        setMatchName(profile.first_name);
        void sendPushNotification(
          profile.id,
          "Nouveau coup de cœur sur Motards de Cœur ! 🎉",
          "Quelqu'un a eu un coup de cœur pour toi. Va y jeter un œil !",
        );
      }
    }

    setProfiles((current) => current?.filter((item) => item.id !== profile.id) ?? []);
    setSwipingProfileId(null);
  }

  return (
    <Layout>
      {matchName && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm animate-in fade-in-0"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#e2b45f]/40 bg-[#302425] p-8 text-center shadow-[0_0_80px_rgba(226,180,95,0.22)] animate-in zoom-in-95 fade-in-0">
            <div className="mb-6 flex items-center justify-center gap-5 text-[#e2b45f]">
              <Heart fill="currentColor" aria-hidden="true" className="h-11 w-11 animate-pulse" />
              <Bike aria-hidden="true" className="h-16 w-16 text-[#fff9f0]" strokeWidth={1.6} />
              <Heart
                fill="currentColor"
                aria-hidden="true"
                className="h-11 w-11 animate-pulse [animation-delay:200ms]"
              />
            </div>
            <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">
              La route vous réunit
            </span>
            <h2 id="match-title" className="mt-3 font-display text-3xl sm:text-4xl">
              C'est un coup de cœur avec {matchName} !
            </h2>
            <button
              type="button"
              autoFocus
              onClick={() => setMatchName("")}
              className="mt-8 rounded-full bg-gradient-red px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105"
            >
              Continuer
            </button>
          </div>
        </div>
      )}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">Qui m&apos;a liké</h1>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-primary/40 p-4 text-sm">
            {error}
          </p>
        )}
        {isPremium === null && !error && <p className="mt-6 text-sm text-[#d4c6bf]">Chargement…</p>}

        {isPremium === false && (
          <div className="mt-8 rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-8 text-center sm:p-12">
            <Crown className="mx-auto h-10 w-10 text-[#e8be6c]" aria-hidden="true" />
            <h2 className="mt-4 font-display text-2xl">Fonctionnalité Premium</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-[#d4c6bf]">
              Voyez qui vous a déjà mis un coup de cœur, avant même de swiper.
            </p>
            <Link
              to="/premium"
              className="mt-6 inline-flex min-h-11 items-center rounded-full bg-gradient-red px-6 py-3 text-sm font-medium uppercase tracking-wider text-primary-foreground no-underline"
            >
              Découvrir Premium
            </Link>
          </div>
        )}

        {isPremium && profiles === null && !error && (
          <p className="mt-6 text-sm text-[#d4c6bf]">Chargement des coups de cœur…</p>
        )}
        {isPremium && profiles?.length === 0 && (
          <div className="mt-8 rounded-2xl border border-[#d6a85c]/20 bg-[#302425]/80 p-8 text-center sm:p-10">
            <HeartCrack
              className="mx-auto h-16 w-16 text-[#e2b45f]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <h2 className="mt-5 font-display text-2xl text-[#fff9f0]">
              Pas encore de coup de cœur
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#d4c6bf]">
              Personne ne vous a encore liké. Revenez bientôt !
            </p>
          </div>
        )}
        {isPremium && profiles && profiles.length > 0 && (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <li key={profile.id}>
                <article className="group h-full overflow-hidden rounded-2xl border border-[#d6a85c]/20 bg-[#302425]/80 text-inherit transition hover:-translate-y-1 hover:border-[#d6a85c]/50">
                  <div className="aspect-[4/3] bg-[#211819]">
                    {profile.photoUrl ? (
                      <img
                        src={profile.photoUrl}
                        alt={`Photo de ${profile.first_name}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <Heart className="h-10 w-10 text-[#e8be6c]/50" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-2xl">
                      {profile.first_name}, {getAge(profile.birth_date)} ans
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-[#d4c6bf]">
                      <Bike className="h-4 w-4 shrink-0 text-[#e8be6c]" aria-hidden="true" />
                      {[profile.moto_type, profile.moto_brand, profile.moto_model]
                        .filter(Boolean)
                        .join(" · ") || "Moto non renseignée"}
                    </p>
                    <div className="mt-5 flex justify-center gap-6">
                      <button
                        type="button"
                        onClick={() => void swipe(profile, false)}
                        disabled={swipingProfileId !== null}
                        aria-label={`Passer ${profile.first_name}`}
                        className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-[#281e1f] text-[#d4c6bf] transition hover:scale-105 disabled:cursor-wait disabled:opacity-50"
                      >
                        <Ban aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void swipe(profile, true)}
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
    </Layout>
  );
}
