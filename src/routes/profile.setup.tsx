import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { CheckCircle2, LogOut, MapPin, ShieldCheck, Trash2, Upload } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { requireAdmin } from "@/lib/require-admin";
import { supabase } from "@/lib/supabase";

const genderOptions = [
  ["femme", "Femme"],
  ["homme", "Homme"],
  ["non_binaire", "Non-binaire"],
  ["prefere_ne_pas_dire", "Préfère ne pas dire"],
  ["autre", "Autre"],
] as const;
const lookingForOptions = [
  ["rencontre_serieuse", "Une rencontre sérieuse"],
  ["balades_moto", "Des balades moto"],
  ["amitie", "De l'amitié"],
  ["communaute_motards", "Une communauté de motards"],
  ["indecis", "Je ne sais pas encore"],
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

export const Route = createFileRoute("/profile/setup")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  component: ProfileSetup,
  beforeLoad: async () => {
    await requireAdmin();
    if (!supabase) throw redirect({ to: "/signup" });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/signup" });
  },
});

function eighteenYearsAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().slice(0, 10);
}

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/15 bg-[#302526] px-4 py-3 text-sm text-[#fff9f0] outline-none transition placeholder:text-[#a99b95] hover:border-[#d6a85c]/35 focus:border-[#e2b45f]/70 focus:ring-2 focus:ring-[#d9a441]/20";

type ProfileForm = {
  first_name: string;
  birth_date: string;
  gender: string;
  looking_for: string;
  moto_type: string;
  moto_brand: string;
  moto_model: string;
  bio: string;
  is_active: boolean;
};

type ExistingPhoto = {
  id: string;
  storage_path: string;
  position: number;
  publicUrl: string;
};

type Prompt = { id: string; question: string };
type PromptAnswer = { promptId: string; answer: string };

const emptyProfile: ProfileForm = {
  first_name: "",
  birth_date: "",
  gender: "",
  looking_for: "",
  moto_type: "",
  moto_brand: "",
  moto_model: "",
  bio: "",
  is_active: true,
};

function getNextStep(lookingFor: string) {
  switch (lookingFor) {
    case "balades_moto":
      return { to: "/rides" as const, label: "Voir les balades à venir" };
    case "communaute_motards":
      return { to: "/community" as const, label: "Découvrir la communauté" };
    case "amitie":
      return { to: "/discover" as const, label: "Rencontrer des motards" };
    default:
      return { to: "/discover" as const, label: "Découvrir des profils" };
  }
}

function ProfileSetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [isPremium, setIsPremium] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [availablePrompts, setAvailablePrompts] = useState<Prompt[]>([]);
  const [promptAnswers, setPromptAnswers] = useState<PromptAnswer[]>([]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;

    async function loadProfile() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setStatus("error");
        setFeedback("Session expirée. Reconnecte-toi puis réessaie.");
        return;
      }
      const [profileResult, photosResult, promptsResult, answersResult] = await Promise.all([
        client.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        client
          .from("profile_photos")
          .select("id, storage_path, position")
          .eq("profile_id", user.id)
          .order("position", { ascending: true }),
        client.from("prompts").select("id, question").eq("is_active", true),
        client
          .from("profile_prompts")
          .select("prompt_id, answer, position")
          .eq("profile_id", user.id)
          .order("position", { ascending: true }),
      ]);
      if (cancelled) return;
      if (profileResult.error || photosResult.error || promptsResult.error || answersResult.error) {
        setStatus("error");
        setFeedback("Impossible de charger ton profil. Recharge la page puis réessaie.");
        return;
      }
      if (profileResult.data) {
        const current = profileResult.data;
        setHasProfile(true);
        setIsPremium(current.is_premium === true);
        setProfile({
          first_name: current.first_name ?? "",
          birth_date: current.birth_date ? String(current.birth_date).slice(0, 10) : "",
          gender: current.gender ?? "",
          looking_for: current.looking_for ?? "",
          moto_type: current.moto_type ?? "",
          moto_brand: current.moto_brand ?? "",
          moto_model: current.moto_model ?? "",
          bio: current.bio ?? "",
          is_active: current.is_active ?? true,
        });
      }
      setExistingPhotos(
        (photosResult.data ?? []).map((photo) => ({
          ...photo,
          publicUrl: client.storage.from("profile-photos").getPublicUrl(photo.storage_path).data
            .publicUrl,
        })),
      );
      setAvailablePrompts(promptsResult.data ?? []);
      setPromptAnswers(
        (answersResult.data ?? []).map((answer) => ({
          promptId: answer.prompt_id,
          answer: answer.answer ?? "",
        })),
      );
      setLoadingProfile(false);
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = <K extends keyof ProfileForm>(name: K, value: ProfileForm[K]) =>
    setProfile((current) => ({ ...current, [name]: value }));

  function togglePrompt(promptId: string) {
    setPromptAnswers((current) => {
      const isSelected = current.some((answer) => answer.promptId === promptId);
      if (isSelected) return current.filter((answer) => answer.promptId !== promptId);
      if (current.length >= 3) return current;
      return [...current, { promptId, answer: "" }];
    });
  }

  function updatePromptAnswer(promptId: string, answer: string) {
    setPromptAnswers((current) =>
      current.map((item) => (item.promptId === promptId ? { ...item, answer } : item)),
    );
  }

  async function removeExistingPhoto(photo: ExistingPhoto) {
    if (!supabase || deletingPhotoId) return;
    setDeletingPhotoId(photo.id);
    setFeedback("");
    const { error: storageError } = await supabase.storage
      .from("profile-photos")
      .remove([photo.storage_path]);
    if (storageError) {
      setStatus("error");
      setFeedback("Impossible de supprimer cette photo. Réessaie dans quelques instants.");
      setDeletingPhotoId(null);
      return;
    }
    const { error: rowError } = await supabase.from("profile_photos").delete().eq("id", photo.id);
    if (rowError) {
      setStatus("error");
      setFeedback(
        "Le fichier a été supprimé, mais la liste des photos n'a pas pu être actualisée.",
      );
    } else {
      setExistingPhotos((current) => current.filter(({ id }) => id !== photo.id));
    }
    setDeletingPhotoId(null);
  }

  async function takeNativePhoto() {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // laisse le choix entre appareil photo et galerie
        quality: 80,
        width: 1600,
      });
      if (!photo.dataUrl) return;
      const response = await fetch(photo.dataUrl);
      const blob = await response.blob();
      const extension = photo.format || "jpeg";
      const file = new File([blob], `photo-${Date.now()}.${extension}`, { type: blob.type });
      setPhotos((prev) => [...prev, file].slice(0, Math.max(0, 6 - existingPhotos.length)));
    } catch {
      // L'utilisateur a annulé (ex. refus de permission) : pas d'erreur à afficher.
    }
  }
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "requesting" | "captured" | "error"
  >("idle");

  function captureLocation() {
    if (!navigator.geolocation) return setLocationStatus("error");
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        setCoords({ lat: position.latitude, lng: position.longitude });
        setLocationStatus("captured");
      },
      () => setLocationStatus("error"),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  async function deleteAccount() {
    if (
      !supabase ||
      !window.confirm(
        "Supprimer définitivement ton compte ? Ton profil, tes photos, tes coups de cœur et tes messages seront effacés. Cette action est irréversible.",
      )
    )
      return;
    setDeleting(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke("delete-account", {
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    });
    setDeleting(false);
    if (error) {
      setFeedback("La suppression du compte a échoué. Réessaie dans quelques instants.");
      setStatus("error");
      return;
    }
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  }

  async function exportData() {
    if (!supabase) return;
    const client = supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setExporting(true);
    const [profile, photoRows, swipes, matches, messages, rides, blocks, reports] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("profile_photos").select("*").eq("profile_id", user.id),
        supabase.from("swipes").select("*").eq("swiper_id", user.id),
        supabase
          .from("matches")
          .select("*")
          .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`),
        supabase.from("messages").select("*").eq("sender_id", user.id),
        supabase.from("event_attendees").select("*").eq("profile_id", user.id),
        supabase.from("blocks").select("*").eq("blocker_id", user.id),
        supabase.from("reports").select("*").eq("reporter_id", user.id),
      ]);
    const photosWithUrl = (photoRows.data ?? []).map((photo) => ({
      ...photo,
      download_url: client.storage.from("profile-photos").getPublicUrl(photo.storage_path).data
        .publicUrl,
    }));
    const payload = {
      exported_at: new Date().toISOString(),
      compte: { id: user.id, email: user.email, cree_le: user.created_at },
      profil: profile.data,
      photos: photosWithUrl,
      likes_envoyes: swipes.data,
      matchs: matches.data,
      messages_envoyes: messages.data,
      participations_balades: rides.data,
      blocages: blocks.data,
      signalements_envoyes: reports.data,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "motards-de-coeur-mes-donnees.json";
    anchor.click();
    URL.revokeObjectURL(url);
    for (const [index, photo] of photosWithUrl.entries()) {
      try {
        const response = await fetch(photo.download_url);
        const fileUrl = URL.createObjectURL(await response.blob());
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `photo-${index + 1}.${photo.storage_path.split(".").pop() || "jpg"}`;
        link.click();
        URL.revokeObjectURL(fileUrl);
        await new Promise((resolve) => setTimeout(resolve, 400));
      } catch {
        /* L'URL reste dans le JSON si le téléchargement échoue. */
      }
    }
    setExporting(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    const form = event.currentTarget;
    if (!form.reportValidity() || !supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("error");
      setFeedback("Session expirée. Reconnecte-toi puis réessaie.");
      return;
    }
    const birthDate = profile.birth_date;
    if (!birthDate || birthDate > eighteenYearsAgo()) {
      setStatus("error");
      setFeedback("Tu dois avoir au moins 18 ans pour créer un profil.");
      return;
    }
    setStatus("submitting");
    const optional = (value: string) => value.trim() || null;
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: profile.first_name.trim(),
      birth_date: birthDate,
      gender: optional(profile.gender),
      looking_for: optional(profile.looking_for),
      moto_type: optional(profile.moto_type),
      moto_brand: optional(profile.moto_brand),
      moto_model: optional(profile.moto_model),
      bio: optional(profile.bio),
      is_active: profile.is_active,
      ...(coords
        ? {
            location: `SRID=4326;POINT(${coords.lng} ${coords.lat})`,
            location_updated_at: new Date().toISOString(),
          }
        : {}),
    });
    if (profileError) {
      setStatus("error");
      setFeedback(
        profileError.message?.includes("contenu_interdit")
          ? "Ta présentation contient un terme non autorisé, merci de la reformuler."
          : "Une erreur empêche l'enregistrement du profil. Réessaie dans quelques instants.",
      );
      return;
    }

    let promptsFailed = false;
    const { error: deletePromptsError } = await supabase
      .from("profile_prompts")
      .delete()
      .eq("profile_id", user.id);
    const filledPromptAnswers = promptAnswers.filter(({ answer }) => answer.trim());
    if (deletePromptsError) {
      promptsFailed = true;
    } else if (filledPromptAnswers.length) {
      const { error: insertPromptsError } = await supabase.from("profile_prompts").insert(
        filledPromptAnswers.map(({ promptId, answer }, position) => ({
          profile_id: user.id,
          prompt_id: promptId,
          answer: answer.trim(),
          position,
        })),
      );
      promptsFailed = Boolean(insertPromptsError);
    }

    let failedUploads = 0;
    const uploadedPhotos: ExistingPhoto[] = [];
    const firstPosition =
      existingPhotos.reduce((maximum, photo) => Math.max(maximum, photo.position), -1) + 1;
    for (const [index, file] of photos.entries()) {
      const position = firstPosition + index;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file);
      if (uploadError) {
        failedUploads++;
        continue;
      }
      const { data: photoRow, error: photoError } = await supabase
        .from("profile_photos")
        .insert({ profile_id: user.id, storage_path: path, position })
        .select("id, storage_path, position")
        .single();
      if (photoError || !photoRow) {
        failedUploads++;
        await supabase.storage.from("profile-photos").remove([path]);
      } else {
        uploadedPhotos.push({
          ...photoRow,
          publicUrl: supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl,
        });
      }
    }
    setHasProfile(true);
    setExistingPhotos((current) => [...current, ...uploadedPhotos]);
    setStatus(failedUploads || promptsFailed ? "error" : "success");
    setFeedback(
      promptsFailed
        ? "Profil enregistré, mais tes réponses aux prompts n'ont pas pu être actualisées."
        : failedUploads
          ? `Profil enregistré, mais ${failedUploads} photo(s) n'ont pas pu être ajoutée(s).`
          : "Profil enregistré ! Tu peux maintenant poursuivre selon tes envies.",
    );
    if (!failedUploads && !promptsFailed) {
      setPhotos([]);
    }
  }

  const select = (
    name: "gender" | "looking_for" | "moto_type",
    options: readonly (readonly [string, string])[],
  ) => (
    <select
      className={fieldClass}
      name={name}
      value={profile[name]}
      onChange={(event) => updateField(name, event.target.value)}
    >
      <option value="">Sélectionner</option>
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );

  const nextStep = getNextStep(profile.looking_for);
  const stepLabels = ["Identité", "Ta moto", "Ta recherche", "Photos et visibilité"];

  function goToNextStep() {
    if (currentStep === 1 && (!profile.first_name.trim() || !profile.birth_date)) {
      const form = document.querySelector<HTMLFormElement>("#profile-form");
      form?.reportValidity();
      return;
    }
    const next = Math.min(4, currentStep + 1);
    setCurrentStep(next);
    setFurthestStep((step) => Math.max(step, next));
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-7rem)] bg-[#21191a] text-[#fff9f0]">
        <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-16">
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#d6a85c]/30 bg-[#281e1f] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#a99b95]">
                Forfait actuel
              </p>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                  isPremium
                    ? "border-[#e2b45f]/60 bg-[#d9a441]/15 text-[#f4ce7e]"
                    : "border-white/20 bg-white/5 text-[#d4c6bf]"
                }`}
              >
                {loadingProfile ? "Chargement…" : isPremium ? "Premium" : "Basique"}
              </span>
            </div>
            <Link
              to="/premium"
              className="text-sm font-medium text-[#e8be6c] underline decoration-[#e8be6c]/40 underline-offset-4 transition hover:text-[#f4ce7e]"
            >
              Voir ou changer mon forfait
            </Link>
          </div>
          {!hasProfile && (
            <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">
              Dernière étape
            </span>
          )}
          <h1 className="mt-3 mb-3 font-display text-3xl sm:text-4xl">
            {hasProfile ? "Modifier mon profil" : "Complète ton profil"}
          </h1>
          <p className="mb-8 text-sm text-[#d4c6bf]">
            Ces informations aident les autres motards à te trouver et à savoir ce que tu cherches.
          </p>
          <form id="profile-form" className="space-y-5" onSubmit={handleSubmit}>
            <div className="mb-8" aria-label={`Étape ${currentStep} sur 4`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#fff9f0]">Étape {currentStep} sur 4</p>
                <p className="text-xs text-[#a99b95]">{stepLabels[currentStep - 1]}</p>
              </div>
              <ol className="grid grid-cols-4 gap-2">
                {stepLabels.map((label, index) => {
                  const step = index + 1;
                  const isAccessible = step <= furthestStep;
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        onClick={() => isAccessible && setCurrentStep(step)}
                        disabled={!isAccessible}
                        aria-label={`Étape ${step} : ${label}`}
                        aria-current={step === currentStep ? "step" : undefined}
                        className="group flex w-full flex-col items-center gap-2 disabled:cursor-default"
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition ${
                            step <= currentStep
                              ? "border-[#e2b45f] bg-[#e2b45f] text-[#21191a]"
                              : "border-white/20 bg-[#302526] text-[#a99b95]"
                          }`}
                        >
                          {step}
                        </span>
                        <span
                          className={`h-2 w-full rounded-full transition ${
                            step <= currentStep ? "bg-[#e2b45f]" : "bg-white/15"
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
            {currentStep === 1 && (
              <div className="space-y-5">
                <h2 className="font-display text-2xl">Identité</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-medium">
                    Prénom *
                    <input
                      className={fieldClass}
                      name="first_name"
                      autoComplete="given-name"
                      required
                      maxLength={80}
                      value={profile.first_name}
                      onChange={(event) => updateField("first_name", event.target.value)}
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Date de naissance *
                    <input
                      className={fieldClass}
                      name="birth_date"
                      type="date"
                      required
                      max={eighteenYearsAgo()}
                      value={profile.birth_date}
                      onChange={(event) => updateField("birth_date", event.target.value)}
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium">
                  Genre{select("gender", genderOptions)}
                </label>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-5">
                <h2 className="font-display text-2xl">Ce que tu recherches</h2>
                <label className="text-sm font-medium">
                  Tu recherches{select("looking_for", lookingForOptions)}
                </label>

                <label className="block text-sm font-medium">
                  Présentation
                  <textarea
                    className={`${fieldClass} min-h-32 resize-y`}
                    name="bio"
                    maxLength={1000}
                    placeholder="Ton style de conduite, tes balades préférées, ce que tu recherches…"
                    value={profile.bio}
                    onChange={(event) => updateField("bio", event.target.value)}
                  />
                </label>
                <fieldset className="space-y-3 rounded-2xl border border-white/10 bg-[#281e1f] p-4">
                  <legend className="px-1 font-display text-xl">Prompts</legend>
                  <p className="text-sm leading-relaxed text-[#a99b95]">
                    Choisis jusqu'à 3 questions pour donner un aperçu de ta personnalité
                    (optionnel).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availablePrompts.map((prompt) => {
                      const selected = promptAnswers.some(
                        (answer) => answer.promptId === prompt.id,
                      );
                      const disabled = !selected && promptAnswers.length >= 3;
                      return (
                        <button
                          key={prompt.id}
                          type="button"
                          onClick={() => togglePrompt(prompt.id)}
                          disabled={disabled}
                          aria-pressed={selected}
                          className={`rounded-xl border px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            selected
                              ? "border-[#e2b45f] bg-[#d9a441]/15 text-[#fff9f0]"
                              : "border-white/15 bg-[#302526] text-[#d4c6bf] hover:border-[#d6a85c]/50"
                          }`}
                        >
                          {prompt.question}
                        </button>
                      );
                    })}
                  </div>
                  {promptAnswers.map((item, index) => {
                    const prompt = availablePrompts.find(({ id }) => id === item.promptId);
                    if (!prompt) return null;
                    return (
                      <label key={item.promptId} className="block text-sm font-medium">
                        {prompt.question}
                        <textarea
                          className={`${fieldClass} min-h-24 resize-y`}
                          maxLength={300}
                          placeholder="Ta réponse…"
                          value={item.answer}
                          onChange={(event) =>
                            updatePromptAnswer(item.promptId, event.target.value)
                          }
                        />
                        <span className="mt-1 block text-right text-xs font-normal text-[#a99b95]">
                          {item.answer.length}/300 · réponse {index + 1} sur 3
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-5">
                <h2 className="font-display text-2xl">Ta moto</h2>
                <div className="grid gap-5 sm:grid-cols-3">
                  <label className="text-sm font-medium">
                    Type de moto{select("moto_type", motoTypeOptions)}
                  </label>
                  <label className="text-sm font-medium">
                    Marque
                    <input
                      className={fieldClass}
                      name="moto_brand"
                      maxLength={80}
                      value={profile.moto_brand}
                      onChange={(event) => updateField("moto_brand", event.target.value)}
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Modèle
                    <input
                      className={fieldClass}
                      name="moto_model"
                      maxLength={80}
                      value={profile.moto_model}
                      onChange={(event) => updateField("moto_model", event.target.value)}
                    />
                  </label>
                </div>
              </div>
            )}
            {currentStep === 4 && (
              <div className="space-y-5">
                <h2 className="font-display text-2xl">Photos et visibilité</h2>
                <label className="block text-sm font-medium">
                  Photos (jusqu'à 6)
                  {existingPhotos.length > 0 && (
                    <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {existingPhotos.map((photo, index) => (
                        <li
                          key={photo.id}
                          className="relative aspect-square overflow-hidden rounded-xl border border-white/15 bg-[#302526]"
                        >
                          <img
                            src={photo.publicUrl}
                            alt={`Photo de profil ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => void removeExistingPhoto(photo)}
                            disabled={deletingPhotoId !== null}
                            className="absolute top-2 right-2 rounded-full bg-[#21191a]/90 p-2 text-[#fff9f0] shadow transition hover:text-primary disabled:opacity-50"
                            aria-label={`Supprimer la photo ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {Capacitor.isNativePlatform() ? (
                    <div className="mt-2 rounded-xl border border-dashed border-[#d6a85c]/35 bg-[#281e1f] p-4 text-sm text-[#d4c6bf]">
                      <button
                        type="button"
                        onClick={() => void takeNativePhoto()}
                        disabled={existingPhotos.length + photos.length >= 6}
                        className="flex items-center gap-2 text-primary disabled:opacity-40"
                      >
                        <Upload className="h-5 w-5 shrink-0 text-[#e2b45f]" />
                        Ajouter une photo (appareil photo ou galerie)
                      </button>
                      {photos.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {photos.map((file, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 rounded-full border border-white/15 bg-[#302526] px-3 py-1 text-xs"
                            >
                              Photo {i + 1}
                              <button
                                type="button"
                                onClick={() =>
                                  setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                                }
                                className="text-[#a99b95] hover:text-primary"
                                aria-label={`Retirer la photo ${i + 1}`}
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-[#d6a85c]/35 bg-[#281e1f] p-4 text-sm text-[#d4c6bf]">
                      <Upload className="h-5 w-5 shrink-0 text-[#e2b45f]" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={(event) =>
                          setPhotos((current) =>
                            [...current, ...Array.from(event.target.files ?? [])].slice(
                              0,
                              Math.max(0, 6 - existingPhotos.length),
                            ),
                          )
                        }
                        disabled={existingPhotos.length + photos.length >= 6}
                        className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2"
                      />
                    </div>
                  )}
                  {photos.length > 0 && (
                    <p className="mt-2 text-xs text-[#d4c6bf]">
                      {photos.length} nouvelle(s) photo(s) sélectionnée(s) —{" "}
                      {existingPhotos.length + photos.length}/6 au total
                    </p>
                  )}
                </label>
                <div className="rounded-xl border border-white/10 bg-[#281e1f] p-4 text-sm text-[#d4c6bf]">
                  <button
                    type="button"
                    onClick={captureLocation}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <MapPin className="h-4 w-4" />
                    {locationStatus === "captured"
                      ? "Position enregistrée ✓"
                      : locationStatus === "requesting"
                        ? "Localisation en cours…"
                        : "Activer ma position (recommandé)"}
                  </button>
                  <p className="mt-2 text-xs leading-relaxed text-[#a99b95]">
                    Utilisée uniquement pour te proposer des motards proches et calculer une
                    distance approximative. Ta position exacte n'est jamais visible par les autres,
                    seulement une distance arrondie.
                  </p>
                  {locationStatus === "error" && (
                    <p className="mt-2 text-xs text-primary">
                      Localisation refusée ou indisponible — tu peux continuer sans, mais le tri par
                      distance ne fonctionnera pas.
                    </p>
                  )}
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#281e1f] p-4 text-sm leading-relaxed text-[#d4c6bf]">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={profile.is_active}
                    onChange={(event) => updateField("is_active", event.target.checked)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span>
                    Rendre mon profil visible dans la découverte. Décoche pour masquer
                    temporairement ton profil sans le supprimer.
                  </span>
                </label>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}
                  className="w-full rounded-full border border-primary/40 px-6 py-4 text-sm font-medium uppercase tracking-wider text-primary hover:bg-primary/10"
                >
                  Précédent
                </button>
              )}
              {currentStep < 4 && (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="w-full rounded-full bg-gradient-red px-6 py-4 text-sm font-medium uppercase tracking-wider text-primary-foreground shadow-glow"
                >
                  Suivant
                </button>
              )}
            </div>
            {currentStep === 4 && (
              <button
                disabled={status === "submitting" || loadingProfile}
                className="w-full rounded-full bg-gradient-red px-8 py-4 text-sm font-medium uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-60"
                type="submit"
              >
                {loadingProfile
                  ? "Chargement…"
                  : status === "submitting"
                    ? "Enregistrement…"
                    : "Enregistrer mon profil"}
              </button>
            )}
            <p className="flex items-center justify-center gap-2 text-xs text-[#e4c986]">
              <ShieldCheck className="h-4 w-4" />
              Ta position exacte n'est jamais affichée publiquement.
            </p>
            {feedback && (
              <div
                role="status"
                className={`flex gap-3 rounded-xl border p-4 text-sm ${status === "success" ? "border-green-500/40 bg-green-500/10 text-green-200" : "border-primary/40 bg-primary/10"}`}
              >
                {status === "success" && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                <span>{feedback}</span>
              </div>
            )}
            {status === "success" && (
              <div className="space-y-3 text-center">
                <Link
                  to={nextStep.to}
                  className="block w-full rounded-full border border-primary/40 px-8 py-3 text-center text-sm font-medium uppercase tracking-wider text-primary hover:bg-primary/10"
                >
                  {nextStep.label}
                </Link>
              </div>
            )}
          </form>
          <div className="mt-12 border-t border-white/10 pt-6">
            <h2 className="mb-2 text-sm font-medium text-[#d4c6bf]">Mes données</h2>
            <p className="mb-3 text-xs leading-relaxed text-[#a99b95]">
              Télécharge une copie de toutes les données associées à ton compte, ainsi que tes
              photos en fichiers séparés.
            </p>
            <button
              onClick={() => void exportData()}
              disabled={exporting}
              className="rounded-full border border-primary/40 px-5 py-2 text-xs uppercase tracking-wider text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              {exporting ? "Préparation du téléchargement…" : "Télécharger mes données et photos"}
            </button>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6">
            <h2 className="mb-2 text-sm font-medium text-[#d4c6bf]">Zone sensible</h2>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mb-6 flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs uppercase tracking-wider text-[#d4c6bf] transition-colors hover:border-[#d6a85c]/35 hover:text-[#fff9f0]"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
            <p className="mb-3 text-xs leading-relaxed text-[#a99b95]">
              La suppression de ton compte efface définitivement ton profil, tes photos, tes coups
              de cœur et tes messages. Cette action est irréversible et conforme à ton droit à
              l'effacement (RGPD).
            </p>
            <button
              onClick={() => void deleteAccount()}
              disabled={deleting}
              className="rounded-full border border-destructive/40 px-5 py-2 text-xs uppercase tracking-wider text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              {deleting ? "Suppression…" : "Supprimer mon compte"}
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
