import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { requireAdmin } from "@/lib/require-admin";
import { Heart, MessageCircle, MapPin, Search, SlidersHorizontal } from "lucide-react";
import w1 from "@/assets/profile-woman.jpg";
import w2 from "@/assets/profile-woman2.jpg";
import m1 from "@/assets/profile-man.jpg";
import m2 from "@/assets/profile-man2.jpg";
import lea from "@/assets/profile-lea.jpg";
import julien from "@/assets/profile-julien.jpg";

const SITE_URL = "https://motarddecoeur.lovable.app";

export const Route = createFileRoute("/profiles")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Membres — Motards de Cœur" },
      { name: "description", content: "Aperçu de la future expérience membres Motards de Cœur avant le lancement des profils réels." },
      { property: "og:title", content: "Membres — Motards de Cœur" },
      { property: "og:description", content: "Découvrez la vision des futurs profils motards et pré-inscrivez-vous au lancement." },
      { property: "og:url", content: `${SITE_URL}/profiles` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/profiles` }],
  }),
  beforeLoad: requireAdmin,
  component: Profiles,
});

type Profile = {
  name: string; age: number; bike: string; city: string; style: string;
  tags: string[]; match: number; img: string;
};

const PROFILES: Profile[] = [
  { name: "Sophie", age: 29, bike: "Harley Sportster", city: "Lyon", style: "Grand tourisme", tags: ["Liberté", "Voyage", "Café racer"], match: 96, img: w1 },
  { name: "Marc", age: 34, bike: "Ducati Monster", city: "Marseille", style: "Sport", tags: ["Adrénaline", "Circuit", "Bricoleur"], match: 92, img: m1 },
  { name: "Camille", age: 27, bike: "Triumph Bonneville", city: "Bordeaux", style: "Vintage", tags: ["Café racer", "Photo", "Évasion"], match: 89, img: w2 },
  { name: "Antoine", age: 52, bike: "Harley Road King", city: "Paris", style: "Route", tags: ["Fraternité", "Voyage moto", "Blues"], match: 87, img: m2 },
  { name: "Léa", age: 31, bike: "BMW R nineT", city: "Strasbourg", style: "Préparation", tags: ["Design", "Voyage", "Yoga"], match: 84, img: lea },
  { name: "Julien", age: 38, bike: "KTM 1290 SuperDuke", city: "Toulouse", style: "Roadster sportif", tags: ["Montagne", "En solo", "Café"], match: 81, img: julien },
];

function Profiles() {
  return (
    <Layout>
      <section className="py-16 px-6 border-b border-border/40">
        <div className="mx-auto max-w-7xl">
          <span className="text-primary uppercase tracking-[0.4em] text-xs">Aperçu de maquette</span>
          <h1 className="font-display text-5xl md:text-7xl mt-4 mb-4">Imaginez votre <span className="text-gradient-red italic">complice de route</span></h1>
          <p className="text-muted-foreground max-w-2xl">
            Ces cartes sont des exemples fictifs destinés à présenter l'ambiance du futur service.
            Aucun profil membre réel, coup de cœur ou message privé n'est encore disponible.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 items-center">
            <label htmlFor="profile-search" className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md glass px-4 py-3 rounded-full opacity-75">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Rechercher un motard</span>
              <input id="profile-search" type="search" aria-label="Recherche bientôt disponible" placeholder="Recherche bientôt disponible" disabled className="bg-transparent flex-1 cursor-not-allowed outline-none text-sm text-muted-foreground" />
            </label>
            {["Tous", "Harley", "Sport", "Grand tourisme", "Préparation", "Vintage"].map((f, i) => (
              <button key={i} type="button" disabled className="cursor-not-allowed px-4 py-2 glass rounded-full text-sm text-muted-foreground opacity-75 transition">
                {f}
              </button>
            ))}
            <button type="button" disabled className="ml-auto inline-flex cursor-not-allowed items-center gap-2 px-4 py-2 glass-red rounded-full text-sm opacity-75">
              <SlidersHorizontal className="h-4 w-4" /> Filtres bientôt disponibles
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="mx-auto max-w-7xl grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROFILES.map((p, i) => (
            <article key={i} className="group relative rounded-2xl overflow-hidden glass hover-lift">
              <div className="relative aspect-[3/4] overflow-hidden">
                <img src={p.img} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-overlay" />

                <div className="absolute top-4 right-4 glass-red px-3 py-1.5 rounded-full text-xs font-medium">
                  Exemple fictif
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-display">{p.name}, <span className="text-foreground/70">{p.age}</span></h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-foreground/80 mb-3">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}</span>
                    <span>·</span>
                    <span>{p.style}</span>
                  </div>
                  <p className="text-sm text-foreground/90 italic mb-3">{p.bike}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-foreground/10 backdrop-blur">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex border-t border-border/40">
                <button
                  type="button"
                  disabled
                  className="flex-1 cursor-not-allowed py-4 flex items-center justify-center gap-2 text-sm uppercase tracking-wider text-muted-foreground opacity-75 transition"
                >
                  <Heart className="h-4 w-4" /> Coup de cœur à venir
                </button>
                <div className="w-px bg-border" />
                <button type="button" disabled className="flex-1 cursor-not-allowed py-4 flex items-center justify-center gap-2 text-sm uppercase tracking-wider text-muted-foreground opacity-75 transition">
                  <MessageCircle className="h-4 w-4" /> Message à venir
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link to="/join" className="inline-flex px-8 py-4 glass rounded-full uppercase tracking-wider text-sm hover:bg-primary/20 transition">
            Me préinscrire au lancement
          </Link>
        </div>
      </section>
    </Layout>
  );
}
