import { createFileRoute, redirect } from "@tanstack/react-router";
import { Heart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/lib/supabase";

type Candidate = {
  id: string;
  first_name: string;
  birth_date: string;
  bio: string | null;
  moto_brand: string | null;
  moto_model: string | null;
  photoUrl: string | null;
};

export const Route = createFileRoute("/discover")({
  component: Discover,
  beforeLoad: async () => {
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

function age(value: string) {
  const birth = new Date(value);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) years--;
  return years;
}

function Discover() {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadCandidates();
  }, []);

  async function loadCandidates() {
    if (!supabase) return setError("Supabase n'est pas configuré.");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: swipes } = await supabase
      .from("swipes")
      .select("swiped_id")
      .eq("swiper_id", user.id);
    const excluded = new Set([user.id, ...(swipes ?? []).map((swipe) => swipe.swiped_id)]);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, birth_date, bio, moto_brand, moto_model")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (profilesError) {
      setError("Impossible de charger les profils pour le moment.");
      setCandidates([]);
      return;
    }
    const filtered = (profiles ?? []).filter((profile) => !excluded.has(profile.id)).slice(0, 20);
    const photosByProfile = new Map<string, string>();
    if (filtered.length) {
      const { data: photos } = await supabase
        .from("profile_photos")
        .select("profile_id, storage_path, position")
        .in(
          "profile_id",
          filtered.map((profile) => profile.id),
        )
        .order("position", { ascending: true });
      for (const photo of photos ?? [])
        if (!photosByProfile.has(photo.profile_id)) {
          const { data } = supabase.storage.from("profile-photos").getPublicUrl(photo.storage_path);
          photosByProfile.set(photo.profile_id, data.publicUrl);
        }
    }
    setCandidates(
      filtered.map((profile) => ({
        ...profile,
        photoUrl: photosByProfile.get(profile.id) ?? null,
      })),
    );
  }

  async function swipe(liked: boolean) {
    if (!supabase || !candidates?.[index]) return;
    const current = candidates[index];
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setNotice("");
    setError("");
    const { error: swipeError } = await supabase
      .from("swipes")
      .insert({ swiper_id: user.id, swiped_id: current.id, liked });
    if (swipeError) {
      setError("Ton choix n'a pas pu être enregistré.");
      return;
    }
    if (liked) {
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(
          `and(profile_a_id.eq.${user.id},profile_b_id.eq.${current.id}),and(profile_a_id.eq.${current.id},profile_b_id.eq.${user.id})`,
        )
        .maybeSingle();
      if (match) setNotice(`C'est un match avec ${current.first_name} ! 🎉`);
    }
    setIndex((value) => value + 1);
  }

  const current = candidates?.[index];
  return (
    <Layout>
      <section className="mx-auto max-w-md px-6 py-12 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <h1 className="mt-3 mb-6 font-display text-4xl">Découverte</h1>
        {notice && (
          <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-center text-sm text-green-200">
            {notice}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm"
          >
            {error}
          </div>
        )}
        {candidates === null && !error && (
          <p className="text-sm text-[#d4c6bf]">Chargement des profils…</p>
        )}
        {candidates && !current && (
          <div className="rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-8 text-center text-sm text-[#d4c6bf]">
            Plus de nouveaux profils pour le moment. Reviens un peu plus tard !
          </div>
        )}
        {current && (
          <article className="overflow-hidden rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 shadow-[0_28px_80px_rgba(8,3,3,0.48)]">
            <div className="aspect-square bg-[#211819]">
              {current.photoUrl ? (
                <img
                  src={current.photoUrl}
                  alt={current.first_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#8c7a75]">
                  Pas de photo
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="font-display text-2xl">
                {current.first_name}, {age(current.birth_date)} ans
              </h2>
              {(current.moto_brand || current.moto_model) && (
                <p className="mt-1 text-sm text-[#e8be6c]">
                  {[current.moto_brand, current.moto_model].filter(Boolean).join(" ")}
                </p>
              )}
              {current.bio && (
                <p className="mt-3 text-sm leading-relaxed text-[#d4c6bf]">{current.bio}</p>
              )}
              <div className="mt-6 flex justify-center gap-6">
                <button
                  onClick={() => void swipe(false)}
                  aria-label="Passer"
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-[#281e1f] text-[#d4c6bf] transition hover:scale-105"
                >
                  <X />
                </button>
                <button
                  onClick={() => void swipe(true)}
                  aria-label="J'aime"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-red text-primary-foreground shadow-glow transition hover:scale-105"
                >
                  <Heart fill="currentColor" />
                </button>
              </div>
            </div>
          </article>
        )}
      </section>
    </Layout>
  );
}
