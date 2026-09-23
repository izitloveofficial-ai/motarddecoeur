import { createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarDays, CalendarPlus, List, MapPin, Users } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Calendar } from "@/components/ui/calendar";
import { sendPushNotification } from "@/lib/push";
import { requireAppAccess } from "@/lib/require-admin";
import { supabase } from "@/lib/supabase";

type Ride = {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  starts_at: string;
  organizerFirstName: string;
  attendeeCount: number;
  joined: boolean;
};

export const Route = createFileRoute("/rides")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  component: Rides,
  beforeLoad: async () => {
    await requireAppAccess();
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
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [saving, setSaving] = useState(false);
  const [followedOrganizerIds, setFollowedOrganizerIds] = useState<Set<string>>(new Set());
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "requesting" | "captured" | "error"
  >("idle");

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
    const organizerIds = [...new Set((events ?? []).map((event) => event.organizer_id))];
    const attendeesByEvent = new Map<string, string[]>();
    const organizerNames = new Map<string, string>();
    const [{ data: attendees }, { data: follows }, { data: organizers }] = await Promise.all([
      ids.length > 0
        ? supabase.from("event_attendees").select("event_id, profile_id").in("event_id", ids)
        : Promise.resolve({ data: [] }),
      supabase.from("follows").select("followed_id").eq("follower_id", user.id),
      organizerIds.length > 0
        ? supabase.from("profiles").select("id, first_name").in("id", organizerIds)
        : Promise.resolve({ data: [] }),
    ]);
    for (const attendee of attendees ?? []) {
      const list = attendeesByEvent.get(attendee.event_id) ?? [];
      list.push(attendee.profile_id);
      attendeesByEvent.set(attendee.event_id, list);
    }
    for (const organizer of organizers ?? [])
      organizerNames.set(organizer.id, organizer.first_name);
    setFollowedOrganizerIds(new Set((follows ?? []).map((follow) => follow.followed_id)));
    setRides(
      (events ?? []).map((event) => {
        const attendees = attendeesByEvent.get(event.id) ?? [];
        return {
          ...event,
          organizerFirstName: organizerNames.get(event.organizer_id) ?? "Motard(e)",
          attendeeCount: attendees.length,
          joined: attendees.includes(user.id),
        };
      }),
    );
  }

  function captureRideLocation() {
    if (!navigator.geolocation) return setLocationStatus("error");
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      ({ coords: position }) => {
        setCoords({ lat: position.latitude, lng: position.longitude });
        setLocationStatus("captured");
      },
      () => setLocationStatus("error"),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  async function createRide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !myId) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    setSaving(true);
    const title = String(data.get("title") ?? "").trim();
    const { data: createdRide, error } = await supabase
      .from("events")
      .insert({
        organizer_id: myId,
        title,
        description: String(data.get("description") ?? "").trim() || null,
        location_name: String(data.get("location_name") ?? "").trim() || null,
        starts_at: new Date(String(data.get("starts_at"))).toISOString(),
        ...(coords ? { location: `SRID=4326;POINT(${coords.lng} ${coords.lat})` } : {}),
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      setNotice("La balade n'a pas pu être créée.");
      return;
    }
    const [{ data: organizer }, { data: targets }] = await Promise.all([
      supabase.from("profiles").select("first_name").eq("id", myId).maybeSingle(),
      supabase.rpc("event_notification_targets", { p_event_id: createdRide.id }),
    ]);
    await Promise.all(
      (targets ?? [])
        .filter(({ profile_id }: { profile_id: string }) => profile_id !== myId)
        .map(({ profile_id }: { profile_id: string }) =>
          sendPushNotification(
            profile_id,
            `${organizer?.first_name ?? "Un motard"} a créé une nouvelle balade : ${title}`,
            "Rejoins-la si le cœur t'en dit !",
          ),
        ),
    );
    form.reset();
    setCoords(null);
    setLocationStatus("idle");
    setShowForm(false);
    setNotice("Balade créée !");
    await load();
  }

  async function toggleFollow(organizerId: string) {
    if (!supabase || !myId || organizerId === myId) return;
    if (followedOrganizerIds.has(organizerId))
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", myId)
        .eq("followed_id", organizerId);
    else await supabase.from("follows").insert({ follower_id: myId, followed_id: organizerId });
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

  const ridesForSelectedDate = selectedDate
    ? (rides ?? []).filter((ride) => isSameLocalDay(new Date(ride.starts_at), selectedDate))
    : [];

  function RideCard({ ride }: { ride: Ride }) {
    return (
      <article className="rounded-2xl border border-[#d6a85c]/20 bg-[#302425]/80 p-5">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-xl">{ride.title}</h2>
            <p className="mt-1 text-xs text-[#a99b95]">Organisée par {ride.organizerFirstName}</p>
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
              <p className="mt-2 text-sm leading-relaxed text-[#d4c6bf]">{ride.description}</p>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[#a99b95]">
              <Users className="h-3.5 w-3.5" /> {ride.attendeeCount} participant(s)
            </p>
          </div>
          <div className="flex shrink-0 flex-row items-center justify-between gap-2 sm:flex-col sm:items-end">
            <button
              onClick={() => void toggleJoin(ride)}
              className={`min-h-11 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider ${ride.joined ? "border border-white/15 text-[#d4c6bf]" : "bg-gradient-red text-primary-foreground"}`}
            >
              {ride.joined ? "Se désinscrire" : "Participer"}
            </button>
            {ride.organizer_id === myId ? (
              <button
                onClick={() => void cancelRide(ride)}
                className="min-h-11 px-3 text-xs text-[#a99b95] hover:text-[#e8be6c]"
              >
                Annuler
              </button>
            ) : (
              <button
                onClick={() => void toggleFollow(ride.organizer_id)}
                className="min-h-11 whitespace-nowrap px-3 text-xs text-[#d4c6bf] hover:text-[#e8be6c]"
              >
                {followedOrganizerIds.has(ride.organizer_id)
                  ? "Ne plus suivre"
                  : "Suivre cet organisateur"}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-16 md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">
              Motards de Cœur
            </span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl">Balades</h1>
          </div>
          <button
            onClick={() => setShowForm((value) => !value)}
            className="flex items-center gap-2 rounded-full bg-gradient-red px-5 py-2.5 text-sm font-medium uppercase tracking-wider text-primary-foreground"
          >
            <CalendarPlus className="h-4 w-4" /> Organiser
          </button>
        </div>
        <div
          className="mb-6 inline-flex rounded-full border border-[#d6a85c]/25 bg-[#281e1f] p-1"
          aria-label="Choisir la présentation des balades"
        >
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={`flex min-h-10 items-center gap-2 rounded-full px-4 text-sm transition-colors ${view === "list" ? "bg-[#d6a85c] text-[#281e1f]" : "text-[#d4c6bf] hover:text-white"}`}
          >
            <List className="size-4" /> Liste
          </button>
          <button
            type="button"
            aria-pressed={view === "calendar"}
            onClick={() => setView("calendar")}
            className={`flex min-h-10 items-center gap-2 rounded-full px-4 text-sm transition-colors ${view === "calendar" ? "bg-[#d6a85c] text-[#281e1f]" : "text-[#d4c6bf] hover:text-white"}`}
          >
            <CalendarDays className="size-4" /> Calendrier
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
            <div className="rounded-xl border border-white/10 bg-[#281e1f] p-4 text-sm text-[#d4c6bf]">
              <button
                type="button"
                onClick={captureRideLocation}
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <MapPin className="h-4 w-4" />
                {locationStatus === "captured"
                  ? "Position du rendez-vous enregistrée ✓"
                  : locationStatus === "requesting"
                    ? "Localisation en cours…"
                    : "Activer la position du point de rendez-vous (recommandé)"}
              </button>
              <p className="mt-2 text-xs leading-relaxed text-[#a99b95]">
                Cette position permet de prévenir les motards proches. Elle reste optionnelle.
              </p>
              {locationStatus === "error" && (
                <p className="mt-2 text-xs text-primary">
                  Localisation refusée ou indisponible — tu peux créer la balade sans position.
                </p>
              )}
            </div>
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
        {view === "list" ? (
          <ul className="space-y-3">
            {(rides ?? []).map((ride) => (
              <li key={ride.id}>
                <RideCard ride={ride} />
              </li>
            ))}
          </ul>
        ) : rides && rides.length > 0 ? (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-2 sm:p-5">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ hasEvents: rides.map((ride) => new Date(ride.starts_at)) }}
                className="mx-auto w-full bg-transparent [--cell-size:2.6rem] sm:[--cell-size:3.25rem]"
                classNames={{ root: "w-full", month: "w-full" }}
                aria-label="Calendrier des balades"
              />
              <p className="mt-3 text-center text-xs text-[#a99b95]">
                Un point doré indique qu’au moins une balade est prévue.
              </p>
            </div>
            {selectedDate ? (
              <div>
                <h2 className="mb-3 font-display text-xl text-[#e8be6c]">
                  Balades du {selectedDate.toLocaleDateString("fr-FR", { dateStyle: "long" })}
                </h2>
                {ridesForSelectedDate.length > 0 ? (
                  <ul className="space-y-3">
                    {ridesForSelectedDate.map((ride) => (
                      <li key={ride.id}>
                        <RideCard ride={ride} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-[#302425]/60 p-5 text-sm text-[#d4c6bf]">
                    Aucune balade prévue ce jour-là.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center text-sm text-[#d4c6bf]">
                Sélectionne un jour pour afficher les balades correspondantes.
              </p>
            )}
          </div>
        ) : null}
      </section>
    </Layout>
  );
}

function isSameLocalDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}
