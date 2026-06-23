import { Link, createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Layout } from "@/components/Layout";
import { ShieldCheck } from "lucide-react";

const SITE_URL = "https://motarddecoeur.lovable.app";
const CONTACT_EMAIL = "contact@motarddecoeur.fr";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Motards de Cœur" },
      { name: "description", content: "Politique de confidentialité de Motards de Cœur pour la pré-inscription et l'information sur le lancement." },
      { property: "og:title", content: "Politique de confidentialité — Motards de Cœur" },
      { property: "og:description", content: "Découvrez comment Motards de Cœur utilise les données de pré-inscription." },
      { property: "og:url", content: `${SITE_URL}/confidentialite` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/confidentialite` }],
  }),
  component: Confidentialite,
});

function Confidentialite() {
  return (
    <Layout>
      <LegalPage
        eyebrow="Confidentialité"
        title="Politique de confidentialité"
        intro="Cette page explique comment Motards de Cœur traite les données transmises lors de la pré-inscription au lancement."
      >
        <LegalSection title="Finalité de la collecte">
          <p>
            Les informations envoyées via la page de pré-inscription servent uniquement à constituer une liste d'attente,
            à mesurer l'intérêt pour Motards de Cœur et à vous informer du lancement du service.
          </p>
        </LegalSection>

        <LegalSection title="Données collectées">
          <p>Le formulaire de pré-inscription peut collecter les données suivantes :</p>
          <ul>
            <li>prénom ;</li>
            <li>adresse email ;</li>
            <li>ville ou région ;</li>
            <li>âge ;</li>
            <li>sexe ;</li>
            <li>type de moto ou permis ;</li>
            <li>message facultatif ;</li>
            <li>consentement à être recontacté au sujet du lancement.</li>
          </ul>
        </LegalSection>

        <LegalSection title="Utilisation des données">
          <p>
            Ces données ne sont pas utilisées pour créer un compte, activer une messagerie, déclencher un paiement ou publier un profil.
            Elles servent uniquement à gérer la pré-inscription et les informations liées au lancement.
          </p>
        </LegalSection>

        <LegalSection title="Vente ou partage commercial">
          <p>
            Motards de Cœur ne vend pas les données de pré-inscription. Les informations transmises ne sont pas revendues à des tiers.
          </p>
        </LegalSection>

        <LegalSection title="Conservation et suppression">
          <p>
            Les données sont conservées le temps nécessaire à la préparation du lancement. Vous pouvez demander l'accès,
            la rectification ou la suppression de vos données à tout moment via la page{" "}
            <Link to="/contact" className="text-primary hover:underline">contact</Link>{" "}
            ou par email à <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </LegalSection>

        <LegalSection title="Sécurité">
          <p>
            Les pré-inscriptions sont destinées à être stockées dans Supabase avec des règles d'accès limitant la lecture publique.
            La configuration finale doit être vérifiée avant l'ouverture officielle de la collecte.
          </p>
        </LegalSection>

        <LegalSection title="Évolution de cette politique">
          <p>
            Cette politique pourra être mise à jour lorsque Motards de Cœur proposera de nouvelles fonctionnalités comme les comptes,
            les profils, les événements, la messagerie ou les offres premium.
          </p>
        </LegalSection>
      </LegalPage>
    </Layout>
  );
}

function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12">
          <span className="inline-flex items-center gap-2 text-primary uppercase tracking-[0.35em] text-xs">
            <ShieldCheck className="h-4 w-4" /> {eyebrow}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mt-4 mb-6">{title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{intro}</p>
        </div>
        <div className="glass rounded-3xl p-6 md:p-10 space-y-10 text-muted-foreground leading-relaxed">
          {children}
        </div>
      </div>
    </section>
  );
}

function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1">
      <h2 className="font-display text-2xl text-foreground">{title}</h2>
      {children}
    </section>
  );
}
