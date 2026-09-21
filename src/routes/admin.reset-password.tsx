import { Link, createFileRoute, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/reset-password")({
  component: AdminResetPassword,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
});

function AdminResetPassword() {
  const { token } = useSearch({ from: "/admin/reset-password" });
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const rules = {
    length: password.length >= 12,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) return setMessage("Les deux mots de passe sont différents.");
    if (!Object.values(rules).every(Boolean))
      return setMessage("Le mot de passe ne respecte pas toutes les règles.");
    const response = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password, confirmation }),
    });
    setMessage(
      response.ok
        ? "Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter."
        : "Ce lien est invalide, expiré ou a déjà été utilisé.",
    );
  }
  const requirements = [
    [rules.length, "12 caractères minimum"],
    [rules.lower, "une minuscule"],
    [rules.upper, "une majuscule"],
    [rules.number, "un chiffre"],
    [rules.symbol, "un caractère spécial"],
  ] as const;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="glass w-full max-w-md rounded-2xl border p-8">
        <p className="text-xs uppercase tracking-[.3em] text-primary">Administration privée</p>
        <h1 className="mt-2 font-display text-3xl">Nouveau mot de passe</h1>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm text-muted-foreground">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border bg-card px-4 py-2 pr-12 text-foreground"
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute inset-y-0 right-0 px-4 text-muted-foreground"
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-sm text-muted-foreground">
              Confirmation du nouveau mot de passe
            </label>
            <input
              id="confirm-password"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="w-full rounded-xl border bg-card px-4 py-2 text-foreground"
            />
          </div>
          <ul className="grid gap-1 text-sm" aria-label="Règles du mot de passe">
            {requirements.map(([valid, label]) => (
              <li key={label} className={valid ? "text-emerald-400" : "text-muted-foreground"}>
                {valid ? "✓" : "○"} {label}
              </li>
            ))}
          </ul>
          {message && (
            <p role="status" className="rounded-xl border border-primary/30 p-3 text-sm">
              {message}
            </p>
          )}
          <button className="w-full rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground">
            Enregistrer mon nouveau mot de passe
          </button>
        </form>
        <Link to="/admin/login" className="mt-6 inline-block text-sm text-primary hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </main>
  );
}
