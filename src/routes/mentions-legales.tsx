import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Layout } from "@/components/Layout";
import { FileText } from "lucide-react";

const SITE_URL = "https://motarddecoeur.lovable.app";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — Motard de Cœur" },
      { name: "description", content: "Mentions légales du site Motard de Cœur, actuellement publié sur Lovable." },
      { property: "og:title", content: "Mentions légales — Motard de Cœur" },
      { property: "og:description", content: "Informations légales du site Motard de Cœur." },
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
              Ces mentions accompagnent la version actuelle de Motard de Cœur, publiée comme site de présentation et de pré-inscription.
            </p>
          </div>

          <div className="glass rounded-3xl p-6 md:p-10 space-y-10 text-muted-foreground leading-relaxed">
            <LegalSection title="Site concerné">
              <p>
                Le site Motard de Cœur est accessible à l'adresse https://motarddecoeur.lovable.app.
              </p>
            </LegalSection>

            <LegalSection title="Éditeur du site">
              <p>
                Les informations légales complètes de l'éditeur seront complétées avant l'ouverture commerciale du service.
                Pour l'instant, le site présente le projet Motard de Cœur et permet la pré-inscription au lancement.
              </p>
            </LegalSection>

            <LegalSection title="Contact">
              <p>
                L'adresse email officielle n'étant pas encore confirmée, les demandes doivent être effectuées via la page contact du site.
              </p>
            </LegalSection>

            <LegalSection title="Hébergement">
              <p>
                Le site est actuellement publié via Lovable. Les informations d'hébergement pourront être précisées lors de la mise en production définitive.
              </p>
            </LegalSection>

            <LegalSection title="Propriété intellectuelle">
              <p>
                Les textes, visuels, éléments de marque et interfaces présents sur le site sont destinés à Motard de Cœur.
                Toute réutilisation non autorisée est interdite.
              </p>
            </LegalSection>

            <LegalSection title="Responsabilité">
              <p>
                Le site est en phase de préparation. Certaines fonctionnalités présentées peuvent être annoncées comme à venir et ne constituent pas encore un service actif.
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
