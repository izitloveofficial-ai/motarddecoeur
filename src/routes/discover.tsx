import { createFileRoute, redirect } from "@tanstack/react-router";
import { Flag, Heart, ShieldOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/lib/supabase";

const reportReasons = [
  ["profil_faux", "Faux profil / usurpation"],
  ["contenu_inapproprie", "Contenu ou photo inapproprié"],
  ["comportement", "Comportement déplacé"],
  ["spam", "Spam ou arnaque"],
  ["autre", "Autre"],
] as const;

const lookingForOptions = [
  ["rencontre_serieuse", "Une rencontre sérieuse"],
  ["balades_moto", "Des balades moto"],
  ["amitie", "De l'amitié"],
  ["communaute_motards", "Une communauté de motards"],
  ["indecis", "Je ne sais pas encore"],
] as const;

type Filters = { minAge: string; maxAge: string; lookingFor: string; maxKm: string };
const defaultFilters: Filters = { minAge: "", maxAge: "", lookingFor: "", maxKm: "" };

type Candidate = {
  id: string;
  first_name: string;
  birth_date: string;
  bio: string | null;
  moto_brand: string | null;
  moto_model: string | null;
  looking_for: string | null;
  distance_km: number | null;
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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    void loadCandidates();
  }, [filters]);

  async function loadCandidates() {
    if (!supabase) return setError("Supabase n'est pas configuré.");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCandidates(null);
    setIndex(0);
    const { data: profiles, error: profilesError } = await supabase.rpc("nearby_profiles", {
      max_km: filters.maxKm ? Number(filters.maxKm) : null,
      p_looking_for: filters.lookingFor || null,
      p_min_age: filters.minAge ? Number(filters.minAge) : null,
      p_max_age: filters.maxAge ? Number(filters.maxAge) : null,
      p_limit: 20,
    });
    if (profilesError) {
      setError("Impossible de charger les profils pour le moment.");
      setCandidates([]);
      return;
    }
    const filtered = (profiles ?? []) as Omit<Candidate, "photoUrl">[];
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

  async function blockCurrent() {
    if (!supabase || !candidates?.[index]) return;
    const current = candidates[index];
    if (
      !window.confirm(`Bloquer ${current.first_name} ? Cette personne ne pourra plus te contacter.`)
    )
      return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error: blockError } = await supabase
      .from("blocks")
      .insert({ blocker_id: user.id, blocked_id: current.id });
    if (blockError) {
      setError("Le blocage n'a pas pu être enregistré.");
      return;
    }
    setNotice(`${current.first_name} a été bloqué(e).`);
    setReportOpen(false);
    setIndex((value) => value + 1);
  }

  async function submitReport() {
    if (!supabase || !candidates?.[index] || !reportReason) return;
    const current = candidates[index];
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error: reportError } = await supabase
      .from("reports")
      .insert({ reporter_id: user.id, reported_id: current.id, reason: reportReason });
    if (reportError) {
      setError("Le signalement n'a pas pu être envoyé.");
      return;
    }
    setNotice("Signalement envoyé, merci — notre équipe va l'examiner.");
    setReportOpen(false);
    setReportReason("");
  }

  useEffect(() => {
    setReportOpen(false);
    setReportReason("");
  }, [index]);

  const current = candidates?.[index];
  return (
    <Layout>
      <section className="mx-auto max-w-md px-6 py-12 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <div className="mt-3 mb-6 flex items-center justify-between">
          <h1 className="font-display text-4xl">Découverte</h1>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-wider text-[#d4c6bf] hover:border-[#e2b45f]/60"
          >
            Filtres
          </button>
        </div>
        {filtersOpen && (
          <div className="mb-6 grid gap-4 rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-5 sm:grid-cols-3">
            <label className="text-sm font-medium">
              Âge min.
              <input
                type="number"
                min={18}
                max={99}
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#302526] px-3 py-2 text-sm"
                value={filters.minAge}
                onChange={(e) => setFilters((f) => ({ ...f, minAge: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium">
              Âge max.
              <input
                type="number"
                min={18}
                max={99}
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#302526] px-3 py-2 text-sm"
                value={filters.maxAge}
                onChange={(e) => setFilters((f) => ({ ...f, maxAge: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium">
              Tu recherches
              <select
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#302526] px-3 py-2 text-sm"
                value={filters.lookingFor}
                onChange={(e) => setFilters((f) => ({ ...f, lookingFor: e.target.value }))}
              >
                <option value="">Tous</option>
                {lookingForOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Distance max. (km)
              <input
                type="number"
                min={1}
                max={2000}
                placeholder="Sans limite"
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#302526] px-3 py-2 text-sm"
                value={filters.maxKm}
                onChange={(e) => setFilters((f) => ({ ...f, maxKm: e.target.value }))}
              />
            </label>
            {(filters.minAge || filters.maxAge || filters.lookingFor || filters.maxKm) && (
              <button
                onClick={() => setFilters(defaultFilters)}
                className="text-left text-xs text-[#a99b95] hover:text-[#e8be6c] sm:col-span-3"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
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
              {current.distance_km !== null && current.distance_km !== undefined && (
                <p className="mt-1 text-xs text-[#a99b95]">à environ {current.distance_km} km</p>
              )}
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
              <div className="mt-5 flex items-center justify-center gap-5 text-xs text-[#a99b95]">
                <button
                  onClick={() => setReportOpen((v) => !v)}
                  className="flex items-center gap-1.5 hover:text-[#e8be6c]"
                >
                  <Flag className="h-3.5 w-3.5" /> Signaler
                </button>
                <button
                  onClick={() => void blockCurrent()}
                  className="flex items-center gap-1.5 hover:text-[#e8be6c]"
                >
                  <ShieldOff className="h-3.5 w-3.5" /> Bloquer
                </button>
              </div>
              {reportOpen && (
                <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-[#241b1c] p-4">
                  <select
                    className="w-full rounded-lg border border-white/15 bg-[#302526] px-3 py-2 text-sm"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  >
                    <option value="">Motif du signalement…</option>
                    {reportReasons.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => void submitReport()}
                    disabled={!reportReason}
                    className="w-full rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40"
                  >
                    Envoyer le signalement
                  </button>
                </div>
              )}
            </div>
          </article>
        )}
      </section>
    </Layout>
  );
}
