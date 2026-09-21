import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireAdminPage } from "@/lib/require-admin";

type ServiceHealth = {
  ok: boolean;
  detail?: string | null;
};

type HealthCheck = {
  checked_at: string;
  database: ServiceHealth;
  email: ServiceHealth;
  status: "ok" | "degraded";
};

export const Route = createFileRoute("/admin/status")({
  ssr: false,
  component: AdminStatus,
  beforeLoad: requireAdminPage,
});

function AdminStatus() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!supabase) {
      setError("Supabase n’est pas configuré.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const { data, error: invokeError } =
      await supabase.functions.invoke<HealthCheck>("health-check");
    if (invokeError || !data) {
      console.error("admin health check failed", invokeError);
      setError("Impossible d’effectuer le contrôle. Réessayez dans un instant.");
    } else {
      setHealth(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const services = health
    ? [
        { label: "Base de données", result: health.database },
        { label: "Envoi d’emails", result: health.email },
      ]
    : [];

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[.3em] text-primary">Administration privée</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">État des services</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Contrôle de la base de données et du service de messagerie email.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Contrôle…" : "Actualiser"}
          </button>
        </div>

        {error && (
          <p
            className="my-8 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-red-300"
            role="alert"
          >
            {error}
          </p>
        )}

        {health && (
          <>
            <div className="my-8 grid gap-4 sm:grid-cols-2">
              {services.map(({ label, result }) => (
                <section key={label} className="rounded-2xl border bg-card p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-display text-2xl">{label}</h2>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${result.ok ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-300"}`}
                    >
                      {result.ok ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {result.ok ? "OK" : "En panne"}
                    </span>
                  </div>
                  {result.detail && (
                    <p className="mt-4 break-words rounded-xl bg-background p-4 text-sm text-muted-foreground">
                      {result.detail}
                    </p>
                  )}
                </section>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Dernier contrôle : {new Date(health.checked_at).toLocaleString("fr-FR")}
            </p>
          </>
        )}

        {!health && loading && (
          <p className="my-8 text-sm text-muted-foreground" role="status">
            Contrôle des services en cours…
          </p>
        )}

        <Link
          to="/admin/preinscriptions"
          className="mt-8 inline-block text-primary hover:underline"
        >
          Retour aux préinscriptions
        </Link>
      </div>
    </main>
  );
}
