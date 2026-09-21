import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/login")({ component: AdminLogin });

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setNotice("Identifiants incorrects.");
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
            <Link
              to="/admin/forgot-password"
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              Mot de passe oublié ?
            </Link>
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
