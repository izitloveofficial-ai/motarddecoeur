import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Heart, MessageCircle, Users, Calendar, Shield, Sparkles, ArrowRight, Star, MapPin, Zap } from "lucide-react";
import heroImg from "@/assets/hero-sunset.jpg";
import bikeImg from "@/assets/bike-dark.jpg";
import communityImg from "@/assets/community-ride.jpg";
import eventImg from "@/assets/event-night.jpg";
import teamA from "@/assets/avatar-team-1.jpg";
import teamB from "@/assets/avatar-team-2.jpg";
import teamC from "@/assets/avatar-team-3.jpg";
import solidaireImg from "@/assets/home-solidaire.jpg";
import ctaRoad from "@/assets/cta-road.jpg";

const SITE_URL = "https://motarddecoeur.lovable.app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Motards de Cœur — La route rapproche les cœurs" },
      { name: "description", content: "Pré-inscrivez-vous au lancement de Motards de Cœur, le projet de communauté pour motards, rencontres, balades et événements." },
      { property: "og:title", content: "Motards de Cœur — Ride. Connect. Feel." },
      { property: "og:description", content: "Projet de plateforme de rencontres et de communauté pour passionnés de moto." },
      { property: "og:url", content: SITE_URL },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  component: Home,
});

function Home() {
  return (
    <Layout>
      {/* HERO */}
      <section className="relative -mt-20 min-h-screen flex items-center overflow-hidden">
        <img
          src={heroImg}
          alt="Couple de motards au coucher du soleil"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          width={1920}
          height={1280}
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-overlay" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-32 w-full">
          <div className="max-w-3xl animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-red text-xs uppercase tracking-[0.3em] text-foreground mb-8">
              <Sparkles className="h-3 w-3" /> Projet de communauté motarde
            </span>
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-bold leading-[0.95] text-foreground mb-6">
              La route<br />
              rapproche<br />
              <span className="text-gradient-red italic">les cœurs.</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-xl mb-10 leading-relaxed">
              Motards de Cœur prépare un espace pour les passionnés de moto qui veulent
              partager plus qu'un trajet : des rencontres, des balades et une communauté
              construite autour de la route.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/join"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-red text-primary-foreground rounded-full uppercase tracking-wider text-sm font-medium shadow-glow hover:scale-105 transition-all"
              >
                Rejoindre la pré-inscription
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/profiles"
                className="inline-flex items-center gap-2 px-8 py-4 glass text-foreground rounded-full uppercase tracking-wider text-sm font-medium hover:bg-foreground/10 transition-all"
              >
                Découvrir la vision
              </Link>
            </div>

            <div className="flex items-center gap-8 mt-16 text-sm text-muted-foreground">
              <div>
                <div className="text-3xl font-display text-foreground">Bientôt</div>
                <div className="uppercase tracking-wider text-xs">Pré-inscriptions</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <div className="text-3xl font-display text-foreground">À venir</div>
                <div className="uppercase tracking-wider text-xs">Balades & événements</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <div className="text-3xl font-display text-foreground">En préparation</div>
                <div className="uppercase tracking-wider text-xs">Communauté</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground text-xs uppercase tracking-[0.4em] animate-pulse">
          Défiler
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-20 animate-fade-up">
            <span className="text-primary uppercase tracking-[0.4em] text-xs">Pourquoi nous</span>
            <h2 className="font-display text-5xl md:text-6xl mt-4 mb-6">
              Plus qu'une app, <span className="text-gradient-red italic">un mode de vie</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un projet pensé pour des motards qui veulent rouler, échanger et créer des liens plus vrais.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Heart, title: "Affinités motardes", desc: "Objectif : rapprocher les personnes par style de route, valeurs et envies de balade." },
              { icon: Users, title: "Communauté à construire", desc: "La première étape est la pré-inscription, avant l'ouverture progressive des fonctionnalités." },
              { icon: Calendar, title: "Événements envisagés", desc: "Balades, sorties locales et rendez-vous motards pourront être proposés après le lancement." },
              { icon: Shield, title: "Sécurité prévue", desc: "La vérification et la modération feront partie des priorités avant les profils publics." },
              { icon: MessageCircle, title: "Messagerie à venir", desc: "Les échanges privés seront étudiés dans une phase dédiée, après les comptes utilisateurs." },
              { icon: Zap, title: "Filtres envisagés", desc: "Ville, type de moto, style de balade et préférences pourront guider les futures rencontres." },
            ].map((f, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-2xl glass hover-lift"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="grid place-items-center w-14 h-14 rounded-xl bg-gradient-red shadow-glow mb-6 group-hover:scale-110 transition-transform">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CINEMATIC SPLIT */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <img
              src={bikeImg}
              alt="Moto custom"
              className="rounded-2xl shadow-elegant w-full"
              loading="lazy"
              width={1600}
              height={1000}
            />
            <div className="absolute -bottom-6 -right-6 glass-red p-6 rounded-2xl backdrop-blur-xl max-w-xs">
              <p className="text-sm italic text-foreground/90">
                "Créer un espace où la passion de la route devient le point de départ d'une vraie rencontre."
              </p>
              <p className="text-xs text-muted-foreground mt-2">— Vision Motards de Cœur</p>
            </div>
          </div>
          <div>
            <span className="text-primary uppercase tracking-[0.4em] text-xs">Notre vision</span>
            <h2 className="font-display text-5xl md:text-6xl mt-4 mb-8 leading-tight">
              Le bruit du moteur,<br /><span className="text-gradient-red italic">le battement d'un cœur.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Chaque rencontre commence par un regard, mais les plus belles
              histoires peuvent aussi démarrer autour d'une passion commune. Motards de Cœur
              veut faire de la route un terrain d'entente sincère.
            </p>
            <Link to="/about" className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all">
              Notre histoire <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-32 px-6 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <span className="text-primary uppercase tracking-[0.4em] text-xs">Inspiration</span>
            <h2 className="font-display text-5xl md:text-6xl mt-4">Ce que nous voulons créer</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Rencontres", role: "Affinités & route", img: w1, text: "Permettre à deux passionnés de se trouver autour d'un rythme, d'une région et d'une envie de rouler." },
              { name: "Balades", role: "Sorties locales", img: m1, text: "Aider les motards à ne plus rouler seuls quand ils ont envie de partager un itinéraire." },
              { name: "Communauté", role: "Respect & passion", img: w2, text: "Construire un espace accueillant, clair et sécurisé avant d'ouvrir les fonctionnalités sociales." },
            ].map((t, i) => (
              <div key={i} className="glass rounded-2xl p-8 hover-lift">
                <div className="flex items-center gap-4 mb-6">
                  <img src={t.img} alt={t.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/40" loading="lazy" width={56} height={56} />
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{t.role}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-4 text-primary">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-foreground/80 italic leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-primary uppercase tracking-[0.4em] text-xs">Agenda</span>
              <h2 className="font-display text-5xl md:text-6xl mt-4">Idées d'événements</h2>
            </div>
            <Link to="/events" className="inline-flex items-center gap-2 text-foreground hover:text-primary transition">
              Tout voir <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { date: "À VENIR", title: "Balade coucher de soleil — Côte d'Azur", loc: "Nice — Monaco", img: communityImg },
              { date: "À VENIR", title: "Festival Iron & Soul", loc: "Lyon — à venir", img: eventImg },
              { date: "À VENIR", title: "Balade solidaire des motards", loc: "Paris — à venir", img: bikeImg },
            ].map((e, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl aspect-[4/5] hover-lift">
                <img src={e.img} alt={e.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-overlay" />
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <span className="self-start glass-red px-3 py-1.5 rounded-full text-xs uppercase tracking-wider">{e.date}</span>
                  <div>
                    <h3 className="text-2xl mb-2">{e.title}</h3>
                    <p className="text-sm text-foreground/70 flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM CTA */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-5xl glass rounded-3xl overflow-hidden relative ring-red-glow">
          <img src={communityImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-background/40" />
          <div className="relative z-10 p-16 md:p-20">
            <span className="text-primary uppercase tracking-[0.4em] text-xs">Premium</span>
            <h2 className="font-display text-5xl md:text-6xl mt-4 mb-6 max-w-2xl">
              Une expérience <span className="text-gradient-red italic">à construire</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mb-8">
              Les fonctionnalités premium, les événements privilégiés et les options avancées seront étudiés après la validation du socle de pré-inscription.
            </p>
            <Link
              to="/premium"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-red text-primary-foreground rounded-full uppercase tracking-wider text-sm font-medium shadow-glow hover:scale-105 transition-all"
            >
              Découvrir la vision Premium <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
