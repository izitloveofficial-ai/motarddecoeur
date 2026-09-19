import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { CheckCircle2, LogOut, MapPin, ShieldCheck, Upload } from "lucide-react";
import { type FormEvent, useState } from "react";
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
  "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 hover:border-[#e2b45f]/60 focus:border-[#e2b45f]/70 focus:ring-2 focus:ring-[#d9a441]/20";

function ProfileSetup() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

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
      setPhotos((prev) => [...prev, file].slice(0, 6));
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
    const data = new FormData(form);
    const birthDate = String(data.get("birth_date") ?? "");
    if (!birthDate || birthDate > eighteenYearsAgo()) {
      setStatus("error");
      setFeedback("Tu dois avoir au moins 18 ans pour créer un profil.");
      return;
    }
    setStatus("submitting");
    const optional = (name: string) => String(data.get(name) ?? "").trim() || null;
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: String(data.get("first_name") ?? "").trim(),
      birth_date: birthDate,
      gender: optional("gender"),
      looking_for: optional("looking_for"),
      moto_type: optional("moto_type"),
      moto_brand: optional("moto_brand"),
      moto_model: optional("moto_model"),
      bio: optional("bio"),
      is_active: data.get("is_active") === "on",
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

    let failedUploads = 0;
    for (const [position, file] of photos.entries()) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file);
      if (uploadError) {
        failedUploads++;
        continue;
      }
      const { error: photoError } = await supabase
        .from("profile_photos")
        .insert({ profile_id: user.id, storage_path: path, position });
      if (photoError) {
        failedUploads++;
        await supabase.storage.from("profile-photos").remove([path]);
      }
    }
    setStatus(failedUploads ? "error" : "success");
    setFeedback(
      failedUploads
        ? `Profil enregistré, mais ${failedUploads} photo(s) n'ont pas pu être ajoutée(s).`
        : "Profil enregistré ! Il sera visible dès l'ouverture de la découverte de profils.",
    );
    if (!failedUploads) {
      form.reset();
      setPhotos([]);
    }
  }

  const select = (name: string, options: readonly (readonly [string, string])[]) => (
    <select className={fieldClass} name={name} defaultValue="">
      <option value="">Sélectionner</option>
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );

  return (
    <Layout>
      <div className="min-h-[calc(100vh-7rem)] bg-[#faf6f0] text-neutral-900">
        <section className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
          <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Dernière étape</span>
          <h1 className="mt-3 mb-3 font-display text-4xl">Complète ton profil</h1>
          <p className="mb-8 text-sm text-neutral-600">
            Ces informations aident les autres motards à te trouver et à savoir ce que tu cherches.
          </p>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Prénom *
                <input
                  className={fieldClass}
                  name="first_name"
                  autoComplete="given-name"
                  required
                  maxLength={80}
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
                />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium">Genre{select("gender", genderOptions)}</label>
              <label className="text-sm font-medium">
                Tu recherches{select("looking_for", lookingForOptions)}
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="text-sm font-medium">
                Type de moto{select("moto_type", motoTypeOptions)}
              </label>
              <label className="text-sm font-medium">
                Marque
                <input className={fieldClass} name="moto_brand" maxLength={80} />
              </label>
              <label className="text-sm font-medium">
                Modèle
                <input className={fieldClass} name="moto_model" maxLength={80} />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Présentation
              <textarea
                className={`${fieldClass} min-h-32 resize-y`}
                name="bio"
                maxLength={1000}
                placeholder="Ton style de conduite, tes balades préférées, ce que tu recherches…"
              />
            </label>
            <label className="block text-sm font-medium">
              Photos (jusqu'à 6)
              {Capacitor.isNativePlatform() ? (
                <div className="mt-2 rounded-xl border border-dashed border-[#d6a85c]/35 bg-[#f5f0e8] p-4 text-sm text-neutral-600">
                  <button
                    type="button"
                    onClick={() => void takeNativePhoto()}
                    disabled={photos.length >= 6}
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
                          className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs"
                        >
                          Photo {i + 1}
                          <button
                            type="button"
                            onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-neutral-400 hover:text-primary"
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
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-[#d6a85c]/35 bg-[#f5f0e8] p-4 text-sm text-neutral-600">
                  <Upload className="h-5 w-5 shrink-0 text-[#e2b45f]" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) =>
                      setPhotos(Array.from(event.target.files ?? []).slice(0, 6))
                    }
                    className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2"
                  />
                </div>
              )}
              {photos.length > 0 && (
                <p className="mt-2 text-xs text-neutral-600">
                  {photos.length} photo(s) sélectionnée(s)
                </p>
              )}
            </label>
            <div className="rounded-xl border border-neutral-200 bg-[#f5f0e8] p-4 text-sm text-neutral-600">
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
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                Utilisée uniquement pour te proposer des motards proches et calculer une distance
                approximative. Ta position exacte n'est jamais visible par les autres, seulement une
                distance arrondie.
              </p>
              {locationStatus === "error" && (
                <p className="mt-2 text-xs text-primary">
                  Localisation refusée ou indisponible — tu peux continuer sans, mais le tri par
                  distance ne fonctionnera pas.
                </p>
              )}
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-[#f5f0e8] p-4 text-sm leading-relaxed text-neutral-600">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span>
                Rendre mon profil visible dans la découverte. Décoche pour masquer temporairement
                ton profil sans le supprimer.
              </span>
            </label>
            <button
              disabled={status === "submitting"}
              className="w-full rounded-full bg-gradient-red px-8 py-4 text-sm font-medium uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-60"
              type="submit"
            >
              {status === "submitting" ? "Enregistrement…" : "Enregistrer mon profil"}
            </button>
            <p className="flex items-center justify-center gap-2 text-xs text-[#e4c986]">
              <ShieldCheck className="h-4 w-4" />
              Ta position exacte n'est jamais affichée publiquement.
            </p>
            {feedback && (
              <div
                role="status"
                className={`flex gap-3 rounded-xl border p-4 text-sm ${status === "success" ? "border-green-500/40 bg-green-500/10 text-green-700" : "border-primary/40 bg-primary/10"}`}
              >
                {status === "success" && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                <span>{feedback}</span>
              </div>
            )}
            {status === "success" && (
              <Link
                to="/discover"
                className="block w-full rounded-full border border-primary/40 px-8 py-3 text-center text-sm font-medium uppercase tracking-wider text-primary hover:bg-primary/10"
              >
                Découvrir des profils
              </Link>
            )}
          </form>
          <div className="mt-12 border-t border-neutral-200 pt-6">
            <h2 className="mb-2 text-sm font-medium text-neutral-600">Mes données</h2>
            <p className="mb-3 text-xs leading-relaxed text-neutral-400">
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
          <div className="mt-8 border-t border-neutral-200 pt-6">
            <h2 className="mb-2 text-sm font-medium text-neutral-600">Zone sensible</h2>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mb-6 flex items-center gap-2 rounded-full border border-neutral-300 px-5 py-2 text-xs uppercase tracking-wider text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
            <p className="mb-3 text-xs leading-relaxed text-neutral-400">
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
