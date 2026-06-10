import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Check, X, Crown, Zap, Star } from "lucide-react";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Premium — Motard de Cœur" },
      { name: "description", content: "Membership premium : messages illimités, boost, badge vérifié, événements VIP." },
      { property: "og:title", content: "Premium — Motard de Cœur" },
      { property: "og:description", content: "Comparez les formules Free, Premium et VIP Club : messages illimités, boost de profil, badge vérifié et accès aux événements VIP de la communauté biker." },
      { property: "og:url", content: "/premium" },
    ],
    links: [{ rel: "canonical", href: "/premium" }],
  }),
  component: Premium,
});

const PLANS = [
  {
    name: "Free",
    price: "0",
    desc: "Découvrez la communauté",
    features: [
      { ok: true, text: "Profil de base" },
      { ok: true, text: "10 likes par jour" },
      { ok: true, text: "Voir les événements publics" },
      { ok: false, text: "Messages illimités" },
      { ok: false, text: "Badge vérifié" },
      { ok: false, text: "Filtres avancés" },
      { ok: false, text: "Boost de profil" },
      { ok: false, text: "Événements VIP" },
    ],
  },
  {
    name: "Premium",
    price: "14,90",
    desc: "L'expérience complète",
    features: [
      { ok: true, text: "Profil de base" },
      { ok: true, text: "Likes illimités" },
      { ok: true, text: "Voir tous les événements" },
      { ok: true, text: "Messages illimités" },
      { ok: true, text: "Badge vérifié" },
      { ok: true, text: "Filtres avancés (moto, km, style)" },
      { ok: true, text: "1 boost par semaine" },
      { ok: false, text: "Événements VIP exclusifs" },
    ],
    popular: true,
  },
  {
    name: "VIP Club",
    price: "29,90",
    desc: "Le club privilégié",
    features: [
      { ok: true, text: "Tout Premium inclus" },
      { ok: true, text: "Badge VIP doré" },
      { ok: true, text: "Boost illimité" },
      { ok: true, text: "Accès soirées VIP" },
      { ok: true, text: "Road trips exclusifs" },
      { ok: true, text: "Concierge dédié" },
      { ok: true, text: "Visibilité prioritaire" },
      { ok: true, text: "Cadeau bienvenue" },
    ],
  },
];

function Premium() {
  return (
    <Layout>
      <section className="py-20 px-6 text-center border-b border-border/40">
        <div className="mx-auto max-w-3xl animate-fade-up">
          <span className="inline-flex items-center gap-2 glass-red px-4 py-2 rounded-full text-xs uppercase tracking-widest mb-6">
            <Crown className="h-3 w-3" /> Membership exclusif
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">Choisissez votre <span className="text-gradient-red italic">privilège</span></h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Trois formules pensées pour chaque type de motard. Sans engagement, annulable à tout moment.
          </p>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-3 gap-8">
          {PLANS.map((p, i) => (
            <div
              key={i}
              className={`relative rounded-3xl p-10 ${p.popular ? "glass-red ring-red-glow" : "glass"} hover-lift`}
            >
              {p.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-red text-primary-foreground px-4 py-1.5 rounded-full text-xs uppercase tracking-widest shadow-glow flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" /> Le plus choisi
                </span>
              )}

              <h2 className="font-display text-3xl mb-2">{p.name}</h2>
              <p className="text-muted-foreground text-sm mb-6">{p.desc}</p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-display text-6xl">{p.price}</span>
                <span className="text-muted-foreground">€/mois</span>
              </div>

              <ul className="space-y-3 mb-10">
                {p.features.map((f, j) => (
                  <li key={j} className={`flex items-center gap-3 text-sm ${f.ok ? "text-foreground" : "text-muted-foreground/60 line-through"}`}>
                    <span className={`grid place-items-center w-5 h-5 rounded-full shrink-0 ${f.ok ? "bg-gradient-red" : "bg-muted"}`}>
                      {f.ok ? <Check className="h-3 w-3 text-primary-foreground" /> : <X className="h-3 w-3" />}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              <Link
                to="/join"
                className={`block w-full py-4 rounded-full text-center uppercase tracking-wider text-sm font-medium transition ${p.popular ? "bg-gradient-red text-primary-foreground shadow-glow hover:scale-[1.02]" : "bg-foreground/10 hover:bg-foreground/20"}`}
              >
                Pré-inscription
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Paiement et abonnements bientôt connectés.
        </div>
      </section>
    </Layout>
  );
}
