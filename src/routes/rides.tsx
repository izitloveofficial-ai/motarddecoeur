import { createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarPlus, MapPin, Users } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { requireAdmin } from "@/lib/require-admin";
import { supabase } from "@/lib/supabase";

type Ride = {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  starts_at: string;
  attendeeCount: number;
  joined: boolean;
};

export const Route = createFileRoute("/rides")({
  component: Rides,
  beforeLoad: async () => {
    await requireAdmin();
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
});

function Rides() {
  const [rides, setRides] = useState<Ride[] | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMyId(user.id);
    const { data: events, error } = await supabase
      .from("events")
      .select("id, organizer_id, title, description, location_name, starts_at")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });
    if (error) {
      setNotice("Impossible de charger les balades pour le moment.");
      setRides([]);
      return;
    }
    const ids = (events ?? []).map((event) => event.id);
    const attendeesByEvent = new Map<string, string[]>();
    if (ids.length > 0) {
      const { data: attendees } = await supabase
        .from("event_attendees")
        .select("event_id, profile_id")
        .in("event_id", ids);
      for (const attendee of attendees ?? []) {
        const list = attendeesByEvent.get(attendee.event_id) ?? [];
        list.push(attendee.profile_id);
        attendeesByEvent.set(attendee.event_id, list);
      }
    }
    setRides(
      (events ?? []).map((event) => {
        const attendees = attendeesByEvent.get(event.id) ?? [];
        return { ...event, attendeeCount: attendees.length, joined: attendees.includes(user.id) };
      }),
    );
  }

  async function createRide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !myId) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    setSaving(true);
    const { error } = await supabase.from("events").insert({
      organizer_id: myId,
      title: String(data.get("title") ?? "").trim(),
      description: String(data.get("description") ?? "").trim() || null,
      location_name: String(data.get("location_name") ?? "").trim() || null,
      starts_at: new Date(String(data.get("starts_at"))).toISOString(),
    });
    setSaving(false);
    if (error) {
      setNotice("La balade n'a pas pu être créée.");
      return;
    }
    form.reset();
    setShowForm(false);
    setNotice("Balade créée !");
    await load();
  }

  async function toggleJoin(ride: Ride) {
    if (!supabase || !myId) return;
    if (ride.joined)
      await supabase
        .from("event_attendees")
        .delete()
        .eq("event_id", ride.id)
        .eq("profile_id", myId);
    else await supabase.from("event_attendees").insert({ event_id: ride.id, profile_id: myId });
    await load();
  }

  async function cancelRide(ride: Ride) {
    if (!supabase || !window.confirm(`Annuler la balade "${ride.title}" ?`)) return;
    await supabase.from("events").delete().eq("id", ride.id);
    await load();
  }

  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">
              Motards de Cœur
            </span>
            <h1 className="mt-2 font-display text-4xl">Balades</h1>
          </div>
          <button
            onClick={() => setShowForm((value) => !value)}
            className="flex items-center gap-2 rounded-full bg-gradient-red px-5 py-2.5 text-sm font-medium uppercase tracking-wider text-primary-foreground"
          >
            <CalendarPlus className="h-4 w-4" /> Organiser
          </button>
        </div>
        {notice && (
          <div className="mb-6 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">
            {notice}
          </div>
        )}
        {showForm && (
          <form
            onSubmit={createRide}
            className="mb-8 space-y-4 rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-6"
          >
            <label className="block text-sm font-medium">
              Titre *
              <input
                name="title"
                required
                maxLength={120}
                className="mt-2 w-full rounded-xl border border-white/15 bg-[#302526]/90 px-4 py-3 text-sm outline-none focus:border-[#e2b45f]/70"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Date et heure *
                <input
                  name="starts_at"
                  type="datetime-local"
                  required
                  className="mt-2 w-full rounded-xl border border-white/15 bg-[#302526]/90 px-4 py-3 text-sm outline-none focus:border-[#e2b45f]/70"
                />
              </label>
              <label className="text-sm font-medium">
                Lieu de rendez-vous
                <input
                  name="location_name"
                  maxLength={160}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-[#302526]/90 px-4 py-3 text-sm outline-none focus:border-[#e2b45f]/70"
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Description
              <textarea
                name="description"
                maxLength={1000}
                className="mt-2 min-h-24 w-full rounded-xl border border-white/15 bg-[#302526]/90 px-4 py-3 text-sm outline-none focus:border-[#e2b45f]/70"
              />
            </label>
            <button
              disabled={saving}
              type="submit"
              className="w-full rounded-full bg-gradient-red px-8 py-3 text-sm font-medium uppercase tracking-wider text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Création…" : "Créer la balade"}
            </button>
          </form>
        )}
        {rides === null && <p className="text-sm text-[#d4c6bf]">Chargement…</p>}
        {rides && rides.length === 0 && (
          <div className="rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-8 text-center text-sm text-[#d4c6bf]">
            Aucune balade prévue pour le moment. Sois le premier à en organiser une !
          </div>
        )}
        <ul className="space-y-3">
          {(rides ?? []).map((ride) => (
            <li
              key={ride.id}
              className="rounded-2xl border border-[#d6a85c]/20 bg-[#302425]/80 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl">{ride.title}</h2>
                  <p className="mt-1 text-sm text-[#e8be6c]">
                    {new Date(ride.starts_at).toLocaleString("fr-FR", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </p>
                  {ride.location_name && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[#d4c6bf]">
                      <MapPin className="h-3.5 w-3.5" /> {ride.location_name}
                    </p>
                  )}
                  {ride.description && (
                    <p className="mt-2 text-sm leading-relaxed text-[#d4c6bf]">
                      {ride.description}
                    </p>
                  )}
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[#a99b95]">
                    <Users className="h-3.5 w-3.5" /> {ride.attendeeCount} participant(s)
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    onClick={() => void toggleJoin(ride)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider ${ride.joined ? "border border-white/15 text-[#d4c6bf]" : "bg-gradient-red text-primary-foreground"}`}
                  >
                    {ride.joined ? "Se désinscrire" : "Participer"}
                  </button>
                  {ride.organizer_id === myId && (
                    <button
                      onClick={() => void cancelRide(ride)}
                      className="text-xs text-[#a99b95] hover:text-[#e8be6c]"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
