import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { MessageCircle, Users, MapPin, Flame, Heart, Share2 } from "lucide-react";
import community from "@/assets/community-ride.jpg";
import w1 from "@/assets/profile-woman.jpg";
import m1 from "@/assets/profile-man.jpg";
import w2 from "@/assets/profile-woman2.jpg";
import m2 from "@/assets/profile-man2.jpg";
import bike from "@/assets/bike-dark.jpg";

const SITE_URL = "https://motarddecoeur.lovable.app";

export const Route = createFileRoute("/community")({
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
  component: Community,
});

const GROUPS = [
  { name: "Routières & Harley", img: bike, tag: "Route" },
  { name: "Sportives & sensations", img: community, tag: "Sport" },
  { name: "Préparations & café racers", img: bike, tag: "Prépa" },
  { name: "Grand tourisme & longs trajets", img: community, tag: "Voyage" },
];

const POSTS = [
  { user: "Sorties locales", img: w1, time: "à venir", text: "Un espace pour proposer une balade, trouver un itinéraire et rouler avec des personnes qui partagent le même rythme.", photo: community },
  { user: "Conseils motards", img: m1, time: "à venir", text: "Une rubrique pour échanger sur l'équipement, la sécurité, les itinéraires et les premières sorties." },
  { user: "Projets custom", img: w2, time: "à venir", text: "Un futur fil pour partager ses projets, ses envies de moto et ses inspirations de route.", photo: bike },
  { user: "Rencontres respectueuses", img: m2, time: "à venir", text: "Une communauté pensée pour prendre le temps d'échanger avant de se retrouver sur la route." },
];

function Community() {
  return (
    <Layout>
      <section className="py-16 px-6 border-b border-border/40">
        <div className="mx-auto max-w-7xl">
          <span className="text-primary uppercase tracking-[0.4em] text-xs">Communauté en préparation</span>
          <h1 className="font-display text-5xl md:text-7xl mt-4 mb-4">La <span className="text-gradient-red italic">communauté</span> avant tout.</h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Groupes, discussions et projets de balades sont prévus pour une prochaine phase du projet.
            Aucun fil social, forum ou compte membre n'est ouvert pour l'instant.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
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

      <section className="py-16 px-6">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-display text-3xl flex items-center gap-3"><MessageCircle className="text-primary" /> Exemples de futurs espaces</h2>

            {POSTS.map((p, i) => (
              <article key={i} className="glass rounded-2xl p-6 hover-lift">
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
                <div className="flex items-center gap-6 text-sm text-muted-foreground border-t border-border/40 pt-4">
                  <button type="button" disabled className="flex cursor-not-allowed items-center gap-2 opacity-75"><Heart className="h-4 w-4" /> À venir</button>
                  <button type="button" disabled className="flex cursor-not-allowed items-center gap-2 opacity-75"><MessageCircle className="h-4 w-4" /> À venir</button>
                  <button type="button" disabled className="flex cursor-not-allowed items-center gap-2 opacity-75 ml-auto"><Share2 className="h-4 w-4" /> À venir</button>
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
            <div className="glass rounded-2xl p-6">
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
              <img src={community} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
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
