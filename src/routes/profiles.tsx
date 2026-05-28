import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Heart, MessageCircle, MapPin, Search, SlidersHorizontal, BadgeCheck } from "lucide-react";
import { useState } from "react";
import w1 from "@/assets/profile-woman.jpg";
import w2 from "@/assets/profile-woman2.jpg";
import m1 from "@/assets/profile-man.jpg";
import m2 from "@/assets/profile-man2.jpg";

export const Route = createFileRoute("/profiles")({
  head: () => ({
    meta: [
      { title: "Membres — Motard de Cœur" },
      { name: "description", content: "Découvrez les motards de la communauté. Profils vérifiés, matching authentique." },
      { property: "og:title", content: "Membres — Motard de Cœur" },
      { property: "og:description", content: "Rencontrez des passionnés de moto près de chez vous." },
      { property: "og:url", content: "/profiles" },
    ],
    links: [{ rel: "canonical", href: "/profiles" }],
  }),
  component: Profiles,
});

type Profile = {
  name: string; age: number; bike: string; city: string; style: string;
  tags: string[]; match: number; img: string; verified?: boolean;
};

const PROFILES: Profile[] = [
  { name: "Sophie", age: 29, bike: "Harley Sportster", city: "Lyon", style: "Touring", tags: ["Liberté", "Voyage", "Café racer"], match: 96, img: w1, verified: true },
  { name: "Marc", age: 34, bike: "Ducati Monster", city: "Marseille", style: "Sport", tags: ["Adrénaline", "Trackday", "Bricoleur"], match: 92, img: m1, verified: true },
  { name: "Camille", age: 27, bike: "Triumph Bonneville", city: "Bordeaux", style: "Vintage", tags: ["Café racer", "Photo", "Évasion"], match: 89, img: w2 },
  { name: "Antoine", age: 52, bike: "Harley Road King", city: "Paris", style: "Cruiser", tags: ["Brotherhood", "Road trip", "Blues"], match: 87, img: m2, verified: true },
  { name: "Léa", age: 31, bike: "BMW R nineT", city: "Strasbourg", style: "Custom", tags: ["Design", "Voyage", "Yoga"], match: 84, img: w1 },
  { name: "Julien", age: 38, bike: "KTM 1290 SuperDuke", city: "Toulouse", style: "Hyper-naked", tags: ["Mountain", "Solo", "Café"], match: 81, img: m1 },
];

function Profiles() {
  const [liked, setLiked] = useState<Set<number>>(new Set());

  return (
    <Layout>
      <section className="py-16 px-6 border-b border-border/40">
        <div className="mx-auto max-w-7xl">
          <span className="text-primary uppercase tracking-[0.4em] text-xs">Communauté</span>
          <h1 className="font-display text-5xl md:text-7xl mt-4 mb-4">Trouvez votre <span className="text-gradient-red italic">complice de route</span></h1>
          <p className="text-muted-foreground max-w-2xl">48 000+ motards vérifiés. Filtrez par moto, style, ville.</p>

          {/* Filters */}
          <div className="mt-10 flex flex-wrap gap-3 items-center">
            <label htmlFor="profile-search" className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md glass px-4 py-3 rounded-full">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Rechercher un motard</span>
              <input id="profile-search" type="search" aria-label="Rechercher par nom, moto ou ville" placeholder="Recherche par nom, moto, ville..." className="bg-transparent flex-1 outline-none text-sm" />
            </label>
            {["Tous", "Harley", "Sport", "Touring", "Custom", "Vintage"].map((f, i) => (
              <button key={i} className="px-4 py-2 glass rounded-full text-sm hover:bg-primary/20 hover:border-primary/40 transition">
                {f}
              </button>
            ))}
            <button className="ml-auto inline-flex items-center gap-2 px-4 py-2 glass-red rounded-full text-sm">
              <SlidersHorizontal className="h-4 w-4" /> Filtres avancés
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

                {/* Match badge */}
                <div className="absolute top-4 right-4 glass-red px-3 py-1.5 rounded-full text-xs font-medium">
                  {p.match}% match
                </div>

                {/* Bottom content */}
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-display">{p.name}, <span className="text-foreground/70">{p.age}</span></h2>
                    {p.verified && <BadgeCheck className="h-5 w-5 text-primary fill-primary/20" />}
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
                  onClick={() => {
                    const n = new Set(liked);
                    n.has(i) ? n.delete(i) : n.add(i);
                    setLiked(n);
                  }}
                  className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition ${liked.has(i) ? "bg-gradient-red text-primary-foreground" : "hover:bg-primary/10"}`}
                >
                  <Heart className={`h-4 w-4 ${liked.has(i) ? "fill-current" : ""}`} /> Like
                </button>
                <div className="w-px bg-border" />
                <button className="flex-1 py-4 flex items-center justify-center gap-2 text-sm uppercase tracking-wider hover:bg-foreground/5 transition">
                  <MessageCircle className="h-4 w-4" /> Message
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-16">
          <button className="px-8 py-4 glass rounded-full uppercase tracking-wider text-sm hover:bg-primary/20 transition">
            Charger plus de motards
          </button>
        </div>
      </section>
    </Layout>
  );
}
