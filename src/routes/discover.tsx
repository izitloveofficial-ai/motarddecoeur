import { createFileRoute, redirect } from "@tanstack/react-router";
import { BadgeCheck, Ban, Bike, Flag, Heart, KeyRound, RotateCcw, ShieldOff } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Layout } from "@/components/Layout";
import { requireAdmin } from "@/lib/require-admin";
import { requireDatingIntent } from "@/lib/require-dating-intent";
import { sendPushNotification } from "@/lib/push";
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
const riderRoleOptions = [
  ["conducteur", "Conducteur"],
  ["conductrice", "Conductrice"],
  ["passager", "Passager"],
  ["passagere", "Passagère"],
] as const;
const experienceLevelOptions = [
  ["debutant", "Débutant"],
  ["intermediaire", "Intermédiaire"],
  ["experimente", "Expérimenté"],
  ["expert", "Expert"],
] as const;
const ridingPaceOptions = [
  ["tranquille", "Tranquille"],
  ["sportif", "Sportif"],
  ["mixte", "Mixte"],
] as const;
const motoTypeOptions = [
  ["routiere", "Routière"],
  ["sportive", "Sportive"],
  ["roadster", "Roadster"],
  ["trail", "Trail / Adventure"],
  ["custom", "Custom"],
  ["scooter", "Scooter"],
  ["autre", "Autre"],
] as const;

type Filters = {
  minAge: string;
  maxAge: string;
  lookingFor: string;
  maxKm: string;
  motoType: string;
  riderRole: string;
  experienceLevel: string;
  ridingPace: string;
};
const defaultFilters: Filters = {
  minAge: "",
  maxAge: "",
  lookingFor: "",
  maxKm: "",
  motoType: "",
  riderRole: "",
  experienceLevel: "",
  ridingPace: "",
};

type Candidate = {
  id: string;
  first_name: string;
  birth_date: string;
  bio: string | null;
  moto_brand: string | null;
  moto_model: string | null;
  looking_for: string | null;
  distance_km: number | null;
  is_premium: boolean;
  photoUrl: string | null;
};

