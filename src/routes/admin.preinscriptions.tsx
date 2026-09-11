import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Registration = {
  id: string;
  first_name: string;
  email: string;
  location: string | null;
  city: string | null;
  created_at: string;
  status: string;
  invitation_sent_at: string | null;
  user_id: string | null;
};

export const Route = createFileRoute("/admin/preinscriptions")({
  component: AdminPreinscriptions,
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

function AdminPreinscriptions() {
  const [rows, setRows] = useState<Registration[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("Chargement…");
  async function load() {
    if (!supabase) return setNotice("Supabase n’est pas configuré.");
    const { data, error } = await supabase
      .from("preinscriptions")
      .select("id,first_name,email,location,city,created_at,status,invitation_sent_at,user_id")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Registration[]);
    setNotice(error ? "Accès refusé : un compte administrateur est requis." : "");
  }
  useEffect(() => {
    void load();
  }, []);
  const shown = useMemo(
    () =>
      rows.filter(
        (row) =>
          (filter === "all" || row.status === filter) &&
          `${row.first_name} ${row.email} ${row.location ?? row.city ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [rows, filter, query],
  );
  const count = (status: string) => rows.filter((row) => row.status === status).length;
  async function invite(ids: string[]) {
    if (
      !supabase ||
      !ids.length ||
      !window.confirm(`Confirmer l’envoi de ${ids.length} invitation(s) ?`)
    )
      return;
    setNotice("Envoi en cours…");
    const { data, error } = await supabase.functions.invoke("send-preinscription-invitations", {
      body: { ids },
    });
    setNotice(
      error
        ? "Campagne suspendue ou envoi refusé. Aucun envoi n’a été effectué."
        : `${data.results.filter((item: { ok: boolean }) => item.ok).length} invitation(s) traitée(s).`,
    );
    setSelected([]);
    await load();
  }
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[.3em] text-primary">Administration privée</p>
        <h1 className="mt-2 font-display text-4xl">Préinscriptions</h1>
        <p className="mt-2 text-sm">
          <Link to="/admin/members" className="text-primary hover:underline">
            Voir les membres inscrits
          </Link>
        </p>
        <div className="my-8 grid gap-4 sm:grid-cols-4">
          {[
            ["Total", rows.length],
            ["En attente", count("pending")],
            ["Invitées", count("invited")],
            ["Converties", count("converted")],
          ].map(([label, value]) => (
            <div className="rounded-2xl border p-5" key={label}>
              <p className="text-sm text-muted-foreground">{label}</p>
              <strong className="text-3xl">{value}</strong>
            </div>
          ))}
        </div>
        <div className="mb-5 flex flex-wrap gap-3">
          <input
            className="min-w-64 flex-1 rounded-xl border bg-card px-4 py-2"
            type="search"
            placeholder="Rechercher nom, e-mail, ville…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="rounded-xl border bg-card px-4"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="invited">Invités</option>
            <option value="converted">Convertis</option>
            <option value="invalid">Invalides</option>
            <option value="declined">Désinscrits</option>
          </select>
          <button
            className="rounded-xl bg-primary px-5 text-primary-foreground disabled:opacity-40"
            disabled={!selected.length}
            onClick={() => void invite(selected)}
          >
            Inviter la sélection ({selected.length})
          </button>
        </div>
        {notice && (
          <p className="mb-4 rounded-xl border border-primary/30 p-3" role="status">
            {notice}
          </p>
        )}
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card">
              <tr>
                {[
                  "",
                  "Prénom",
                  "E-mail",
                  "Ville",
                  "Inscription",
                  "Statut",
                  "Invitation",
                  "Compte",
                  "",
                ].map((h) => (
                  <th className="p-3" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr className="border-t" key={row.id}>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      aria-label={`Sélectionner ${row.email}`}
                      checked={selected.includes(row.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, row.id]
                            : selected.filter((id) => id !== row.id),
                        )
                      }
                    />
                  </td>
                  <td className="p-3">{row.first_name}</td>
                  <td className="p-3">{row.email}</td>
                  <td className="p-3">{row.location ?? row.city ?? "—"}</td>
                  <td className="p-3">{new Date(row.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3">{row.status}</td>
                  <td className="p-3">
                    {row.invitation_sent_at
                      ? new Date(row.invitation_sent_at).toLocaleDateString("fr-FR")
                      : "Non"}
                  </td>
                  <td className="p-3">{row.user_id ? "Oui" : "Non"}</td>
                  <td className="p-3">
                    <button
                      className="text-primary disabled:opacity-40"
                      disabled={row.status !== "pending"}
                      onClick={() => void invite([row.id])}
                    >
                      Envoyer l’invitation
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
