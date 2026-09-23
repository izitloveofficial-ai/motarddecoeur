import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireAdminPage } from "@/lib/require-admin";

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

type ProgressUpdate = {
  id: string;
  subject: string;
  body: string;
  created_at: string;
  sent_at: string | null;
  recipient_count: number | null;
  is_active: boolean;
};

export const Route = createFileRoute("/admin/preinscriptions")({
  ssr: false,
  component: AdminPreinscriptions,
  beforeLoad: requireAdminPage,
});

function AdminPreinscriptions() {
  const [rows, setRows] = useState<Registration[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("Chargement…");
  const [authenticationRequired, setAuthenticationRequired] = useState(false);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [progressHistoryNotice, setProgressHistoryNotice] = useState("Chargement…");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSendingProgressUpdate, setIsSendingProgressUpdate] = useState(false);
  const [progressSendNotice, setProgressSendNotice] = useState("");

  async function loadProgressUpdates() {
    const client = supabase;
    if (!client) return;

    setProgressHistoryNotice("Chargement…");
    const { data, error } = await client
      .from("progress_updates")
      .select("id, subject, body, created_at, sent_at, recipient_count, is_active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("admin progress updates read failed", error);
      setProgressHistoryNotice("Impossible de charger l’historique des mises à jour.");
      return;
    }

    setProgressUpdates((data ?? []) as ProgressUpdate[]);
    setProgressHistoryNotice(data?.length ? "" : "Aucune mise à jour envoyée pour le moment.");
  }

  async function load() {
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (!session) {
      setAuthenticationRequired(true);
      return setNotice("Connexion administrateur requise");
    }
    // Lecture directe avec la session admin : la règle d'accès is_admin() protège la table.
    const result = await loadAdminPreinscriptions<Registration>(supabase!);
    if (result.status === "forbidden") {
      setAuthenticationRequired(true);
      return setNotice("Connexion administrateur requise");
    }
    if (result.status === "error") return setNotice("Impossible de charger les préinscriptions.");
    await loadProgressUpdates();
    setRows(result.rows);
    setAuthenticationRequired(false);
    setNotice("");
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
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) return setNotice("Une connexion administrateur est requise.");
    const response = await fetch("/api/admin/preinscriptions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ ids }),
    });
    const data = (await response.json()) as { results?: { ok: boolean }[] };
    setNotice(
      !response.ok
        ? "Campagne suspendue ou envoi refusé. Aucun envoi n’a été effectué."
        : `${(data.results ?? []).filter((item) => item.ok).length} invitation(s) traitée(s).`,
    );
    setSelected([]);
    await load();
  }

  async function sendProgressUpdate() {
    const client = supabase;
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    if (!client || !trimmedSubject || !trimmedBody || isSendingProgressUpdate) return;
    if (
      !window.confirm(
        "Confirmer l’envoi de cette mise à jour à tous les pré-inscrits qui ne l’ont pas encore reçue ?",
      )
    )
      return;

    setIsSendingProgressUpdate(true);
    setProgressSendNotice("");
    const { data, error } = await client.functions.invoke("send-progress-update", {
      body: { subject: trimmedSubject, body: trimmedBody },
    });

    let forbidden = data?.error === "forbidden";
    if (!forbidden && error && "context" in error && error.context instanceof Response) {
      const errorPayload = (await error.context
        .clone()
        .json()
        .catch(() => null)) as {
        error?: string;
      } | null;
      forbidden = errorPayload?.error === "forbidden";
    }

    if (error || data?.error) {
      setProgressSendNotice(
        forbidden
          ? "Vous devez être connecté en admin pour envoyer une mise à jour."
          : error?.message || data?.error || "Impossible d’envoyer la mise à jour.",
      );
      setIsSendingProgressUpdate(false);
      return;
    }

    setProgressSendNotice(`Envoyé à ${data.sent} personne(s) sur ${data.totalCandidates}.`);
    setSubject("");
    setBody("");
    await loadProgressUpdates();
    setIsSendingProgressUpdate(false);
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
          {" · "}
          <Link to="/admin/reports" className="text-primary hover:underline">
            Voir les signalements
          </Link>
          {" · "}
          <Link to="/admin/announcements" className="text-primary hover:underline">
            Gérer les annonces
          </Link>
          {" · "}
          <Link to="/admin/status" className="text-primary hover:underline">
            Voir l’état des services
          </Link>
        </p>
        {authenticationRequired ? (
          <div className="my-8 rounded-2xl border border-primary/30 p-6" role="alert">
            <p className="font-semibold">Connexion administrateur requise</p>
            <Link
              to="/login"
              className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2 text-primary-foreground"
            >
              Se connecter
            </Link>
          </div>
        ) : (
          <>
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
            <section className="mb-8 rounded-2xl border bg-card p-6">
              <h2 className="font-display text-2xl">Mises à jour d’avancement</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Informez les pré-inscrits de l’avancement du projet. La dernière mise à jour active
                sera aussi envoyée automatiquement aux nouveaux inscrits.
              </p>

              <form
                className="mt-6 grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendProgressUpdate();
                }}
              >
                <label className="grid gap-2 text-sm font-medium" htmlFor="progress-subject">
                  Sujet
                  <input
                    id="progress-subject"
                    className="rounded-xl border bg-background px-4 py-2 font-normal"
                    type="text"
                    maxLength={200}
                    required
                    disabled={isSendingProgressUpdate}
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium" htmlFor="progress-body">
                  Message
                  <textarea
                    id="progress-body"
                    className="min-h-40 resize-y rounded-xl border bg-background px-4 py-3 font-normal"
                    required
                    disabled={isSendingProgressUpdate}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                  />
                </label>
                <div>
                  <button
                    className="rounded-xl bg-primary px-5 py-2 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    type="submit"
                    disabled={isSendingProgressUpdate || !subject.trim() || !body.trim()}
                  >
                    {isSendingProgressUpdate
                      ? "Envoi en cours…"
                      : "Envoyer à tous les pré-inscrits"}
                  </button>
                </div>
                {progressSendNotice && (
                  <p className="rounded-xl border border-primary/30 p-3" role="status">
                    {progressSendNotice}
                  </p>
                )}
              </form>

              <h3 className="mt-8 text-lg font-semibold">Historique des envois</h3>
              {progressHistoryNotice ? (
                <p className="mt-3 text-sm text-muted-foreground" role="status">
                  {progressHistoryNotice}
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-xl border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-background">
                      <tr>
                        <th className="p-3">Sujet</th>
                        <th className="p-3">Date d’envoi</th>
                        <th className="p-3">Destinataires</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progressUpdates.map((update) => (
                        <tr className="border-t" key={update.id}>
                          <td className="p-3 font-medium">{update.subject}</td>
                          <td className="p-3">
                            {update.sent_at
                              ? new Date(update.sent_at).toLocaleString("fr-FR")
                              : "—"}
                          </td>
                          <td className="p-3">{update.recipient_count ?? 0}</td>
                          <td className="p-3">
                            {update.is_active ? (
                              <span className="inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                                Active
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
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
                      <td className="p-3">
                        {new Date(row.created_at).toLocaleDateString("fr-FR")}
                      </td>
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
          </>
        )}
      </div>
    </main>
  );
}
