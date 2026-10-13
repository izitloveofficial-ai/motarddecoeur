import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDateFr } from "@/lib/format";
import { requireAdminPage } from "@/lib/require-admin";
import { AdminNotice, AdminShell } from "@/components/admin/AdminShell";

type Announcement = { id: string; title: string; body: string; created_at: string };

export const Route = createFileRoute("/admin/announcements")({
  ssr: false,
  component: AdminAnnouncements,
  beforeLoad: requireAdminPage,
});

function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [notice, setNotice] = useState("Chargement…");
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    if (!supabase) return setNotice("Supabase n'est pas configuré.");
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setNotice("Accès refusé : un compte administrateur est requis.");
      return;
    }
    setItems(data ?? []);
    setNotice(data?.length ? "" : "Aucune annonce publiée pour le moment.");
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();
    if (!title || !body) return;
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("announcements")
      .insert({ title, body, created_by: user?.id ?? null });
    setSubmitting(false);
    if (error) {
      setNotice("L'annonce n'a pas pu être publiée.");
      return;
    }
    form.reset();
    await load();
  }

  async function remove(id: string) {
    if (!supabase) return;
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    setPendingId(id);
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    setPendingId(null);
    if (error) {
      setNotice("L'annonce n'a pas pu être supprimée.");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <AdminShell
      title="Annonces à la communauté"
      description="Les annonces publiées ici apparaissent dans un bandeau visible par tous les membres connectés."
      maxWidth="max-w-4xl"
      current="/admin/announcements"
    >
      <form
        onSubmit={(event) => void create(event)}
        className="my-8 space-y-4 rounded-2xl border p-6"
      >
        <div>
          <label className="mb-1 block text-sm" htmlFor="title">
            Titre
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={120}
            className="w-full rounded-xl border bg-card px-4 py-2"
            placeholder="Ex : Maintenance prévue ce soir"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="body">
            Message
          </label>
          <textarea
            id="body"
            name="body"
            required
            maxLength={500}
            rows={4}
            className="w-full rounded-xl border bg-card px-4 py-2"
            placeholder="Détail du message affiché aux membres…"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "Publication…" : "Publier l'annonce"}
        </button>
      </form>
      <AdminNotice message={notice} />
      <ul className="space-y-4">
        {items.map((item) => (
          <li className="rounded-2xl border p-5" key={item.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl">{item.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Publié le {formatDateFr(item.created_at)}
                </p>
              </div>
              <button
                disabled={pendingId === item.id}
                className="shrink-0 text-destructive font-semibold underline disabled:opacity-50"
                onClick={() => void remove(item.id)}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
