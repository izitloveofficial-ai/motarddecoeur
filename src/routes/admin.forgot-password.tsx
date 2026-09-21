import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/forgot-password")({ component: AdminForgotPassword });

function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const result = (await fetch("/api/admin/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((value) => value.json())
      .catch(() => null)) as { message?: string } | null;
    setMessage(
      result?.message ??
        "Si cette adresse correspond à un compte administrateur, un lien de réinitialisation vient d’être envoyé.",
    );
    setLoading(false);
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="glass w-full max-w-sm rounded-2xl border p-8">
        <p className="text-xs uppercase tracking-[.3em] text-primary">Administration privée</p>
        <h1 className="mt-2 font-display text-3xl">Mot de passe oublié</h1>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <label className="block text-sm text-muted-foreground" htmlFor="reset-email">
            Adresse e-mail
          </label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border bg-card px-4 py-2 text-foreground"
          />
          {message && (
            <p role="status" className="rounded-xl border border-primary/30 p-3 text-sm">
              {message}
            </p>
          )}
          <button
            disabled={loading}
            className="w-full rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground disabled:opacity-40"
          >
            {loading ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>
        <Link to="/admin/login" className="mt-6 inline-block text-sm text-primary hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </main>
  );
}
