import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { TrophyIcon } from "@/components/icons/TrophyIcon";
import { requireAppAccess } from "@/lib/require-admin";
import { Check, X, Crown, Zap, Star } from "lucide-react";

import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/premium")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Premium — Motards de Cœur" },
      { name: "description", content: "Aperçu des futures pistes premium Motards de Cœur, non disponibles au lancement de la pré-inscription." },
      { property: "og:title", content: "Premium — Motards de Cœur" },
      { property: "og:description", content: "Découvrez la vision des futures offres premium Motards de Cœur avant l'ouverture commerciale." },
      { property: "og:url", content: `${SITE_URL}/premium` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/premium` }],
  }),
  beforeLoad: requireAppAccess,
  component: Premium,
});

const PLANS = [
  {
    name: "Découverte",
    tier: "bronze",
    price: "À définir",
    desc: "Première expérience communautaire",
    features: [
      { ok: true, text: "Pré-inscription" },
      { ok: true, text: "Accès aux nouvelles du lancement" },
      { ok: true, text: "Découverte des événements publics" },
      { ok: false, text: "Messages illimités" },
      { ok: false, text: "Badge vérifié" },
      { ok: false, text: "Filtres avancés" },
      { ok: false, text: "Boost de profil" },
      { ok: false, text: "Événements VIP" },
    ],
  },
  {
    name: "Club",
    tier: "silver",
    price: "Non actif",
    desc: "Un premier niveau de fonctionnalités avancées",
    features: [
      { ok: true, text: "Profils plus complets" },
      { ok: true, text: "Affinités motardes" },
      { ok: true, text: "Événements à découvrir" },
      { ok: true, text: "Messagerie envisagée" },
      { ok: true, text: "Badge vérifié prévu" },
      { ok: true, text: "Filtres avancés envisagés" },
      { ok: false, text: "Avantages communautaires" },
      { ok: false, text: "Paiement non connecté" },
    ],
  },
  {
    name: "Premium",
    tier: "gold",
    price: "Plus tard",
    desc: "L'expérience complète, tout inclus",
    features: [
      { ok: true, text: "Profils plus complets" },
      { ok: true, text: "Filtres avancés illimités" },
      { ok: true, text: "Badge vérifié" },
      { ok: true, text: "Messagerie illimitée" },
      { ok: true, text: "Avantages communautaires" },
      { ok: true, text: "Road trips inclus" },
      { ok: true, text: "Accès prioritaire" },
      { ok: true, text: "Boost de profil" },
    ],
    popular: true,
  },
];

function Premium() {
  return (
    <Layout>
      <section className="px-4 py-12 sm:px-6 sm:py-20 text-center border-b border-border/40">
        <div className="mx-auto max-w-3xl animate-fade-up">
          <span className="inline-flex items-center gap-2 glass-red px-4 py-2 rounded-full text-xs uppercase tracking-widest mb-6">
            <Crown className="h-3 w-3" /> Vision premium
          </span>
          <h1 className="font-display text-3xl sm:text-5xl md:text-7xl mb-6">Une expérience <span className="text-gradient-red italic">à construire</span></h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Les offres premium ne sont pas encore ouvertes. Aucun abonnement, paiement ou avantage commercial n'est actif pendant cette phase de pré-lancement.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-3 gap-8">
          {PLANS.map((p, i) => (
            <div
              key={i}
              className={`relative rounded-3xl p-6 sm:p-10 ${p.popular ? "glass-red ring-red-glow" : "glass"} hover-lift`}
            >
              {p.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-red text-primary-foreground px-4 py-1.5 rounded-full text-xs uppercase tracking-widest shadow-glow flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" /> Piste prioritaire
                </span>
              )}

              <TrophyIcon tier={p.tier} className="h-10 w-10 mb-2" />
              <h2 className="font-display text-3xl mb-2">{p.name}</h2>
              <p className="text-muted-foreground text-sm mb-6">{p.desc}</p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-display text-5xl">{p.price}</span>
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
                Me préinscrire
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Aucun paiement, abonnement ou espace premium n'est connecté pour l'instant.
        </div>
      </section>
    </Layout>
  );
}
