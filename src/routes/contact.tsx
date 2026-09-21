import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Mail, Send, ShieldCheck } from "lucide-react";

import { SITE_URL } from "@/lib/site";
const CONTACT_EMAIL = "contact@motardsdecoeur.com";
const hasContactEmail = CONTACT_EMAIL.length > 0;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Motards de Cœur" },
      { name: "description", content: "Contact officiel de Motards de Cœur pour les demandes générales et RGPD." },
      { property: "og:title", content: "Contact — Motards de Cœur" },
      { property: "og:description", content: "Contactez Motards de Cœur pour les demandes générales, RGPD et liées au lancement." },
      { property: "og:url", content: `${SITE_URL}/contact` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contact` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact — Motards de Cœur",
          url: `${SITE_URL}/contact`,
          description: "Page de contact officielle de Motards de Cœur pour les demandes générales et RGPD.",
          publisher: {
            "@type": "Organization",
            name: "Motards de Cœur",
            url: SITE_URL,
          },
        }),
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <Layout>
      <section className="py-20 px-6 border-b border-border/40">
        <div className="mx-auto max-w-7xl">
          <span className="text-primary uppercase tracking-[0.4em] text-xs">Contact</span>
          <h1 className="font-display text-5xl md:text-7xl mt-4">Restons <span className="text-gradient-red italic">en lien.</span></h1>
          <p className="text-muted-foreground max-w-2xl mt-4 text-lg">
            Motards de Cœur est en préparation. Pour toute demande générale ou RGPD, vous pouvez écrire à contact@motardsdecoeur.com.
          </p>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16">
          <form
            className="glass rounded-2xl p-10 space-y-5"
            onSubmit={(e) => e.preventDefault()}
          >
            <h2 className="font-display text-3xl mb-2">Écrivez-nous</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Le formulaire de contact n'est pas encore connecté. En attendant, utilisez l'adresse officielle ci-dessous.
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="contact-firstname" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Prénom</label>
                <input id="contact-firstname" name="firstname" autoComplete="given-name" disabled className="w-full cursor-not-allowed px-4 py-3 bg-input/40 border border-border rounded-lg text-muted-foreground focus:outline-none" />
              </div>
              <div>
                <label htmlFor="contact-lastname" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Nom</label>
                <input id="contact-lastname" name="lastname" autoComplete="family-name" disabled className="w-full cursor-not-allowed px-4 py-3 bg-input/40 border border-border rounded-lg text-muted-foreground focus:outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Email</label>
              <input id="contact-email" name="email" autoComplete="email" disabled type="email" className="w-full cursor-not-allowed px-4 py-3 bg-input/40 border border-border rounded-lg text-muted-foreground focus:outline-none" />
            </div>

            <div>
              <label htmlFor="contact-subject" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Sujet</label>
              <select id="contact-subject" name="subject" disabled className="w-full cursor-not-allowed px-4 py-3 bg-input/40 border border-border rounded-lg text-muted-foreground focus:outline-none">
                <option>Demande RGPD</option>
                <option>Partenariat</option>
                <option>Événement</option>
                <option>Presse</option>
                <option>Autre</option>
              </select>
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Message</label>
              <textarea id="contact-message" name="message" disabled rows={5} className="w-full cursor-not-allowed px-4 py-3 bg-input/40 border border-border rounded-lg text-muted-foreground focus:outline-none resize-none" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 px-8 py-4 bg-gradient-red text-primary-foreground rounded-full uppercase tracking-wider text-sm font-medium opacity-75 shadow-glow transition"
              >
                Formulaire bientôt connecté
              </button>
              {hasContactEmail ? (
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 px-6 py-3 glass rounded-full text-sm text-foreground hover:bg-foreground/10 transition">
                  <Send className="h-4 w-4" /> Envoyer un email
                </a>
              ) : (
                <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 px-6 py-3 glass rounded-full text-sm text-muted-foreground opacity-75 transition">
                  <Send className="h-4 w-4" /> Email officiel à confirmer
                </button>
              )}
            </div>
          </form>

          <div className="space-y-8">
            <div className="glass rounded-2xl p-8">
              <h3 className="font-display text-2xl mb-6">Contact officiel</h3>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="grid place-items-center w-10 h-10 rounded-full bg-gradient-red shrink-0">
                    <Mail className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Email</div>
                    {hasContactEmail ? (
                      <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-primary transition">{CONTACT_EMAIL}</a>
                    ) : (
                      <div className="text-muted-foreground">Adresse officielle à confirmer avant ouverture publique</div>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="grid place-items-center w-10 h-10 rounded-full bg-gradient-red shrink-0">
                    <ShieldCheck className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Demandes RGPD</div>
                    <div className="text-muted-foreground">
                      Pour accéder, rectifier ou demander la suppression de vos données, écrivez à contact@motardsdecoeur.com.
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="glass rounded-2xl p-8">
              <h3 className="font-display text-2xl mb-3">Réseaux sociaux</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Les comptes sociaux officiels ne sont pas encore confirmés. Ils seront ajoutés uniquement après validation.
              </p>
            </div>

            <div className="glass-red rounded-2xl p-8">
              <h3 className="font-display text-2xl mb-3">Formulaire de contact</h3>
              <p className="text-sm text-foreground/80">
                Le formulaire de contact sera activé prochainement. Pour toute demande, vous pouvez écrire directement à contact@motardsdecoeur.com.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
