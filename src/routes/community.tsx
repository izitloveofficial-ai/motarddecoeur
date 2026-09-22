import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { requireAppAccess } from "@/lib/require-admin";
import { MessageCircle, Users, MapPin, Flame, Heart, Share2 } from "lucide-react";
import c1 from "@/assets/avatar-c1.jpg";
import c2 from "@/assets/avatar-c2.jpg";
import c3 from "@/assets/avatar-c3.jpg";
import c4 from "@/assets/avatar-c4.jpg";
import gTouring from "@/assets/group-touring.jpg";
import gSport from "@/assets/group-sport.jpg";
import gWorkshop from "@/assets/group-workshop.jpg";
import gTravel from "@/assets/group-travel.jpg";
import postLocal from "@/assets/post-local.jpg";
import postCustom from "@/assets/post-custom.jpg";
import ctaCommunity from "@/assets/cta-community.jpg";

import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/community")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Communauté — Motards de Cœur" },
      { name: "description", content: "Vision de la future communauté Motards de Cœur : groupes, discussions, balades et expériences partagées." },
      { property: "og:title", content: "Communauté — Motards de Cœur" },
      { property: "og:description", content: "Découvrez la vision communautaire de Motards de Cœur avant le lancement complet du service." },
      { property: "og:url", content: `${SITE_URL}/community` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/community` }],
  }),
  beforeLoad: requireAppAccess,
  component: Community,
});

const GROUPS = [
  { name: "Routières & Harley", img: gTouring, tag: "Route" },
  { name: "Sportives & sensations", img: gSport, tag: "Sport" },
  { name: "Préparations & café racers", img: gWorkshop, tag: "Prépa" },
  { name: "Grand tourisme & longs trajets", img: gTravel, tag: "Voyage" },
];

const POSTS = [
  { user: "Sorties locales", img: c1, time: "à venir", text: "Un espace pour proposer une balade, trouver un itinéraire et rouler avec des personnes qui partagent le même rythme.", photo: postLocal },
  { user: "Conseils motards", img: c2, time: "à venir", text: "Une rubrique pour échanger sur l'équipement, la sécurité, les itinéraires et les premières sorties." },
  { user: "Projets custom", img: c3, time: "à venir", text: "Un futur fil pour partager ses projets, ses envies de moto et ses inspirations de route.", photo: postCustom },
  { user: "Rencontres respectueuses", img: c4, time: "à venir", text: "Une communauté pensée pour prendre le temps d'échanger avant de se retrouver sur la route." },
];

function Community() {
  return (
    <Layout>
      <section className="px-4 py-10 sm:px-6 sm:py-16 border-b border-border/40">
        <div className="mx-auto max-w-7xl">
          <span className="text-primary uppercase tracking-[0.4em] text-xs">Communauté en préparation</span>
          <h1 className="font-display text-3xl sm:text-5xl md:text-7xl mt-4 mb-4">La <span className="text-gradient-red italic">communauté</span> avant tout.</h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Groupes, discussions et projets de balades sont prévus pour une prochaine phase du projet.
            Aucun fil social, forum ou compte membre n'est ouvert pour l'instant.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-3xl mb-8 flex items-center gap-3"><Flame className="text-primary" /> Groupes envisagés</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {GROUPS.map((g, i) => (
              <article key={i} className="group relative aspect-[4/5] rounded-2xl overflow-hidden hover-lift">
                <img src={g.img} alt={g.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-overlay" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="glass-red px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">{g.tag}</span>
                  <h3 className="font-display text-2xl mt-3 mb-1">{g.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Espace à ouvrir</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-display text-3xl flex items-center gap-3"><MessageCircle className="text-primary" /> Exemples de futurs espaces</h2>

            {POSTS.map((p, i) => (
              <article key={i} className="glass rounded-2xl p-4 sm:p-6 hover-lift">
                <header className="flex items-center gap-3 mb-4">
                  <img src={p.img} alt={p.user} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30" loading="lazy" />
                  <div>
                    <div className="font-medium">{p.user}</div>
                    <div className="text-xs text-muted-foreground">{p.time}</div>
                  </div>
                </header>
                <p className="text-foreground/90 mb-4 leading-relaxed">{p.text}</p>
                {p.photo && (
                  <img src={p.photo} alt="" className="rounded-xl mb-4 w-full max-h-80 object-cover" loading="lazy" />
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground border-t border-border/40 pt-4">
                  <button type="button" disabled className="flex cursor-not-allowed items-center gap-2 opacity-75"><Heart className="h-4 w-4" /> À venir</button>
                  <button type="button" disabled className="flex cursor-not-allowed items-center gap-2 opacity-75"><MessageCircle className="h-4 w-4" /> À venir</button>
                  <button type="button" disabled className="flex cursor-not-allowed items-center gap-2 opacity-75 sm:ml-auto"><Share2 className="h-4 w-4" /> À venir</button>
                </div>
              </article>
            ))}

            <div className="text-center pt-4">
              <Link to="/join" className="inline-flex px-8 py-4 glass rounded-full uppercase tracking-wider text-sm hover:bg-primary/20 transition">
                Rejoindre la pré-inscription
              </Link>
            </div>
          </div>

          <aside className="space-y-8">
            <div className="glass rounded-2xl p-4 sm:p-6">
              <h3 className="font-display text-xl mb-4 flex items-center gap-2"><MapPin className="text-primary h-5 w-5" /> Organisation des balades</h3>
              <ul className="space-y-4">
                {[
                  { name: "Boucles régionales", date: "à proposer" },
                  { name: "Balades au coucher du soleil", date: "à organiser" },
                  { name: "Itinéraires week-end", date: "à construire" },
                ].map((r, i) => (
                  <li key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.date}</div>
                    </div>
                    <span className="text-primary text-xs">prévu</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
              <img src={ctaCommunity} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-overlay" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-xs uppercase tracking-widest text-primary mb-2">Esprit du projet</p>
                <p className="font-display text-2xl italic">"La route rapproche les cœurs quand elle reste sincère, libre et respectueuse."</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
