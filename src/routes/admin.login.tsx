import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/login")({ component: AdminLogin });

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return setNotice("Supabase n'est pas configuré.");
    setLoading(true);
    setNotice("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setNotice("Identifiants incorrects.");
      setLoading(false);
      return;
    }

    // On vérifie côté serveur (via RLS + is_admin()) que ce compte est bien administrateur,
    // jamais en se fiant uniquement à une vérification côté client.
    const { data: isAdmin, error: adminCheckError } = await supabase.rpc("is_admin");

    if (adminCheckError || !isAdmin) {
      await supabase.auth.signOut();
      setNotice("Ce compte n'a pas les droits administrateur.");
      setLoading(false);
      return;
    }

    void navigate({ to: "/admin/preinscriptions" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="glass w-full max-w-sm rounded-2xl border p-8">
        <p className="text-xs uppercase tracking-[.3em] text-primary">Administration privée</p>
        <h1 className="mt-2 font-display text-3xl">Connexion</h1>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-xl border bg-card px-4 py-2 text-foreground"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border bg-card px-4 py-2 text-foreground"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {notice && (
            <p className="rounded-xl border border-primary/30 p-3 text-sm" role="status">
              {notice}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
