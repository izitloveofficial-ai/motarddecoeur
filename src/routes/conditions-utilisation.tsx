import { Link, createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Layout } from "@/components/Layout";
import { ScrollText } from "lucide-react";

const SITE_URL = "https://motarddecoeur.lovable.app";
const CONTACT_EMAIL = "contact@motardsdecoeur.com";

export const Route = createFileRoute("/conditions-utilisation")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — Motards de Cœur" },
      {
        name: "description",
        content:
          "Conditions d'utilisation de la version actuelle de Motards de Cœur et de sa pré-inscription.",
      },
      { property: "og:title", content: "Conditions d'utilisation — Motards de Cœur" },
      {
        property: "og:description",
        content: "Cadre d'utilisation de Motards de Cœur avant le lancement complet du service.",
      },
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
            <h1 className="font-display text-5xl md:text-7xl mt-4 mb-6">
              Conditions d'utilisation
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              En créant un compte ou en utilisant Motards de Cœur, tu acceptes les présentes
              conditions. Merci de les lire attentivement.
            </p>
          </div>
          <div className="glass rounded-3xl p-6 md:p-10 space-y-10 text-muted-foreground leading-relaxed">
            <LegalSection title="1. Objet du service">
              <p>
                Motards de Cœur est une application de rencontre et de communauté réservée aux
                personnes passionnées de moto. Elle permet notamment de créer un profil, de
                découvrir d'autres profils, d'avoir des coups de cœur mutuels, d'échanger par
                messagerie, et d'organiser ou rejoindre des balades moto.
              </p>
            </LegalSection>
            <LegalSection title="2. Âge minimum et un compte par personne">
              <p>
                Le service est strictement réservé aux personnes âgées de 18 ans ou plus. En créant
                un compte, tu certifies avoir 18 ans ou plus. Chaque personne ne peut détenir qu'un
                seul compte. La création d'un compte au nom d'une autre personne ou l'usurpation
                d'identité sont interdites.
              </p>
            </LegalSection>
            <LegalSection title="3. Inscription et exactitude des informations">
              <p>
                Les informations fournies lors de l'inscription et sur le profil doivent être
                exactes, sincères et te concerner personnellement. Les faux profils, y compris ceux
                créés à des fins commerciales, publicitaires ou frauduleuses, sont interdits et
                entraînent la suspension immédiate du compte.
              </p>
            </LegalSection>
            <LegalSection title="4. Usages strictement interdits">
              <p>Sont notamment interdits, sans que cette liste soit exhaustive :</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>
                  Toute sollicitation ou offre à caractère commercial de nature sexuelle, y compris
                  toute forme de prostitution ou d'escorting ;
                </li>
                <li>
                  Le harcèlement, les menaces, l'intimidation ou tout comportement abusif envers un
                  autre membre ;
                </li>
                <li>
                  La publication de contenu à caractère haineux, discriminatoire, violent ou illégal
                  ;
                </li>
                <li>
                  Le partage de contenu impliquant des mineurs, sous quelque forme que ce soit ;
                </li>
                <li>L'usurpation d'identité ou la création de faux profils ;</li>
                <li>
                  Le démarchage commercial, le spam ou toute activité publicitaire non sollicitée ;
                </li>
                <li>
                  Toute tentative de contourner un blocage, une suspension ou un bannissement.
                </li>
              </ul>
              <p>
                Le non-respect de ces règles peut entraîner, selon la gravité, un avertissement, la
                suppression du contenu concerné, la suspension ou la suppression définitive du
                compte, sans préavis.
              </p>
            </LegalSection>
            <LegalSection title="5. Contenu publié par les membres">
              <p>
                Tu restes propriétaire des contenus que tu publies (photos, messages, présentation
                de profil). Tu garantis détenir les droits nécessaires sur les photos que tu publies
                et qu'elles te représentent réellement. Motards de Cœur se réserve le droit de
                retirer tout contenu contraire aux présentes conditions ou à la loi.
              </p>
            </LegalSection>
            <LegalSection title="6. Sécurité, signalement et blocage">
              <p>
                Chaque profil, message ou balade peut être signalé directement depuis l'application.
                Tu peux également bloquer un autre membre à tout moment : une fois bloquée, cette
                personne ne peut plus voir ton profil ni t'envoyer de message. Les signalements sont
                examinés par notre équipe de modération, qui peut suspendre ou bannir un compte en
                cas de non-respect des présentes conditions.
              </p>
            </LegalSection>
            <LegalSection title="7. Suspension et suppression de compte">
              <p>
                Tu peux supprimer ton compte à tout moment depuis la page de ton profil. Motards de
                Cœur se réserve le droit de suspendre ou de supprimer un compte en cas de violation
                des présentes conditions, sans préavis ni indemnité, notamment en cas de
                comportement mettant en danger la sécurité d'autres membres.
              </p>
            </LegalSection>
            <LegalSection title="8. Données personnelles">
              <p>
                Le traitement de tes données personnelles est décrit dans la{" "}
                <Link to="/confidentialite" className="text-primary hover:underline">
                  politique de confidentialité
                </Link>
                . Aucune donnée n'est vendue à des tiers. Tu peux demander l'accès, la
                rectification, l'export ou la suppression de tes données depuis l'application ou par
                email à{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </LegalSection>
            <LegalSection title="9. Limitation de responsabilité">
              <p>
                Motards de Cœur met en relation des membres mais ne peut garantir l'exactitude des
                informations fournies par chacun, ni la sécurité des rencontres organisées en dehors
                de l'application. Chaque membre reste responsable de sa prudence lors de rencontres
                physiques avec d'autres membres.
              </p>
            </LegalSection>
            <LegalSection title="10. Modification des présentes conditions">
              <p>
                Ces conditions peuvent évoluer avec le développement du service. En cas de
                modification substantielle, les membres en seront informés via l'application.
              </p>
            </LegalSection>
            <LegalSection title="11. Droit applicable et contact">
              <p>
                Les présentes conditions sont soumises au droit français. Pour toute question,
                contacte-nous via la{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  page contact
                </Link>{" "}
                ou par email à{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
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
