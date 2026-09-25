import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Ban,
  Bike,
  Flag,
  Heart,
  KeyRound,
  MessageCircle,
  RotateCcw,
  ShieldOff,
} from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { DoubleHeartIcon } from "@/components/icons/DoubleHeartIcon";
import { Layout } from "@/components/Layout";
import { Slider } from "@/components/ui/slider";
import { requireAppAccess } from "@/lib/require-admin";
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

const hairColorOptions = [
  ["blonds", "Blonds"],
  ["chatains", "Châtains"],
  ["bruns", "Bruns"],
  ["roux", "Roux"],
  ["noirs", "Noirs"],
  ["gris_blancs", "Gris ou blancs"],
  ["autre", "Autre"],
] as const;
const smokerOptions = [
  ["non", "Non"],
  ["occasionnellement", "Occasionnellement"],
  ["oui", "Oui"],
] as const;
const relationshipGoalOptions = [
  ["long_terme", "Relation à long terme"],
  ["court_terme", "Relation à court terme"],
  ["rien_de_serieux", "Rien de sérieux"],
  ["amis", "Amitiés"],
  ["pas_sur", "Pas encore sûr(e)"],
] as const;
const relationshipStyleOptions = [
  ["monogame", "Relation monogame"],
  ["relation_libre", "Relation libre"],
  ["polyamoureuse", "Relation polyamoureuse"],
] as const;
const zodiacSignOptions = [
  ["belier", "Bélier"],
  ["taureau", "Taureau"],
  ["gemeaux", "Gémeaux"],
  ["cancer", "Cancer"],
  ["lion", "Lion"],
  ["vierge", "Vierge"],
  ["balance", "Balance"],
  ["scorpion", "Scorpion"],
  ["sagittaire", "Sagittaire"],
  ["capricorne", "Capricorne"],
  ["verseau", "Verseau"],
  ["poissons", "Poissons"],
] as const;
const childrenStatusOptions = [
  ["pas_denfants", "Sans enfants"],
  ["a_des_enfants", "A des enfants"],
  ["veut_des_enfants", "Veut des enfants"],
  ["pas_sur", "Pas encore sûr(e)"],
] as const;
const drinkingHabitOptions = [
  ["weekend", "Le week-end"],
  ["soirees", "En soirée"],
  ["occasions", "Pour les grandes occasions"],
  ["jamais", "Jamais"],
] as const;
const sportHabitOptions = [
  ["tous_les_jours", "Tous les jours"],
  ["souvent", "Souvent"],
  ["parfois", "Parfois"],
  ["accro", "Accro au sport"],
  ["occasionnel", "Pratique occasionnelle"],
  ["jamais", "Jamais"],
] as const;

type Filters = {
  minAge: string;
  maxAge: string;
  maxKm: string;
  minHeight: string;
  maxHeight: string;
  hairColor: string;
  smoker: string;
  relationshipGoal: string;
  relationshipStyle: string;
  zodiacSign: string;
  childrenStatus: string;
  drinkingHabit: string;
  sportHabit: string;
};
const defaultFilters: Filters = {
  minAge: "",
  maxAge: "",
  maxKm: "",
  minHeight: "",
  maxHeight: "",
  hairColor: "",
  smoker: "",
  relationshipGoal: "",
  relationshipStyle: "",
  zodiacSign: "",
  childrenStatus: "",
  drinkingHabit: "",
  sportHabit: "",
};

const MIN_AGE = 18;
const MAX_AGE = 99;
const MAX_DISTANCE_KM = 500;

type Candidate = {
  id: string;
  first_name: string;
  birth_date: string;
  bio: string | null;
  moto_brand: string | null;
  moto_model: string | null;
  looking_for: string | null;
  distance_km: number | null;
  compatibility_score: number;
  is_premium: boolean;
  photoUrl: string | null;
  prompts: { question: string; answer: string }[];
};

