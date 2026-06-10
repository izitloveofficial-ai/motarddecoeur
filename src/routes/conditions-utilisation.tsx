import { Link, createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Layout } from "@/components/Layout";
import { ScrollText } from "lucide-react";

const SITE_URL = "https://motarddecoeur.lovable.app";

export const Route = createFileRoute("/conditions-utilisation")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — Motard de Cœur" },
      { name: "description", content: "Conditions d'utilisation de la version actuelle de Motard de Cœur et de sa pré-inscription." },
      { property: "og:title", content: "Conditions d'utilisation — Motard de Cœur" },
      { property: "og:description", content: "Cadre d'utilisation de Motard de Cœur avant le lancement complet du service." },
      { property: "og:url", content: `${SITE_URL}/conditions-utilisation` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/conditions-utilisation` }],
  }),
  component: ConditionsUtilisation,
});

function ConditionsUtilisation() {
  return (
    <Layout>
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12">
            <span className="inline-flex items-center gap-2 text-primary uppercase tracking-[0.35em] text-xs">
              <ScrollText className="h-4 w-4" /> Conditions
            </span>
            <h1 className="font-display text-5xl md:text-7xl mt-4 mb-6">Conditions d'utilisation</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ces conditions encadrent l'utilisation de la version actuelle du site Motard de Cœur, avant l'ouverture de l'application complète.
            </p>
          </div>

          <div className="glass rounded-3xl p-6 md:p-10 space-y-10 text-muted-foreground leading-relaxed">
            <LegalSection title="Service actuellement proposé">
              <p>
                Motard de Cœur est actuellement un site de présentation avec une page de pré-inscription au lancement.
                Il ne propose pas encore de compte utilisateur, de profil public, de messagerie, de paiement ou de rencontre active.
              </p>
            </LegalSection>

            <LegalSection title="Pré-inscription">
              <p>
                La pré-inscription permet de manifester son intérêt pour le lancement de Motard de Cœur.
                Elle ne garantit pas un accès immédiat au service final et ne crée pas de compte utilisateur.
              </p>
            </LegalSection>

            <LegalSection title="Exactitude des informations">
              <p>
                Les informations transmises dans le formulaire doivent être sincères et ne pas usurper l'identité d'une autre personne.
              </p>
            </LegalSection>

            <LegalSection title="Respect et sécurité">
              <p>
                Motard de Cœur est pensé comme une communauté respectueuse entre passionnés de moto.
                Les futurs services pourront inclure des règles complémentaires de modération, de sécurité et de comportement.
              </p>
            </LegalSection>

            <LegalSection title="Données personnelles">
              <p>
                Les données de pré-inscription sont traitées selon la <Link to="/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
                Aucune donnée n'est vendue. Une demande de suppression peut être effectuée via la page contact.
              </p>
            </LegalSection>

            <LegalSection title="Évolution du service">
              <p>
                Les présentes conditions seront mises à jour avant l'ouverture de fonctionnalités plus avancées comme les profils, les événements,
                les likes, la messagerie, l'abonnement premium ou les paiements.
              </p>
            </LegalSection>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl text-foreground">{title}</h2>
      {children}
    </section>
  );
}
