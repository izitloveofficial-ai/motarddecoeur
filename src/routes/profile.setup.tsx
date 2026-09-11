import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck, Upload } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Layout } from "@/components/Layout";
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
  component: ProfileSetup,
  beforeLoad: async () => {
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
  "mt-2 w-full rounded-xl border border-white/15 bg-[#302526]/90 px-4 py-3 text-sm text-[#fff9f0] outline-none transition placeholder:text-[#cdbdb5] hover:border-[#d6a85c]/35 focus:border-[#e2b45f]/70 focus:ring-2 focus:ring-[#d9a441]/20";

function ProfileSetup() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

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
      is_active: true,
    });
    if (profileError) {
      setStatus("error");
      setFeedback(
        "Une erreur empêche l'enregistrement du profil. Réessaie dans quelques instants.",
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
      <section className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Dernière étape</span>
        <h1 className="mt-3 mb-3 font-display text-4xl">Complète ton profil</h1>
        <p className="mb-8 text-sm text-[#d4c6bf]">
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
            Photos (jusqu'à 3)
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-[#d6a85c]/35 bg-[#281e1f]/70 p-4 text-sm text-[#d4c6bf]">
              <Upload className="h-5 w-5 shrink-0 text-[#e2b45f]" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => setPhotos(Array.from(event.target.files ?? []).slice(0, 3))}
                className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2"
              />
            </div>
            {photos.length > 0 && (
              <p className="mt-2 text-xs text-[#cdbfba]">
                {photos.length} photo(s) sélectionnée(s)
              </p>
            )}
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
              className={`flex gap-3 rounded-xl border p-4 text-sm ${status === "success" ? "border-green-500/40 bg-green-500/10 text-green-200" : "border-primary/40 bg-primary/10"}`}
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
      </section>
    </Layout>
  );
}
