import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { MapPin, Users, ArrowRight } from "lucide-react";
import hero from "@/assets/hero-sunset.jpg";
import event from "@/assets/event-night.jpg";
import community from "@/assets/community-ride.jpg";
import bike from "@/assets/bike-dark.jpg";

const EVENTS = [
  { date: "12 JUIN 2026", iso: "2026-06-12T18:00:00+02:00", title: "Sunset Ride — Côte d'Azur", loc: "Nice → Monaco", city: "Nice", type: "Road trip", spots: 48, img: hero, featured: true },
  { date: "28 JUIN 2026", iso: "2026-06-28T10:00:00+02:00", title: "Festival Iron & Soul", loc: "Lyon · 3 jours", city: "Lyon", type: "Festival", spots: 240, img: event },
  { date: "15 JUIL 2026", iso: "2026-07-15T09:00:00+02:00", title: "Charity Ride for Heroes", loc: "Paris", city: "Paris", type: "Charity", spots: 120, img: community },
  { date: "03 AOÛT 2026", iso: "2026-08-03T11:00:00+02:00", title: "Custom Bike Show", loc: "Bordeaux", city: "Bordeaux", type: "Meetup", spots: 80, img: bike },
  { date: "20 AOÛT 2026", iso: "2026-08-20T08:00:00+02:00", title: "Alpine Twisties Tour", loc: "Annecy → Chamonix", city: "Annecy", type: "Road trip", spots: 36, img: hero },
  { date: "10 SEPT 2026", iso: "2026-09-10T20:00:00+02:00", title: "Night Rumble Marseille", loc: "Vieux-Port", city: "Marseille", type: "Meetup", spots: 60, img: event },
];

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Événements — Motard de Cœur" },
      { name: "description", content: "Road trips, festivals, rassemblements et charity rides partout en Europe." },
      { property: "og:title", content: "Événements — Motard de Cœur" },
      { property: "og:description", content: "Tous les rendez-vous bikers à ne pas manquer." },
      { property: "og:url", content: "/events" },
    ],
    links: [{ rel: "canonical", href: "/events" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": EVENTS.map((e) => ({
            "@type": "Event",
            name: e.title,
            startDate: e.iso,
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
            location: {
              "@type": "Place",
              name: e.loc,
              address: { "@type": "PostalAddress", addressLocality: e.city, addressCountry: "FR" },
            },
            organizer: { "@type": "Organization", name: "Motard de Cœur", url: "https://coeur-road-connect.lovable.app" },
          })),
        }),
      },
    ],
  }),
  component: Events,
});

function Events() {
  return (
    <Layout>
      <section className="py-16 px-6 border-b border-border/40">
        <div className="mx-auto max-w-7xl animate-fade-up">
          <span className="text-primary uppercase tracking-[0.4em] text-xs">Agenda 2026</span>
          <h1 className="font-display text-5xl md:text-7xl mt-4 mb-4">L'asphalte <span className="text-gradient-red italic">vous appelle.</span></h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Road trips épiques, festivals légendaires, rides solidaires.
            Partagez la route avec votre tribu.
          </p>
        </div>
      </section>

      {/* Featured */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="relative min-h-[34rem] rounded-3xl overflow-hidden shadow-elegant md:aspect-[21/9] md:min-h-0">
            <img src={EVENTS[0].img} alt={EVENTS[0].title} className="absolute inset-0 w-full h-full object-cover" width={1920} height={822} />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
            <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-center max-w-2xl">
              <span className="self-start glass-red px-4 py-1.5 rounded-full text-xs uppercase tracking-widest mb-4">Vedette</span>
              <div className="text-primary uppercase tracking-[0.3em] text-xs mb-3">{EVENTS[0].date}</div>
              <h2 className="font-display text-4xl md:text-6xl mb-4">{EVENTS[0].title}</h2>
              <p className="text-foreground/80 mb-6 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{EVENTS[0].loc}</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{EVENTS[0].spots} places</span>
              </p>
              <button type="button" disabled className="self-start inline-flex cursor-not-allowed items-center gap-2 px-7 py-3 bg-gradient-red rounded-full uppercase tracking-wider text-sm font-medium opacity-75 shadow-glow transition">
                Réservation bientôt disponible <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-7xl grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EVENTS.slice(1).map((e, i) => (
            <article key={i} className="group glass rounded-2xl overflow-hidden hover-lift">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={e.img} alt={e.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                <span className="absolute top-4 left-4 glass-red px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">{e.type}</span>
                <div className="absolute bottom-4 left-4 text-primary text-xs uppercase tracking-[0.3em]">{e.date}</div>
              </div>
              <div className="p-6">
                <h3 className="text-xl mb-3 font-display">{e.title}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-5">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.loc}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.spots}</span>
                </div>
                <button type="button" disabled className="w-full cursor-not-allowed py-3 rounded-full bg-foreground/5 text-sm uppercase tracking-wider text-muted-foreground opacity-75 transition">
                  Inscription bientôt disponible
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