export const Route = createFileRoute("/discover")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  component: Discover,
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
  const [matchName, setMatchName] = useState("");
  const [error, setError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [lastPassed, setLastPassed] = useState<Candidate | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const dragStartX = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const likeAnimationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void loadCandidates();
  }, [filters]);

  useEffect(() => {
    async function loadPremiumStatus() {
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .maybeSingle();
      setIsPremium(profile?.is_premium === true);
    }

    void loadPremiumStatus();
  }, []);

  async function loadCandidates() {
    if (!supabase) return setError("Supabase n'est pas configuré.");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCandidates(null);
    setIndex(0);
    setLastPassed(null);
    const { data: profiles, error: profilesError } = await supabase.rpc("nearby_profiles", {
      max_km: filters.maxKm ? Number(filters.maxKm) : null,
      p_looking_for: filters.lookingFor || null,
      p_min_age: filters.minAge ? Number(filters.minAge) : null,
      p_max_age: filters.maxAge ? Number(filters.maxAge) : null,
      p_limit: 20,
      p_moto_type: filters.motoType || null,
      p_rider_role: filters.riderRole || null,
      p_experience_level: filters.experienceLevel || null,
      p_riding_pace: filters.ridingPace || null,
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
      if (match) {
        setMatchName(current.first_name);
        void sendPushNotification(
          current.id,
          "Nouveau coup de cœur sur Motards de Cœur ! 🎉",
          "Quelqu'un a eu un coup de cœur pour toi. Va y jeter un œil !",
        );
      }
      setLastPassed(null);
    } else {
      setLastPassed(current);
    }
    setIndex((value) => value + 1);
  }

  async function undoLastPass() {
    if (!supabase || !lastPassed || index === 0) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error: undoError } = await supabase
      .from("swipes")
      .delete()
      .eq("swiper_id", user.id)
      .eq("swiped_id", lastPassed.id)
      .eq("liked", false);
    if (undoError) {
      setError("Impossible d'annuler ce choix.");
      return;
    }
    setIndex((value) => value - 1);
    setLastPassed(null);
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
    setDragOffset(0);
    setIsDragging(false);
    activePointerId.current = null;
  }, [index]);

  useEffect(
    () => () => {
      if (likeAnimationTimer.current) clearTimeout(likeAnimationTimer.current);
    },
    [],
  );

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    if ((event.target as HTMLElement).closest("button, select, input, a")) return;
    activePointerId.current = event.pointerId;
    dragStartX.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    if (activePointerId.current !== event.pointerId) return;
    setDragOffset(event.clientX - dragStartX.current);
  }

  function finishDrag(event: ReactPointerEvent<HTMLElement>) {
    if (activePointerId.current !== event.pointerId) return;
    const offset = event.clientX - dragStartX.current;
    const threshold = Math.min(100, (cardRef.current?.offsetWidth ?? 400) * 0.25);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointerId.current = null;
    setIsDragging(false);
    setDragOffset(0);

    if (Math.abs(offset) >= threshold) void swipe(offset > 0);
  }

  function cancelDrag(event: ReactPointerEvent<HTMLElement>) {
    if (activePointerId.current !== event.pointerId) return;
    activePointerId.current = null;
    setIsDragging(false);
    setDragOffset(0);
  }

  function likeFromButton() {
    if (likeAnimationTimer.current) clearTimeout(likeAnimationTimer.current);
    setJustLiked(true);
    likeAnimationTimer.current = setTimeout(() => setJustLiked(false), 300);
    void swipe(true);
  }

  const current = candidates?.[index];
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
              Continuer à swiper
            </button>
          </div>
        </div>
      )}
      <section className="mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <div className="mt-3 mb-6 flex items-center justify-between">
          <h1 className="font-display text-3xl sm:text-4xl">Rencontres</h1>
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
              <span className="flex items-center gap-2">
                Âge min. {!isPremium && <PremiumLabel />}
              </span>
              <input
                type="number"
                min={18}
                max={99}
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#302526] px-3 py-2 text-sm"
                value={filters.minAge}
                onChange={(e) => setFilters((f) => ({ ...f, minAge: e.target.value }))}
                disabled={!isPremium}
              />
            </label>
            <label className="text-sm font-medium">
              <span className="flex items-center gap-2">
                Âge max. {!isPremium && <PremiumLabel />}
              </span>
              <input
                type="number"
                min={18}
                max={99}
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#302526] px-3 py-2 text-sm"
                value={filters.maxAge}
                onChange={(e) => setFilters((f) => ({ ...f, maxAge: e.target.value }))}
                disabled={!isPremium}
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
              <span className="flex items-center gap-2">
                Distance max. (km) {!isPremium && <PremiumLabel />}
              </span>
              <input
                type="number"
                min={1}
                max={2000}
                placeholder="Sans limite"
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#302526] px-3 py-2 text-sm"
                value={filters.maxKm}
                onChange={(e) => setFilters((f) => ({ ...f, maxKm: e.target.value }))}
                disabled={!isPremium}
              />
            </label>
            <label className="text-sm font-medium">
              <span className="flex items-center gap-2">
                Type de moto {!isPremium && <PremiumLabel />}
              </span>
              <select
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#302526] px-3 py-2 text-sm"
                value={filters.motoType}
                onChange={(e) => setFilters((f) => ({ ...f, motoType: e.target.value }))}
                disabled={!isPremium}
              >
                <option value="">Tous</option>
                {motoTypeOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              <span className="flex items-center gap-2">
                Profil {!isPremium && <PremiumLabel />}
              </span>
              <select
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#302526] px-3 py-2 text-sm"
                value={filters.riderRole}
                onChange={(e) => setFilters((f) => ({ ...f, riderRole: e.target.value }))}
                disabled={!isPremium}
              >
                <option value="">Tous</option>
                {riderRoleOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              <span className="flex items-center gap-2">
                Niveau {!isPremium && <PremiumLabel />}
              </span>
              <select
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#302526] px-3 py-2 text-sm"
                value={filters.experienceLevel}
                onChange={(e) => setFilters((f) => ({ ...f, experienceLevel: e.target.value }))}
                disabled={!isPremium}
              >
                <option value="">Tous</option>
                {experienceLevelOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              <span className="flex items-center gap-2">
                Style de conduite {!isPremium && <PremiumLabel />}
              </span>
              <select
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#302526] px-3 py-2 text-sm"
                value={filters.ridingPace}
                onChange={(e) => setFilters((f) => ({ ...f, ridingPace: e.target.value }))}
                disabled={!isPremium}
              >
                <option value="">Tous</option>
                {ridingPaceOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {(filters.minAge ||
              filters.maxAge ||
              filters.lookingFor ||
              filters.maxKm ||
              filters.motoType ||
              filters.riderRole ||
              filters.experienceLevel ||
              filters.ridingPace) && (
              <button
                onClick={() => setFilters(defaultFilters)}
                className="text-left text-xs text-[#a99b95] hover:text-[#e8be6c] sm:col-span-3"
              >
                Réinitialiser les filtres
              </button>
            )}
            {!isPremium && (
              <p className="text-xs text-[#a99b95] sm:col-span-3">
                Filtres avancés réservés aux comptes Premium.
              </p>
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
          <article
            ref={cardRef}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={finishDrag}
            onPointerCancel={cancelDrag}
            className={`relative touch-pan-y select-none overflow-hidden rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 shadow-[0_28px_80px_rgba(8,3,3,0.48)] ${isDragging ? "cursor-grabbing" : "cursor-grab transition-transform duration-300 ease-out"}`}
            style={{ transform: `translateX(${dragOffset}px) rotate(${dragOffset / 20}deg)` }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-8 right-6 z-10 rotate-6 rounded-lg border-4 border-green-400 px-3 py-1 text-2xl font-black tracking-wider text-green-400"
              style={{ opacity: dragOffset > 0 ? Math.min(dragOffset / 100, 1) : 0 }}
            >
              J'AIME
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-8 left-6 z-10 -rotate-6 rounded-lg border-4 border-red-400 px-3 py-1 text-2xl font-black tracking-wider text-red-400"
              style={{ opacity: dragOffset < 0 ? Math.min(-dragOffset / 100, 1) : 0 }}
            >
              PASSER
            </div>
            <div className="aspect-square bg-[#211819]">
              {current.photoUrl ? (
                <img
                  src={current.photoUrl}
                  alt={current.first_name}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#8c7a75]">
                  Pas de photo
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="flex items-center gap-2 font-display text-2xl">
                {current.first_name}, {age(current.birth_date)} ans
                {current.is_premium && (
                  <BadgeCheck
                    aria-label="Profil Premium vérifié"
                    className="h-5 w-5 shrink-0 text-[#e8be6c]"
                  />
                )}
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
                  <Ban />
                </button>
                <button
                  onClick={likeFromButton}
                  aria-label="J'aime"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-red text-primary-foreground shadow-glow transition hover:scale-105"
                >
                  <KeyRound
                    className={`transition-transform duration-300 ${justLiked ? "rotate-[20deg]" : "rotate-0"}`}
                  />
                </button>
              </div>
              <div className="mt-5 flex items-center justify-center gap-5 text-xs text-[#a99b95]">
                {lastPassed && isPremium && (
                  <button
                    onClick={() => void undoLastPass()}
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Annuler
                  </button>
                )}
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

function PremiumLabel() {
  return (
    <span className="rounded-full border border-[#e2b45f]/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#e8be6c]">
      Premium
    </span>
  );
}
