import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { requireAppAccess } from "@/lib/require-admin";
import { MapPin, Users, ArrowRight } from "lucide-react";
import evCoast from "@/assets/event-coast.jpg";
import evFestival from "@/assets/event-festival.jpg";
import evCharity from "@/assets/event-charity.jpg";
import evExpo from "@/assets/event-expo.jpg";
import evAlps from "@/assets/event-alps.jpg";
import evHarbour from "@/assets/event-harbour.jpg";

import { SITE_URL } from "@/lib/site";

const EVENTS = [
  { date: "À VENIR", title: "Balade coucher de soleil — Côte d'Azur", loc: "Nice — Monaco", type: "Balade", spots: "places à définir", img: evCoast, featured: true },
  { date: "À VENIR", title: "Festival Iron & Soul", loc: "Lyon — à venir", type: "Festival", spots: "format à préciser", img: evFestival },
  { date: "À VENIR", title: "Balade solidaire des motards", loc: "Paris — à venir", type: "Solidaire", spots: "à organiser", img: evCharity },
  { date: "À VENIR", title: "Expo moto custom", loc: "Bordeaux — à venir", type: "Rencontre", spots: "à organiser", img: evExpo },
  { date: "À VENIR", title: "Balade des lacets alpins", loc: "Annecy — Chamonix", type: "Balade", spots: "à définir", img: evAlps },
  { date: "À VENIR", title: "Balade nocturne à Marseille", loc: "Vieux-Port — à venir", type: "Rencontre", spots: "à organiser", img: evHarbour },
];

export const Route = createFileRoute("/events")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Événements — Motards de Cœur" },
      { name: "description", content: "Pistes d'événements Motards de Cœur : balades, festivals, rassemblements et balades solidaires à confirmer." },
      { property: "og:title", content: "Événements — Motards de Cœur" },
      { property: "og:description", content: "Découvrez les idées d'événements envisagées pour la future communauté Motards de Cœur." },
      { property: "og:url", content: `${SITE_URL}/events` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/events` }],
  }),
  beforeLoad: requireAppAccess,
  component: Events,
});

function Events() {
  return (
    <Layout>
      <section className="px-4 py-10 sm:px-6 sm:py-16 border-b border-border/40">
        <div className="mx-auto max-w-7xl animate-fade-up">
          <span className="text-primary uppercase tracking-[0.4em] text-xs">Agenda à construire</span>
          <h1 className="font-display text-3xl sm:text-5xl md:text-7xl mt-4 mb-4">L'asphalte <span className="text-gradient-red italic">vous appelle.</span></h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Balades, festivals et balades solidaires font partie des idées de lancement.
            Aucun événement n'est encore confirmé, réservable ou ouvert aux inscriptions.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="relative min-h-[30rem] sm:min-h-[34rem] rounded-3xl overflow-hidden shadow-elegant md:aspect-[21/9] md:min-h-0">
            <img src={EVENTS[0].img} alt={EVENTS[0].title} className="absolute inset-0 w-full h-full object-cover" width={1920} height={822} />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
            <div className="absolute inset-0 p-5 sm:p-8 md:p-16 flex flex-col justify-center max-w-2xl">
              <span className="self-start glass-red px-4 py-1.5 rounded-full text-xs uppercase tracking-widest mb-4">Piste d'événement</span>
              <div className="text-primary uppercase tracking-[0.3em] text-xs mb-3">{EVENTS[0].date}</div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-6xl mb-4">{EVENTS[0].title}</h2>
              <p className="text-foreground/80 mb-6 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{EVENTS[0].loc}</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{EVENTS[0].spots}</span>
              </p>
              <Link to="/join" className="self-start inline-flex items-center gap-2 px-7 py-3 bg-gradient-red rounded-full uppercase tracking-wider text-sm font-medium shadow-glow transition hover:scale-105">
                Être prévenu du lancement <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-16">
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
                <div className="flex flex-col items-start gap-2 text-xs sm:flex-row sm:items-center sm:justify-between text-muted-foreground mb-5">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.loc}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.spots}</span>
                </div>
                <button type="button" disabled className="w-full cursor-not-allowed py-3 rounded-full bg-foreground/5 text-sm uppercase tracking-wider text-muted-foreground opacity-75 transition">
                  Réservation non ouverte
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
