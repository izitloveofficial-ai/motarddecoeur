import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { PrelaunchLayout } from "@/components/PrelaunchLayout";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Profile = {
  first_name?: string;
  location?: string;
  age?: number;
  sex?: string;
  rider_profile?: string;
  favorite_bike?: string;
  primary_interest?: string;
  bio?: string;
};

export const Route = createFileRoute("/activate")({ component: Activate });

function Activate() {
  const registration =
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("registration") ?? "");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState("Vérification de votre invitation…");

  useEffect(() => {
    if (!supabase || !registration) {
      setMessage("Cette invitation est incomplète ou invalide.");
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setMessage("Ouvrez le lien complet reçu par e-mail pour continuer.");
        return;
      }
      const { data: initial, error } = await supabase.rpc("get_invited_preinscription", {
        p_preinscription_id: registration,
      });
      if (error) {
        setMessage("Cette invitation n’est plus valide.");
        return;
      }
      setProfile(initial as Profile);
      setMessage("Vérifiez et corrigez vos informations, puis choisissez votre mot de passe.");
    });
  }, [registration]);

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured || !supabase) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setMessage("Création sécurisée du profil…");
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) {
      setMessage(passwordError.message);
      return;
    }
    const editedProfile = Object.fromEntries(
      [
        "first_name",
        "location",
        "age",
        "sex",
        "rider_profile",
        "favorite_bike",
        "primary_interest",
        "bio",
      ].map((key) => [key, String(form.get(key) ?? "")]),
    );
    const { error } = await supabase.rpc("finalize_preinscription", {
      p_preinscription_id: registration,
      p_profile: editedProfile,
    });
    if (error) {
      setMessage(
        "Impossible de finaliser cette invitation. Connectez-vous avec l’adresse invitée.",
      );
      return;
    }
    setCompleted(true);
    setMessage(
      "Votre compte est lié. Vérifiez les informations préremplies avant de finaliser votre profil.",
    );
  }

  return (
    <PrelaunchLayout>
      <main className="mx-auto min-h-[65vh] max-w-2xl px-6 py-20">
        <div className="rounded-3xl border border-primary/25 bg-card p-8 shadow-glow">
          <p className="text-xs uppercase tracking-[.3em] text-primary">Invitation privée</p>
          <h1 className="mt-3 font-display text-4xl">Créer mon compte Motards de Cœur</h1>
          <p className="mt-4 text-muted-foreground" role="status">
            {message}
          </p>
          {!profile ? null : !completed ? (
            <form className="mt-8 space-y-4" onSubmit={activate}>
              <label className="block text-sm">
                Prénom
                <input
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3"
                  name="first_name"
                  defaultValue={profile.first_name}
                  required
                />
              </label>
              <label className="block text-sm">
                Ville / région
                <input
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3"
                  name="location"
                  defaultValue={profile.location}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  Âge
                  <input
                    className="mt-2 w-full rounded-xl border bg-background px-4 py-3"
                    name="age"
                    type="number"
                    min={18}
                    max={99}
                    defaultValue={profile.age}
                  />
                </label>
                <label className="block text-sm">
                  Sexe
                  <input
                    className="mt-2 w-full rounded-xl border bg-background px-4 py-3"
                    name="sex"
                    defaultValue={profile.sex}
                  />
                </label>
              </div>
              <label className="block text-sm">
                Profil motard
                <input
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3"
                  name="rider_profile"
                  defaultValue={profile.rider_profile}
                />
              </label>
              <label className="block text-sm">
                Moto
                <input
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3"
                  name="favorite_bike"
                  defaultValue={profile.favorite_bike}
                />
              </label>
              <label className="block text-sm">
                Recherche
                <input
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3"
                  name="primary_interest"
                  defaultValue={profile.primary_interest}
                />
              </label>
              <label className="block text-sm">
                Présentation
                <textarea
                  className="mt-2 min-h-24 w-full rounded-xl border bg-background px-4 py-3"
                  name="bio"
                  defaultValue={profile.bio}
                />
              </label>
              <label className="block text-sm">
                Nouveau mot de passe
                <input
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3"
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </label>
              <button className="w-full rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">
                Créer mon compte
              </button>
            </form>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <ReadField label="Prénom" value={profile.first_name} />
              <ReadField label="Ville / région" value={profile.location} />
              <ReadField label="Moto" value={profile.favorite_bike} />
              <ReadField label="Recherche" value={profile.primary_interest} />
              <p className="sm:col-span-2 text-sm text-muted-foreground">
                Ces données n’ont pas écrasé un profil existant. L’édition complète sera proposée
                dans l’espace membre.
              </p>
            </div>
          )}
        </div>
      </main>
    </PrelaunchLayout>
  );
}

function ReadField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p>{value || "Non renseigné"}</p>
    </div>
  );
}
