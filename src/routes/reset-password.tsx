import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { requireAdmin } from "@/lib/require-admin";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  head: () => ({ meta: [{ title: "Nouveau mot de passe — Motards de Cœur" }] }),
  beforeLoad: requireAdmin,
  component: ResetPassword,
});
function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setNotice("");
    if (password !== confirm) {
      setStatus("error");
      setNotice("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setNotice("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setStatus("submitting");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setNotice("Le mot de passe n'a pas pu être mis à jour.");
      return;
    }
    void navigate({ to: "/profile/setup" });
  }
  const fieldClass =
    "mt-2 w-full rounded-xl border border-white/15 bg-[#302526]/90 px-4 py-3 text-sm text-[#fff9f0] outline-none transition focus:border-[#e2b45f]/70 focus:ring-2 focus:ring-[#d9a441]/20";
  return (
    <Layout>
      <section className="mx-auto max-w-md px-6 py-12 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <h1 className="mt-3 mb-8 font-display text-4xl">Nouveau mot de passe</h1>
        {!ready ? (
          <p className="text-sm text-[#d4c6bf]">Vérification du lien de réinitialisation…</p>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium">
              Nouveau mot de passe
              <input
                className={fieldClass}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Confirmer le mot de passe
              <input
                className={fieldClass}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </label>
            {notice && (
              <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">
                {notice}
              </div>
            )}
            <button
              disabled={status === "submitting"}
              type="submit"
              className="w-full rounded-full bg-gradient-red px-8 py-4 text-sm font-medium uppercase tracking-wider text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {status === "submitting" ? "Mise à jour…" : "Valider le nouveau mot de passe"}
            </button>
          </form>
        )}
      </section>
    </Layout>
  );
}
