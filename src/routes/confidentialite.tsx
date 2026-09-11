import { Link, createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Layout } from "@/components/Layout";
import { ShieldCheck } from "lucide-react";

const SITE_URL = "https://motarddecoeur.lovable.app";
const CONTACT_EMAIL = "contact@motardsdecoeur.com";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Motards de Cœur" },
      {
        name: "description",
        content:
          "Politique de confidentialité de Motards de Cœur pour la pré-inscription et l'information sur le lancement.",
      },
      { property: "og:title", content: "Politique de confidentialité — Motards de Cœur" },
      {
        property: "og:description",
        content: "Découvrez comment Motards de Cœur utilise les données de pré-inscription.",
      },
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
        intro="Cette page explique quelles données Motards de Cœur collecte, pourquoi, et comment tu peux les contrôler."
      >
        <LegalSection title="Qui traite tes données">
          <p>
            Motards de Cœur est l'éditeur et responsable du traitement de tes données. Nos serveurs
            et bases de données sont hébergés par Supabase (Union européenne). Pour toute question,
            contacte-nous à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </LegalSection>
        <LegalSection title="Données collectées lors de l'inscription">
          <ul>
            <li>adresse email et mot de passe (chiffré, jamais stocké en clair) ;</li>
            <li>confirmation que tu as 18 ans ou plus ;</li>
            <li>acceptation des CGU et de la présente politique.</li>
          </ul>
        </LegalSection>
        <LegalSection title="Données de ton profil">
          <ul>
            <li>prénom, date de naissance, genre, ce que tu recherches ;</li>
            <li>informations sur ta moto (type, marque, modèle) ;</li>
            <li>présentation libre ;</li>
            <li>jusqu'à 3 photos ;</li>
            <li>
              position géographique approximative, uniquement si tu actives volontairement cette
              option. Ta position exacte n'est jamais stockée de façon lisible ni partagée : seule
              une distance arrondie avec les autres membres est calculée, via un mécanisme technique
              dédié.
            </li>
          </ul>
        </LegalSection>
        <LegalSection title="Données liées à l'utilisation de l'app">
          <ul>
            <li>tes likes (&quot;j'aime&quot;/&quot;passer&quot;) et tes matchs ;</li>
            <li>les messages que tu envoies à tes matchs ;</li>
            <li>les balades que tu crées ou rejoins ;</li>
            <li>les signalements que tu effectues et les comptes que tu bloques ;</li>
            <li>
              si tu utilises l'application mobile et acceptes les notifications, un identifiant
              technique de ton appareil (jeton de notification), partagé avec Firebase (Google)
              uniquement pour te délivrer les notifications.
            </li>
          </ul>
        </LegalSection>
        <LegalSection title="Ce que nous ne faisons jamais">
          <ul>
            <li>Nous ne vendons aucune donnée à des tiers ;</li>
            <li>Nous n'affichons jamais ta position exacte ni ton adresse ;</li>
            <li>
              Nous ne partageons tes données qu'avec les prestataires techniques strictement
              nécessaires au fonctionnement du service (hébergement, envoi de notifications).
            </li>
          </ul>
        </LegalSection>
        <LegalSection title="Sécurité">
          <p>
            L'accès à tes données est protégé par des règles de sécurité au niveau de chaque ligne
            de données (Row Level Security) : un autre membre ne peut voir que ce que tu choisis de
            rendre visible (profil actif), et jamais tes coordonnées exactes, ton email, ou les
            données d'un compte que tu as bloqué ou qui t'a bloqué.
          </p>
        </LegalSection>
        <LegalSection title="Tes droits et comment les exercer">
          <p>
            Conformément au RGPD, tu disposes à tout moment des droits suivants, exerçables
            directement depuis l'application :
          </p>
          <ul>
            <li>
              <strong>Accès et export</strong> : depuis la page de ton profil, tu peux télécharger
              une copie complète de tes données (profil, photos, matchs, messages envoyés,
              participations aux balades) ;
            </li>
            <li>
              <strong>Rectification</strong> : modifie ton profil à tout moment depuis la même page
              ;
            </li>
            <li>
              <strong>Suppression</strong> : supprime définitivement ton compte et toutes tes
              données associées en un clic, depuis la page de ton profil ;
            </li>
            <li>
              <strong>Opposition et limitation</strong> : contacte-nous à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>{" "}
              ou via la{" "}
              <Link to="/contact" className="text-primary hover:underline">
                page contact
              </Link>
              .
            </li>
          </ul>
        </LegalSection>
        <LegalSection title="Conservation des données">
          <p>
            Tes données sont conservées tant que ton compte est actif. En cas de suppression de
            compte, elles sont effacées immédiatement et définitivement, à l'exception des données
            que nous devons conserver pour répondre à une obligation légale (ex. traitement d'un
            signalement en cours).
          </p>
        </LegalSection>
        <LegalSection title="Évolution de cette politique">
          <p>
            Cette politique peut évoluer avec le développement du service. En cas de modification
            substantielle, tu en seras informé(e) via l'application.
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
