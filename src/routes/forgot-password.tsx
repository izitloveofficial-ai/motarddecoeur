import { Link, createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Mot de passe oublié — Motards de Cœur" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setStatus("submitting");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setStatus(error ? "error" : "sent");
  }
  const fieldClass =
    "mt-2 w-full rounded-xl border border-white/15 bg-[#302526]/90 px-4 py-3 text-sm text-[#fff9f0] outline-none transition focus:border-[#e2b45f]/70 focus:ring-2 focus:ring-[#d9a441]/20";
  return (
    <Layout>
      <section className="mx-auto max-w-md px-6 py-12 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <h1 className="mt-3 mb-3 font-display text-4xl">Mot de passe oublié</h1>
        <p className="mb-8 text-sm leading-relaxed text-[#d4c6bf]">
          Entre ton adresse email, on t'envoie un lien pour réinitialiser ton mot de passe.
        </p>
        {status === "sent" ? (
          <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-200">
            Si un compte existe avec cette adresse, un email vient d'être envoyé avec un lien de
            réinitialisation.
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium">
              Email
              <input
                className={fieldClass}
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button
              disabled={status === "submitting"}
              type="submit"
              className="w-full rounded-full bg-gradient-red px-8 py-4 text-sm font-medium uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {status === "submitting" ? "Envoi…" : "Envoyer le lien"}
            </button>
            {status === "error" && (
              <p className="text-sm text-[#d4c6bf]">
                Une erreur est survenue. Réessaie dans quelques instants.
              </p>
            )}
          </form>
        )}
        <p className="mt-6 text-center text-sm text-[#d4c6bf]">
          <Link to="/login" className="text-primary hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </section>
    </Layout>
  );
}
