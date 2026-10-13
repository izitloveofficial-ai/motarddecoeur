import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminNotice, AdminShell } from "@/components/admin/AdminShell";
import { buildDailySeries, percentChange } from "@/lib/admin-dashboard";
import { ageFromBirthDate, formatDateFr } from "@/lib/format";
import { requireAdminPage } from "@/lib/require-admin";
import { supabase } from "@/lib/supabase";

type RecentMember = {
  id: string;
  first_name: string;
  birth_date: string;
  moto_brand: string | null;
  moto_model: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
};

type Stats = {
  members: number;
  active: number;
  verified: number;
  preinscriptions: number | null;
  pendingReports: number | null;
  announcements: number | null;
  memberDates: string[];
  preinscriptionDates: string[];
};

type StatusFilter = "all" | "active" | "inactive" | "unverified";
const RANGES = [7, 30] as const;

export const Route = createFileRoute("/admin/")({
  ssr: false,
  component: AdminDashboard,
  beforeLoad: requireAdminPage,
});

function StatCard({
  label,
  value,
  hint,
  to,
  alert = false,
}: {
  label: string;
  value: number | null;
  hint?: string;
  to?: "/admin/members" | "/admin/preinscriptions" | "/admin/reports" | "/admin/announcements";
  alert?: boolean;
}) {
  const content = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <strong className={`mt-1 block text-3xl ${alert && value ? "text-primary" : ""}`}>
        {value ?? "—"}
      </strong>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  const className = "rounded-2xl border bg-card/40 p-5 transition";
  return to ? (
    <Link to={to} className={`${className} block hover:border-primary/50`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<RecentMember[]>([]);
  const [notice, setNotice] = useState("Chargement…");
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setNotice("Supabase n'est pas configuré.");
      return;
    }
    const client = supabase;
    setRefreshing(true);
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const count = (table: string) =>
      client.from(table).select("id", { count: "exact", head: true });

    const [
      total,
      active,
      verified,
      recentProfiles,
      latest,
      pre,
      preRecent,
      reports,
      announcements,
    ] = await Promise.all([
      count("profiles"),
      count("profiles").eq("is_active", true),
      count("profiles").eq("is_verified", true),
      client.from("profiles").select("created_at").gte("created_at", since).limit(5000),
      client
        .from("profiles")
        .select(
          "id, first_name, birth_date, moto_brand, moto_model, is_active, is_verified, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      count("preinscriptions"),
      client.from("preinscriptions").select("created_at").gte("created_at", since).limit(5000),
      count("reports").eq("status", "pending"),
      count("announcements"),
    ]);

    if (total.error || latest.error) {
      setNotice("Accès refusé : un compte administrateur est requis.");
      setRefreshing(false);
      return;
    }
    setStats({
      members: total.count ?? 0,
      active: active.count ?? 0,
      verified: verified.count ?? 0,
      preinscriptions: pre.error ? null : (pre.count ?? 0),
      pendingReports: reports.error ? null : (reports.count ?? 0),
      announcements: announcements.error ? null : (announcements.count ?? 0),
      memberDates: (recentProfiles.data ?? []).map((row) => row.created_at),
      preinscriptionDates: (preRecent.data ?? []).map((row) => row.created_at),
    });
    setMembers((latest.data ?? []) as RecentMember[]);
    setNotice(pre.error ? "Les pré-inscriptions n'ont pas pu être chargées." : "");
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const chart = useMemo(() => {
    if (!stats) return { data: [], newMembers: 0, previousMembers: 0 };
    const members60 = buildDailySeries(stats.memberDates, range * 2);
    const pre60 = buildDailySeries(stats.preinscriptionDates, range * 2);
    const data = members60.slice(range).map((point, index) => ({
      label: point.label,
      Membres: point.count,
      "Pré-inscriptions": pre60[range + index].count,
    }));
    const sum = (points: { count: number }[]) => points.reduce((total, p) => total + p.count, 0);
    return {
      data,
      newMembers: sum(members60.slice(range)),
      previousMembers: sum(members60.slice(0, range)),
    };
  }, [stats, range]);

  const shown = useMemo(() => {
    const text = query.trim().toLowerCase();
    return members
      .filter((member) => {
        if (statusFilter === "active" && !member.is_active) return false;
        if (statusFilter === "inactive" && member.is_active) return false;
        if (statusFilter === "unverified" && member.is_verified) return false;
        return `${member.first_name} ${member.moto_brand ?? ""} ${member.moto_model ?? ""}`
          .toLowerCase()
          .includes(text);
      })
      .slice(0, 10);
  }, [members, query, statusFilter]);

  async function toggleActive(member: RecentMember) {
    if (!supabase || pendingId) return;
    setPendingId(member.id);
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !member.is_active })
      .eq("id", member.id);
    setPendingId(null);
    if (error) {
      setNotice("Le statut n'a pas pu être modifié.");
      return;
    }
    setNotice("");
    setMembers((current) =>
      current.map((row) => (row.id === member.id ? { ...row, is_active: !row.is_active } : row)),
    );
    setStats((current) =>
      current ? { ...current, active: current.active + (member.is_active ? -1 : 1) } : current,
    );
  }

  const growth = percentChange(chart.newMembers, chart.previousMembers);

  return (
    <AdminShell
      title="Tableau de bord"
      description="L'essentiel de Motards de Cœur en un coup d'œil."
      current="/admin"
    >
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void load()}
          disabled={refreshing}
          className="rounded-xl border px-4 py-2 text-sm transition hover:border-primary/50 disabled:opacity-50"
        >
          {refreshing ? "Actualisation…" : "Actualiser"}
        </button>
        <Link
          to="/admin/announcements"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Publier une annonce
        </Link>
      </div>

      <div className="mt-6">
        <AdminNotice message={notice} />
      </div>

      {stats && (
        <>
          <section
            aria-label="Statistiques clés"
            className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6"
          >
            <StatCard label="Membres" value={stats.members} to="/admin/members" />
            <StatCard
              label="Actifs"
              value={stats.active}
              hint={
                stats.members
                  ? `${Math.round((stats.active / stats.members) * 100)} % des membres`
                  : undefined
              }
            />
            <StatCard label="Vérifiés" value={stats.verified} />
            <StatCard
              label="Pré-inscriptions"
              value={stats.preinscriptions}
              to="/admin/preinscriptions"
            />
            <StatCard
              label="Signalements à traiter"
              value={stats.pendingReports}
              to="/admin/reports"
              alert
            />
            <StatCard label="Annonces" value={stats.announcements} to="/admin/announcements" />
          </section>

          <section
            className="mt-8 rounded-2xl border bg-card/40 p-5"
            aria-label="Évolution des inscriptions"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">Nouvelles inscriptions</h2>
                <p className="text-sm text-muted-foreground">
                  {chart.newMembers} nouveau(x) membre(s) sur {range} jours
                  {growth !== null &&
                    ` (${growth >= 0 ? "+" : ""}${growth} % par rapport à la période précédente)`}
                </p>
              </div>
              <div className="flex gap-2" role="group" aria-label="Période">
                {RANGES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={range === value}
                    onClick={() => setRange(value)}
                    className={`rounded-full border px-4 py-1 text-sm transition ${range === value ? "border-primary bg-primary/20" : "hover:border-primary/50"}`}
                  >
                    {value} jours
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart.data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Membres"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.25}
                  />
                  <Area
                    type="monotone"
                    dataKey="Pré-inscriptions"
                    stroke="#e2b45f"
                    fill="#e2b45f"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mt-8" aria-label="Derniers membres">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl">Derniers membres</h2>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <input
                  aria-label="Rechercher un membre"
                  type="search"
                  placeholder="Prénom ou moto…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="rounded-xl border bg-card px-4 py-2 text-sm"
                />
                <select
                  aria-label="Filtrer par statut"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  className="rounded-xl border bg-card px-4 py-2 text-sm"
                >
                  <option value="all">Tous</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Désactivés</option>
                  <option value="unverified">Non vérifiés</option>
                </select>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto rounded-2xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-card">
                  <tr>
                    {["Prénom", "Âge", "Moto", "Inscription", "Statut", "Action"].map((heading) => (
                      <th className="p-3" key={heading}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.length === 0 && (
                    <tr>
                      <td className="p-4 text-muted-foreground" colSpan={6}>
                        Aucun membre ne correspond à ces critères.
                      </td>
                    </tr>
                  )}
                  {shown.map((member) => (
                    <tr className="border-t" key={member.id}>
                      <td className="p-3 font-medium">{member.first_name}</td>
                      <td className="p-3">{ageFromBirthDate(member.birth_date)}</td>
                      <td className="p-3">
                        {[member.moto_brand, member.moto_model].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="p-3 whitespace-nowrap">{formatDateFr(member.created_at)}</td>
                      <td className="p-3 whitespace-nowrap">
                        {member.is_active ? "Actif" : "Désactivé"}
                        {member.is_verified && " · Vérifié"}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          disabled={pendingId === member.id}
                          onClick={() => void toggleActive(member)}
                          className="text-primary disabled:opacity-50"
                        >
                          {member.is_active ? "Désactiver" : "Réactiver"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm">
              <Link to="/admin/members" className="text-primary hover:underline">
                Voir tous les membres (photos, bannissement)
              </Link>
            </p>
          </section>
        </>
      )}
    </AdminShell>
  );
}