export const Route = createFileRoute("/discover")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  component: Discover,
  beforeLoad: async () => {
    await requireAppAccess();
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
  const navigate = useNavigate();
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
  const [sendingSuperLike, setSendingSuperLike] = useState(false);
  const [openingConversation, setOpeningConversation] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const dragStartX = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const likeAnimationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void loadCandidates();
  }, [filters]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;

    // Le statut Premium est relu à chaque changement de session : un premier
    // appel lancé avant la restauration de la session (ou un échec réseau
    // passager) laissait auparavant `isPremium` à false sans aucun message.
    async function loadPremiumStatus(userId: string | undefined, attempt = 0) {
      if (!userId) return;
      const { data: profile, error: premiumError } = await client
        .from("profiles")
        .select("is_premium")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (premiumError || !profile) {
        console.error("Statut Premium illisible", premiumError?.message ?? "profil introuvable");
        if (attempt < 2) setTimeout(() => void loadPremiumStatus(userId, attempt + 1), 1500);
        return;
      }
      setIsPremium(profile.is_premium === true);
    }

    void client.auth.getSession().then(({ data }) => loadPremiumStatus(data.session?.user.id));
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        // Différé pour ne pas appeler la base depuis le rappel d'authentification.
        setTimeout(() => void loadPremiumStatus(session?.user.id), 0);
      }
      if (event === "SIGNED_OUT") setIsPremium(false);
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
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
      p_min_age: filters.minAge ? Number(filters.minAge) : null,
      p_max_age: filters.maxAge ? Number(filters.maxAge) : null,
      p_min_height: filters.minHeight ? Number(filters.minHeight) : null,
      p_max_height: filters.maxHeight ? Number(filters.maxHeight) : null,
      p_hair_color: filters.hairColor || null,
      p_smoker: filters.smoker || null,
      p_relationship_goal: filters.relationshipGoal || null,
      p_relationship_style: filters.relationshipStyle || null,
      p_zodiac_sign: filters.zodiacSign || null,
      p_children_status: filters.childrenStatus || null,
      p_drinking_habit: filters.drinkingHabit || null,
      p_sport_habit: filters.sportHabit || null,
      p_limit: 20,
    });
    if (profilesError) {
      setError("Impossible de charger les profils pour le moment.");
      setCandidates([]);
      return;
    }
    const filtered = (profiles ?? []) as Omit<Candidate, "photoUrl" | "prompts">[];
    const targetedProfileId = window.sessionStorage.getItem("discover-target-profile");
    if (targetedProfileId) {
      const targetedIndex = filtered.findIndex((profile) => profile.id === targetedProfileId);
      if (targetedIndex >= 0) {
        const [targetedProfile] = filtered.splice(targetedIndex, 1);
        filtered.unshift(targetedProfile);
      }
      window.sessionStorage.removeItem("discover-target-profile");
    }
    const photosByProfile = new Map<string, string>();
    const promptsByProfile = new Map<string, { question: string; answer: string }[]>();
    if (filtered.length) {
      const profileIds = filtered.map((profile) => profile.id);
      const [{ data: photos }, { data: promptAnswers, error: promptsError }] = await Promise.all([
        supabase
          .from("profile_photos")
          .select("profile_id, storage_path, position")
          .in("profile_id", profileIds)
          .order("position", { ascending: true }),
        supabase
          .from("profile_prompts")
          .select("profile_id, answer, position, prompts(question)")
          .in("profile_id", profileIds)
          .order("position", { ascending: true }),
      ]);
      for (const photo of photos ?? [])
        if (!photosByProfile.has(photo.profile_id)) {
          const { data } = supabase.storage.from("profile-photos").getPublicUrl(photo.storage_path);
          photosByProfile.set(photo.profile_id, data.publicUrl);
        }
      if (promptsError) setError("Les prompts de profil n'ont pas pu être chargés.");
      for (const item of promptAnswers ?? []) {
        const relatedPrompt = item.prompts as unknown as { question: string } | null;
        if (!relatedPrompt?.question) continue;
        const current = promptsByProfile.get(item.profile_id) ?? [];
        current.push({ question: relatedPrompt.question, answer: item.answer });
        promptsByProfile.set(item.profile_id, current);
      }
    }
    setCandidates(
      filtered.map((profile) => ({
        ...profile,
        photoUrl: photosByProfile.get(profile.id) ?? null,
        prompts: promptsByProfile.get(profile.id) ?? [],
      })),
    );
  }

  async function swipe(liked: boolean, isSuper = false) {
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
      .insert({ swiper_id: user.id, swiped_id: current.id, liked, is_super: isSuper });
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
    return true;
  }

  async function sendSuperLike() {
    if (!supabase || !isPremium || !candidates?.[index] || sendingSuperLike) return;
    const current = candidates[index];
    setError("");
    setNotice("");
    setSendingSuperLike(true);

    const { data: sentToday, error: quotaError } = await supabase.rpc("super_likes_sent_today");
    if (quotaError) {
      setError("Impossible de vérifier ton quota de Super coups de cœur.");
      setSendingSuperLike(false);
      return;
    }

    const quotaUsed = Number(sentToday ?? 0);
    const isChargeable = quotaUsed >= 3;
    if (
      isChargeable &&
      !window.confirm(
        "Tu as déjà envoyé tes 3 Super coups de cœur gratuits aujourd'hui. En envoyer un de plus sera facturé 3€ plus tard, dès que les paiements seront activés. Continuer ?",
      )
    ) {
      setSendingSuperLike(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSendingSuperLike(false);
      return;
    }

    const sent = await swipe(true, true);
    if (!sent) {
      setSendingSuperLike(false);
      return;
    }

    if (isChargeable) {
      const { error: chargeError } = await supabase.from("pending_charges").insert({
        user_id: user.id,
        amount: 3,
        reason: "super_coup_de_coeur_supplementaire",
        target_profile_id: current.id,
      });
      if (chargeError) {
        setError(
          "Le Super coup de cœur est parti, mais sa facturation en attente n'a pas pu être enregistrée. Contacte l'assistance.",
        );
        setSendingSuperLike(false);
        return;
      }
    }

    setNotice(`Super coup de cœur envoyé à ${current.first_name} !`);
    setSendingSuperLike(false);
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

  async function writeBeforeMatch() {
    if (!supabase || !candidates?.[index] || openingConversation) return;
    setOpeningConversation(true);
    setError("");
    const { data, error: conversationError } = await supabase.rpc("start_pending_conversation", {
      target_id: candidates[index].id,
    });

    if (conversationError) {
      setOpeningConversation(false);
      if (conversationError.message?.includes("premium_required")) {
        const message = "Passe Premium pour écrire avant d'attendre un like en retour.";
        window.location.assign(`/premium?message=${encodeURIComponent(message)}`);
        return;
      }
      setError("Impossible d'ouvrir cette conversation pour le moment.");
      return;
    }

    const matchId =
      typeof data === "string"
        ? data
        : data && typeof data === "object" && "id" in data
          ? String(data.id)
          : null;
    if (!matchId) {
      setOpeningConversation(false);
      setError("La conversation a été créée, mais elle n'a pas pu être ouverte.");
      return;
    }
    await navigate({ to: "/messages/$matchId", params: { matchId } });
  }

  const filterSelect = (
    name: keyof Filters,
    label: string,
    options: readonly (readonly [string, string])[],
  ) => (
    <label className="text-sm font-medium">
      <span className="flex items-center gap-2">
        {label} {!isPremium && <PremiumLabel />}
      </span>
      <select
        className="mt-2 w-full rounded-xl border border-white/15 bg-[#302526] px-4 py-3 text-sm text-[#fff9f0] outline-none transition focus:border-[#e2b45f]/70 disabled:cursor-not-allowed disabled:opacity-50"
        value={filters[name]}
        onChange={(event) => setFilters((current) => ({ ...current, [name]: event.target.value }))}
        disabled={!isPremium}
      >
        <option value="">Peu importe</option>
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );

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
          <div className="mb-6 grid gap-4 rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-5">
            <div className="text-sm font-medium">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  Âge {!isPremium && <PremiumLabel />}
                </span>
                <span className="text-[#e8be6c]">
                  {filters.minAge || MIN_AGE} — {filters.maxAge || MAX_AGE} ans
                </span>
              </div>
              <Slider
                className="mt-4"
                min={MIN_AGE}
                max={MAX_AGE}
                step={1}
                value={[
                  filters.minAge ? Number(filters.minAge) : MIN_AGE,
                  filters.maxAge ? Number(filters.maxAge) : MAX_AGE,
                ]}
                onValueChange={([minAge, maxAge]) =>
                  setFilters((current) => ({
                    ...current,
                    minAge: minAge === MIN_AGE ? "" : String(minAge),
                    maxAge: maxAge === MAX_AGE ? "" : String(maxAge),
                  }))
                }
                disabled={!isPremium}
                thumbLabels={["Âge minimum", "Âge maximum"]}
                trackClassName="bg-[#e2b45f]/20"
                rangeClassName="bg-[#e2b45f]"
                thumbClassName="h-5 w-5 border-[#d6a85c] bg-[#fff9f0] focus-visible:ring-[#e2b45f]"
              />
            </div>
            <div className="text-sm font-medium">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  Distance max. {!isPremium && <PremiumLabel />}
                </span>
                <span className="text-[#e8be6c]">
                  {filters.maxKm ? `${filters.maxKm} km` : "Sans limite"}
                </span>
              </div>
              <Slider
                className="mt-4"
                min={5}
                max={MAX_DISTANCE_KM}
                step={5}
                value={[filters.maxKm ? Number(filters.maxKm) : MAX_DISTANCE_KM]}
                onValueChange={([maxKm]) =>
                  setFilters((current) => ({
                    ...current,
                    maxKm: maxKm === MAX_DISTANCE_KM ? "" : String(maxKm),
                  }))
                }
                disabled={!isPremium}
                thumbLabels={["Distance maximale"]}
                trackClassName="bg-[#e2b45f]/20"
                rangeClassName="bg-[#e2b45f]"
                thumbClassName="h-5 w-5 border-[#d6a85c] bg-[#fff9f0] focus-visible:ring-[#e2b45f]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  Taille minimum {!isPremium && <PremiumLabel />}
                </span>
                <input
                  className="mt-2 w-full rounded-xl border border-white/15 bg-[#302526] px-4 py-3 text-sm text-[#fff9f0] outline-none transition placeholder:text-[#a99b95] focus:border-[#e2b45f]/70 disabled:cursor-not-allowed disabled:opacity-50"
                  type="number"
                  inputMode="numeric"
                  min={100}
                  max={250}
                  placeholder="Peu importe"
                  value={filters.minHeight}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, minHeight: event.target.value }))
                  }
                  disabled={!isPremium}
                  aria-label="Taille minimum en centimètres"
                />
              </label>
              <label className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  Taille maximum {!isPremium && <PremiumLabel />}
                </span>
                <input
                  className="mt-2 w-full rounded-xl border border-white/15 bg-[#302526] px-4 py-3 text-sm text-[#fff9f0] outline-none transition placeholder:text-[#a99b95] focus:border-[#e2b45f]/70 disabled:cursor-not-allowed disabled:opacity-50"
                  type="number"
                  inputMode="numeric"
                  min={100}
                  max={250}
                  placeholder="Peu importe"
                  value={filters.maxHeight}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, maxHeight: event.target.value }))
                  }
                  disabled={!isPremium}
                  aria-label="Taille maximum en centimètres"
                />
              </label>
              {filterSelect("hairColor", "Couleur de cheveux", hairColorOptions)}
              {filterSelect("smoker", "Fumeur", smokerOptions)}
              {filterSelect("relationshipGoal", "Recherche une relation", relationshipGoalOptions)}
              {filterSelect("relationshipStyle", "Ouvert(e) à", relationshipStyleOptions)}
              {filterSelect("zodiacSign", "Signe astrologique", zodiacSignOptions)}
              {filterSelect("childrenStatus", "Enfants", childrenStatusOptions)}
              {filterSelect("drinkingHabit", "Alcool", drinkingHabitOptions)}
              {filterSelect("sportHabit", "Sport", sportHabitOptions)}
            </div>
            {Object.values(filters).some(Boolean) && (
              <button
                onClick={() => setFilters(defaultFilters)}
                className="text-left text-xs text-[#a99b95] hover:text-[#e8be6c]"
              >
                Réinitialiser les filtres
              </button>
            )}
            {!isPremium && (
              <p className="text-xs text-[#a99b95]">
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
          <div className="rounded-2xl border border-[#d6a85c]/20 bg-[#302425]/80 p-8 text-center sm:p-10">
            <Bike
              className="mx-auto h-16 w-16 text-[#e2b45f]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <h2 className="mt-5 font-display text-2xl text-[#fff9f0]">La route est calme</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#d4c6bf]">
              Plus de nouveaux profils pour le moment. Reviens un peu plus tard !
            </p>
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
              {current.compatibility_score > 0 && (
                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                    current.compatibility_score >= 70
                      ? "border-[#e2b45f]/50 bg-[#e2b45f]/10 text-[#e8be6c]"
                      : "border-white/15 bg-white/5 text-[#d4c6bf]"
                  }`}
                >
                  {current.compatibility_score}% compatible
                </span>
              )}
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
              {current.prompts.length > 0 && (
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#d4c6bf]">
                  {current.prompts.map((prompt) => (
                    <div key={prompt.question}>
                      <p className="font-semibold text-[#fff9f0]">{prompt.question}</p>
                      <p>{prompt.answer}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-3 sm:gap-6">
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
                {isPremium && (
                  <button
                    type="button"
                    onClick={() => void sendSuperLike()}
                    disabled={sendingSuperLike}
                    aria-label={`Envoyer un Super coup de cœur à ${current.first_name}`}
                    title="3 Super coups de cœur gratuits par jour"
                    className="flex h-16 min-w-16 items-center justify-center gap-2 rounded-full border border-[#e2b45f]/60 bg-[#e2b45f]/15 px-4 text-sm font-semibold text-[#f4cf7a] transition hover:scale-105 disabled:cursor-wait disabled:opacity-50"
                  >
                    <DoubleHeartIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">
                      {sendingSuperLike ? "Envoi…" : "Super coup de cœur"}
                    </span>
                  </button>
                )}
                {isPremium && (
                  <button
                    type="button"
                    onClick={() => void writeBeforeMatch()}
                    disabled={openingConversation}
                    aria-label={`Écrire à ${current.first_name} avant le match`}
                    className="flex h-16 min-w-16 items-center justify-center gap-2 rounded-full border border-[#e2b45f]/60 bg-[#302425] px-5 text-sm font-semibold text-[#e8be6c] transition hover:scale-105 disabled:cursor-wait disabled:opacity-50"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                    <span>{openingConversation ? "Ouverture…" : "Écrire"}</span>
                  </button>
                )}
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
