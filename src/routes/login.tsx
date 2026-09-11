import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Connexion — Motards de Cœur" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return setNotice("Connexion non configurée.");
    setLoading(true);
    setNotice("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setNotice(
        error.message.toLowerCase().includes("email not confirmed")
          ? "Confirme d'abord ton adresse email en cliquant sur le lien reçu."
          : "Email ou mot de passe incorrect.",
      );
      setLoading(false);
      return;
    }

    void navigate({ to: "/profile/setup" });
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-white/15 bg-[#302526]/90 px-4 py-3 text-sm text-[#fff9f0] shadow-inner shadow-black/15 outline-none transition placeholder:text-[#cdbdb5] hover:border-[#d6a85c]/35 focus:border-[#e2b45f]/70 focus:bg-[#38292a] focus:ring-2 focus:ring-[#d9a441]/20";

  return (
    <Layout>
      <section className="mx-auto max-w-md px-6 py-12 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <h1 className="mt-3 mb-8 font-display text-4xl">Connexion</h1>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Email
            <input
              className={fieldClass}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Mot de passe
            <input
              className={fieldClass}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <p className="text-right text-xs">
            <Link to="/forgot-password" className="text-primary hover:underline">
              Mot de passe oublié ?
            </Link>
          </p>
          {notice && (
            <div
              role="status"
              className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm"
            >
              {notice}
            </div>
          )}
          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-full bg-gradient-red px-8 py-4 text-sm font-medium uppercase tracking-wider text-primary-foreground shadow-glow transition-all hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
          <p className="text-center text-sm text-[#d4c6bf]">
            Pas encore de compte ?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              S'inscrire
            </Link>
          </p>
        </form>
      </section>
    </Layout>
  );
}
