import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Heart, MapPin, ShieldCheck, Users } from "lucide-react";
import { HelmetCta } from "@/components/HelmetCta";
import { PrelaunchLayout } from "@/components/PrelaunchLayout";
import heroImg from "@/assets/hero-sunset.jpg";
import communityImg from "@/assets/community-ride.jpg";
import { SITE_URL } from "@/lib/site";

const TITLE = "Motards de Cœur — Rejoins les premiers motards, c'est gratuit";
const DESCRIPTION =
  "Rencontres entre motards, balades et communauté : pré-inscris-toi gratuitement et sois informé(e) en priorité à l'ouverture de Motards de Cœur.";

export const Route = createFileRoute("/lancement")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: `${SITE_URL}/lancement` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/lancement` }],
  }),
  component: Landing,
});

const BENEFITS = [
  {
    icon: Heart,
    title: "Des rencontres qui roulent dans le même sens",
    text: "Des profils de motards et de passionnés, avec leur moto, leurs envies et leur façon de rouler. Fini les conversations sans point commun.",
  },
  {
    icon: MapPin,
    title: "Des balades à partager",
    text: "Propose ou rejoins des sorties moto près de chez toi. Le meilleur des premiers rendez-vous, c'est un road trip.",
  },
  {
    icon: Users,
    title: "Une communauté qui te ressemble",
    text: "Motard, motarde, passager, permis en cours ou simplement attiré par cet univers : tu as ta place.",
  },
];

const STEPS = [
  { title: "Pré-inscris-toi", text: "Un court formulaire, gratuit et sans engagement." },
  { title: "Sois prévenu(e) en priorité", text: "On t'écrit dès l'ouverture de Motards de Cœur." },
  { title: "Crée ton profil et prends la route", text: "Rencontre, discute, roule." },
];

const FAQ = [
  {
    q: "La pré-inscription est-elle vraiment gratuite ?",
    a: "Oui. Te pré-inscrire ne coûte rien et ne t'engage à rien.",
  },
  {
    q: "Quand l'application ouvre-t-elle ?",
    a: "Bientôt. Les pré-inscrits sont informés en priorité, dès l'ouverture.",
  },
  {
    q: "Dois-je avoir une moto ?",
    a: "Non. Passagers, permis en cours et passionnés sont les bienvenus.",
  },
  {
    q: "Que faites-vous de mes informations ?",
    a: "Elles servent uniquement à te prévenir de l'ouverture. Le détail est dans notre politique de confidentialité.",
  },
];

/** Suivi publicitaire facultatif : ne doit jamais gêner la navigation. */
function trackCta(location: string) {
  try {
    const ttq = (window as unknown as { ttq?: { track?: (event: string, data?: object) => void } })
      .ttq;
    ttq?.track?.("ClickButton", { content_name: `cta-${location}` });
  } catch {
    // Le suivi est facultatif.
  }
}

function CtaButton({ location, label }: { location: string; label: string }) {
  return (
    <Link
      to="/join"
      onClick={() => trackCta(location)}
      className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-red px-8 py-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105"
    >
      {label}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function Landing() {
  return (
    <PrelaunchLayout>
      {/* HERO */}
      <section className="relative isolate overflow-hidden px-6 py-16 sm:py-24 lg:py-32">
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
          width={1920}
          height={1280}
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/70 to-background" />
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <span className="mb-6 inline-block rounded-full border border-[#d9a441]/45 bg-[#d9a441]/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-[#f6d98d]">
            Pré-inscriptions ouvertes · 100 % gratuit
          </span>
          <h1 className="font-display text-5xl font-bold leading-[0.98] sm:text-6xl md:text-7xl">
            La route rapproche <span className="text-gradient-red italic">les cœurs.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-foreground/80">
            Rencontre des motards qui partagent ta passion, ta façon de rouler et ton envie de
            liberté. Sois parmi les premiers à rejoindre Motards de Cœur.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <CtaButton location="hero" label="Je me pré-inscris gratuitement" />
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#f1d493]">
              {["Gratuit", "Sans engagement", "Prévenu(e) en priorité"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#e2b45f]" strokeWidth={3} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* BÉNÉFICES */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mx-auto max-w-2xl text-center font-display text-4xl sm:text-5xl">
            Rouler seul, c'est bien.{" "}
            <span className="text-gradient-red italic">Rouler à deux, c'est mieux.</span>
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="glass hover-lift rounded-3xl p-7">
                <Icon className="mb-5 h-8 w-8 text-primary" aria-hidden="true" />
                <h3 className="font-display text-2xl leading-tight">{title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="relative isolate overflow-hidden px-6 py-16 sm:py-24">
        <img
          src={communityImg}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 -z-10 bg-background/70" />
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-4xl sm:text-5xl">
            C'est simple comme un{" "}
            <span className="text-gradient-red italic">coup de démarreur</span>
          </h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="glass rounded-3xl p-7">
                <span className="font-display text-5xl text-gradient-red">{index + 1}</span>
                <h3 className="mt-3 font-display text-xl">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex justify-center">
            <CtaButton location="steps" label="Je réserve ma place" />
          </div>
        </div>
      </section>

      {/* CONFIANCE */}
      <section className="px-6 py-16">
        <div className="glass mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-3xl p-8 text-center">
          <ShieldCheck className="h-9 w-9 text-primary" aria-hidden="true" />
          <h2 className="font-display text-3xl">Une communauté bienveillante</h2>
          <p className="max-w-xl text-muted-foreground">
            Signalement et blocage de profils, messages filtrés contre les propos inappropriés :
            Motards de Cœur est pensé pour que chacun se sente en sécurité.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-4xl">Questions fréquentes</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="glass group rounded-2xl p-5">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  {q}
                </summary>
                <p className="mt-3 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* APPEL FINAL */}
      <section className="px-6 pb-28 pt-8 sm:pb-24">
        <HelmetCta
          title={["Prêt(e) à prendre", "la route ?"]}
          subtitle="Pré-inscription gratuite"
          label="Je me pré-inscris"
          onClick={() => trackCta("final")}
        />
      </section>

      {/* Barre d'action fixe sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-background/90 p-3 backdrop-blur sm:hidden">
        <Link
          to="/join"
          onClick={() => trackCta("sticky")}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-red py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground"
        >
          Me pré-inscrire gratuitement
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </PrelaunchLayout>
  );
}
