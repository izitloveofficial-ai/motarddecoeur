import { Link, createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireAdminPage } from "@/lib/require-admin";

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
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[.3em] text-primary">Administration privée</p>
        <h1 className="mt-2 font-display text-4xl">Annonces à la communauté</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Les annonces publiées ici apparaissent dans un bandeau visible par tous les membres
          connectés.
        </p>
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
        {notice && (
          <p className="mb-4 rounded-xl border border-primary/30 p-3" role="status">
            {notice}
          </p>
        )}
        <ul className="space-y-4">
          {items.map((item) => (
            <li className="rounded-2xl border p-5" key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Publié le {new Date(item.created_at).toLocaleDateString("fr-FR")}
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
        <p className="mt-8 text-sm">
          <Link to="/admin/members" className="text-primary hover:underline">
            Voir les membres
          </Link>
          {" · "}
          <Link to="/admin/reports" className="text-primary hover:underline">
            Voir les signalements
          </Link>
        </p>
      </div>
    </main>
  );
}
