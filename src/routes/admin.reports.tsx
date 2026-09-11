import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporterName: string;
  reportedName: string;
  reportedId: string;
};

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
  beforeLoad: async () => {
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/admin/login" });
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      await supabase.auth.signOut();
      throw redirect({ to: "/admin/login" });
    }
  },
});

function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("pending");
  const [notice, setNotice] = useState("Chargement…");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("reports")
      .select("id, reason, details, status, created_at, reporter_id, reported_id")
      .order("created_at", { ascending: false });
    if (error) {
      setNotice("Accès refusé : un compte administrateur est requis.");
      return;
    }
    const ids = Array.from(
      new Set((data ?? []).flatMap((r) => [r.reporter_id, r.reported_id])),
    ).filter(Boolean) as string[];
    const namesById = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name")
        .in("id", ids);
      for (const profile of profiles ?? []) namesById.set(profile.id, profile.first_name);
    }
    setReports(
      (data ?? []).map((report) => ({
        id: report.id,
        reason: report.reason,
        details: report.details,
        status: report.status,
        created_at: report.created_at,
        reporterName: namesById.get(report.reporter_id ?? "") ?? "Compte supprimé",
        reportedName: namesById.get(report.reported_id ?? "") ?? "Compte supprimé",
        reportedId: report.reported_id,
      })),
    );
    setNotice((data ?? []).length === 0 ? "Aucun signalement." : "");
  }

  async function setStatus(id: string, status: string) {
    if (!supabase) return;
    await supabase.from("reports").update({ status }).eq("id", id);
    await load();
  }

  async function suspend(profileId: string) {
    if (!supabase) return;
    if (
      !window.confirm("Suspendre ce profil ? Il ne sera plus visible ni utilisable (réversible).")
    )
      return;
    await supabase.from("profiles").update({ is_active: false }).eq("id", profileId);
    setNotice("Profil suspendu.");
  }

  async function ban(profileId: string) {
    if (!supabase) return;
    if (
      !window.confirm(
        "Bannir définitivement ce compte ? Le compte et toutes ses données seront supprimés. Cette action est irréversible.",
      )
    )
      return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke("admin-ban-user", {
      body: { profile_id: profileId },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    });
    setNotice(error ? "Le bannissement a échoué." : "Compte banni et supprimé définitivement.");
    await load();
  }

  const shown = filter === "all" ? reports : reports.filter((report) => report.status === filter);

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[.3em] text-primary">Administration privée</p>
        <h1 className="mt-2 font-display text-4xl">Signalements</h1>
        <p className="mt-2 text-sm">
          <Link to="/admin/members" className="text-primary hover:underline">
            Voir les membres
          </Link>
          {" · "}
          <Link to="/admin/preinscriptions" className="text-primary hover:underline">
            Voir les préinscriptions
          </Link>
        </p>
        <div className="my-8 grid gap-4 sm:grid-cols-3">
          {[
            ["En attente", reports.filter((report) => report.status === "pending").length],
            ["Résolus", reports.filter((report) => report.status === "resolved").length],
            ["Rejetés", reports.filter((report) => report.status === "dismissed").length],
          ].map(([label, value]) => (
            <div className="rounded-2xl border p-5" key={label as string}>
              <p className="text-sm text-muted-foreground">{label}</p>
              <strong className="text-3xl">{value}</strong>
            </div>
          ))}
        </div>
        <select
          className="mb-5 rounded-xl border bg-card px-4 py-2"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="pending">En attente</option>
          <option value="resolved">Résolus</option>
          <option value="dismissed">Rejetés</option>
          <option value="all">Tous</option>
        </select>
        {notice && (
          <p className="mb-4 rounded-xl border border-primary/30 p-3" role="status">
            {notice}
          </p>
        )}
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card">
              <tr>
                {["Date", "Signalé par", "Profil signalé", "Motif", "Détails", "Statut", ""].map(
                  (heading) => (
                    <th className="p-3" key={heading}>
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {shown.map((report) => (
                <tr className="border-t align-top" key={report.id}>
                  <td className="p-3">{new Date(report.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3">{report.reporterName}</td>
                  <td className="p-3">{report.reportedName}</td>
                  <td className="p-3">{report.reason}</td>
                  <td className="max-w-xs p-3">{report.details ?? "—"}</td>
                  <td className="p-3">{report.status}</td>
                  <td className="space-x-2 whitespace-nowrap p-3">
                    {report.status === "pending" && (
                      <>
                        <button
                          className="text-primary"
                          onClick={() => void setStatus(report.id, "resolved")}
                        >
                          Résoudre
                        </button>
                        <button
                          className="text-muted-foreground"
                          onClick={() => void setStatus(report.id, "dismissed")}
                        >
                          Rejeter
                        </button>
                      </>
                    )}
                    <button
                      className="text-destructive underline"
                      onClick={() => void suspend(report.reportedId)}
                    >
                      Suspendre
                    </button>
                    <button
                      className="text-destructive font-semibold underline"
                      onClick={() => void ban(report.reportedId)}
                    >
                      Bannir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
