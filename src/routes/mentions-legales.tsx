import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Layout } from "@/components/Layout";
import { FileText } from "lucide-react";

import { SITE_URL } from "@/lib/site";
const CONTACT_EMAIL = "contact@motardsdecoeur.com";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — Motards de Cœur" },
      {
        name: "description",
        content: "Mentions légales du site Motards de Cœur, actuellement publié sur Lovable.",
      },
      { property: "og:title", content: "Mentions légales — Motards de Cœur" },
      { property: "og:description", content: "Informations légales du site Motards de Cœur." },
      { property: "og:url", content: `${SITE_URL}/mentions-legales` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/mentions-legales` }],
  }),
  component: MentionsLegales,
});

function MentionsLegales() {
  return (
    <Layout>
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12">
            <span className="inline-flex items-center gap-2 text-primary uppercase tracking-[0.35em] text-xs">
              <FileText className="h-4 w-4" /> Informations légales
            </span>
            <h1 className="font-display text-5xl md:text-7xl mt-4 mb-6">Mentions légales</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ces mentions accompagnent la version actuelle de Motards de Cœur, service de rencontre
              et de communauté motarde en ligne.
            </p>
          </div>

          <div className="glass rounded-3xl p-6 md:p-10 space-y-10 text-muted-foreground leading-relaxed">
            <LegalSection title="Site concerné">
              <p>
                Le site Motards de Cœur est accessible à l'adresse
                https://motardsdecoeur-com.lovable.app.
              </p>
            </LegalSection>

            <LegalSection title="Éditeur du site">
              <p>
                Les informations légales complètes de l'éditeur (raison sociale, forme juridique,
                SIRET, adresse, directeur de publication) seront prochainement complétées sur cette
                page, conformément à la loi pour la confiance dans l'économie numérique (LCEN).
              </p>
            </LegalSection>

            <LegalSection title="Contact">
              <p>
                Pour toute demande générale ou RGPD, Motards de Cœur peut être contacté à l'adresse{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </LegalSection>

            <LegalSection title="Hébergement">
              <p>
                Le site est actuellement publié via Lovable. Les informations d'hébergement pourront
                être précisées lors de la mise en production définitive.
              </p>
            </LegalSection>

            <LegalSection title="Propriété intellectuelle">
              <p>
                Les textes, visuels, éléments de marque et interfaces présents sur le site sont
                destinés à Motards de Cœur. Toute réutilisation non autorisée est interdite.
              </p>
            </LegalSection>

            <LegalSection title="Responsabilité">
              <p>
                Motards de Cœur s'efforce d'assurer l'exactitude des informations diffusées sur le
                site, sans garantie absolue. L'éditeur ne saurait être tenu responsable des
                interruptions temporaires du service ou des erreurs éventuelles, et se réserve le
                droit de faire évoluer les fonctionnalités proposées.
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
