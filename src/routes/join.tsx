import { Link, createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Bike, Clock, ExternalLink, HeartHandshake, Mail, MapPin, ShieldCheck } from "lucide-react";

const SITE_URL = "https://motarddecoeur.lovable.app";
const TALLY_FORM_URL = "https://tally.so/r/44q7ok";
const TALLY_EMBED_URL = "https://tally.so/embed/44q7ok?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Pré-inscription gratuite — Motards de Cœur" },
      { name: "description", content: "Pré-inscrivez-vous gratuitement à Motards de Cœur pour être recontacté au lancement : rencontres, balades, amitié et communauté motarde." },
      { property: "og:title", content: "Pré-inscription gratuite — Motards de Cœur" },
      { property: "og:description", content: "Motards de Cœur arrive bientôt. Pré-inscription gratuite et sans engagement pour les passionnés de moto." },
      { property: "og:url", content: `${SITE_URL}/join` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/join` }],
  }),
  component: Join,
});

function Join() {
  return (
    <Layout>
      <section className="py-20 px-6 border-b border-border/40">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 glass-red px-4 py-2 rounded-full text-xs uppercase tracking-widest mb-6">
              <Clock className="h-3 w-3" /> Pré-inscription gratuite
            </span>
            <h1 className="font-display text-5xl md:text-7xl leading-none mb-6">
              Motards de Cœur arrive bientôt pour les passionnés de moto.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-5">
              Rencontres, balades, amitié et communauté motarde : pré-inscris-toi gratuitement et sans engagement pour être recontacté dès le lancement.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-8">
              Le projet rassemble les motards et motardes qui veulent créer de vrais liens autour de la route, des sorties et d'une passion commune.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
              {[
                { icon: MapPin, title: "Motards proches", text: "Rencontrer des motards proches de sa région." },
                { icon: Bike, title: "Balades moto", text: "Organiser ou rejoindre des balades moto." },
                { icon: HeartHandshake, title: "Accès prioritaire", text: "Être informé en priorité du lancement." },
              ].map((item) => (
                <div key={item.title} className="glass rounded-2xl p-5">
                  <item.icon className="h-5 w-5 text-primary mb-3" />
                  <h2 className="font-display text-xl mb-1">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/10 p-5 text-sm text-muted-foreground leading-relaxed">
              <div className="mb-2 flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> Collecte via Tally
              </div>
              Les données de pré-inscription sont collectées via notre formulaire Tally afin de vous recontacter au lancement.
              Aucun compte, paiement, profil public ou messagerie n'est créé à cette étape.
            </div>
          </div>

          <div className="glass rounded-3xl p-6 md:p-10 space-y-6">
            <div>
              <span className="text-primary uppercase tracking-[0.35em] text-xs">Pré-inscription</span>
              <h2 className="font-display text-3xl mt-3 mb-3">Remplir le formulaire officiel</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le formulaire est gratuit, sans engagement, et sert uniquement à vous prévenir du lancement de Motards de Cœur.
              </p>
            </div>

            <a
              href={TALLY_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 px-8 py-4 bg-gradient-red text-primary-foreground rounded-full uppercase tracking-wider text-sm font-medium shadow-glow hover:scale-[1.02] transition-all"
            >
              Remplir le formulaire de pré-inscription <ExternalLink className="h-4 w-4" />
            </a>

            <div className="overflow-hidden rounded-2xl border border-border bg-background/60">
              <iframe
                src={TALLY_EMBED_URL}
                title="Formulaire de pré-inscription Motards de Cœur"
                loading="lazy"
                className="h-[680px] w-full border-0 bg-transparent"
              />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Si le formulaire ne s'affiche pas correctement, utilisez le bouton ci-dessus pour l'ouvrir directement sur Tally.
              Consultez aussi notre{" "}
              <Link to="/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl text-center">
          <Mail className="mx-auto h-8 w-8 text-primary mb-5" />
          <h2 className="font-display text-4xl md:text-5xl mb-4">Une première liste d'attente, avant la vraie application.</h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
            Cette étape prépare le lancement avec une collecte simple et consentie.
            Les comptes utilisateurs, profils, likes, messagerie et offres premium viendront plus tard.
          </p>
        </div>
      </section>
    </Layout>
  );
}
