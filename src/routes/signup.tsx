import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Layout } from "@/components/Layout";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Créer mon compte — Motards de Cœur" },
      {
        name: "description",
        content: "Crée ton compte Motards de Cœur pour rencontrer des motards près de chez toi.",
      },
    ],
  }),
  component: Signup,
});

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/15 bg-[#302526]/90 px-4 py-3 text-sm text-[#fff9f0] outline-none transition placeholder:text-[#cdbdb5] hover:border-[#d6a85c]/35 focus:border-[#e2b45f]/70 focus:ring-2 focus:ring-[#d9a441]/20";

function Signup() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "submitting" | "check-email" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!isSupabaseConfigured || !supabase) {
      setStatus("error");
      setFeedback("La création de compte n'est pas encore configurée.");
      return;
    }

    const data = new FormData(form);
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(data.get("password") ?? "");
    if (password !== String(data.get("password_confirm") ?? "")) {
      setStatus("error");
      setFeedback("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setFeedback("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setStatus("submitting");
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/profile/setup` },
    });
    if (error) {
      const knownAccount = /already (registered|exists)/i.test(error.message);
      setStatus("error");
      setFeedback(
        knownAccount
          ? "Un compte existe déjà avec cette adresse email."
          : "Une erreur empêche la création du compte pour le moment. Réessaie dans quelques instants.",
      );
      return;
    }
    if (signUpData.session) {
      void navigate({ to: "/profile/setup" });
      return;
    }
    setStatus("check-email");
    setFeedback(
      "Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis reviens te connecter.",
    );
  }

  return (
    <Layout>
      <section className="mx-auto max-w-md px-6 py-12 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <h1 className="mt-3 mb-3 font-display text-4xl">Créer mon compte</h1>
        <p className="mb-8 text-sm text-[#d4c6bf]">Réservé aux personnes de 18 ans ou plus.</p>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Email *
            <input
              className={fieldClass}
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label className="block text-sm font-medium">
            Mot de passe *
            <input
              className={fieldClass}
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
          <label className="block text-sm font-medium">
            Confirmer le mot de passe *
            <input
              className={fieldClass}
              name="password_confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d6a85c]/20 bg-[#281e1f]/70 p-4 text-sm text-[#d4c6bf]">
            <input
              className="mt-1 h-4 w-4 accent-primary"
              name="age_confirm"
              type="checkbox"
              required
            />
            <span>Je certifie avoir 18 ans ou plus. *</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d6a85c]/20 bg-[#281e1f]/70 p-4 text-sm text-[#d4c6bf]">
            <input
              className="mt-1 h-4 w-4 accent-primary"
              name="terms_confirm"
              type="checkbox"
              required
            />
            <span>
              J'accepte les{" "}
              <Link to="/conditions-utilisation" className="text-primary hover:underline">
                conditions d'utilisation
              </Link>{" "}
              et la{" "}
              <Link to="/confidentialite" className="text-primary hover:underline">
                politique de confidentialité
              </Link>
              . *
            </span>
          </label>
          <button
            disabled={status === "submitting"}
            className="w-full rounded-full bg-gradient-red px-8 py-4 text-sm font-medium uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-60"
            type="submit"
          >
            {status === "submitting" ? "Création en cours…" : "Créer mon compte"}
          </button>
          <p className="flex items-center justify-center gap-2 text-xs text-[#e4c986]">
            <ShieldCheck className="h-4 w-4" />
            Application réservée aux 18 ans et plus.
          </p>
          {feedback && (
            <div
              role="status"
              className={`rounded-xl border p-4 text-sm ${status === "check-email" ? "border-green-500/40 bg-green-500/10 text-green-200" : "border-primary/40 bg-primary/10"}`}
            >
              {feedback}
            </div>
          )}
          <p className="text-center text-sm text-[#d4c6bf]">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </section>
    </Layout>
  );
}
