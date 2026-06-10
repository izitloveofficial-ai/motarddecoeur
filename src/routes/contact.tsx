import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Mail, MapPin, Phone, Instagram, Facebook, Youtube, Send } from "lucide-react";

const CONTACT_EMAIL = "";
const hasContactEmail = CONTACT_EMAIL.length > 0;

const socialLinks = [
  { href: "https://instagram.com/motarddecoeur", label: "Instagram", Icon: Instagram },
  { href: "https://facebook.com/motarddecoeur", label: "Facebook", Icon: Facebook },
  { href: "https://youtube.com/motarddecoeur", label: "YouTube", Icon: Youtube },
];

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Motard de Cœur" },
      { name: "description", content: "Une question ? Contactez l'équipe Motard de Cœur. Support 7j/7." },
      { property: "og:title", content: "Contact — Motard de Cœur" },
      { property: "og:description", content: "Contactez l'équipe de Motard de Cœur pour toute question, partenariat, événement ou support technique dédié aux passionnés de moto. Réponse sous 24h." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Motard de Cœur",
          url: "https://coeur-road-connect.lovable.app",
          ...(hasContactEmail ? { email: CONTACT_EMAIL } : {}),
          telephone: "+33 4 22 13 56 78",
          address: {
            "@type": "PostalAddress",
            streetAddress: "12 quai Rambaud",
            postalCode: "69002",
            addressLocality: "Lyon",
            addressCountry: "FR",
          },
          openingHours: "Mo-Su 00:00-23:59",
          sameAs: socialLinks.map((link) => link.href),
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
          <h1 className="font-display text-5xl md:text-7xl mt-4">Parlons <span className="text-gradient-red italic">moto.</span></h1>
          <p className="text-muted-foreground max-w-2xl mt-4 text-lg">
            Une question, un partenariat, un événement à organiser ? Notre équipe vous répond sous 24h.
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
              Le formulaire sera bientôt connecté. L'adresse email sera ajoutée dès confirmation.
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
                <option>Support technique</option>
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
                  <Send className="h-4 w-4" /> Email bientôt disponible
                </button>
              )}
            </div>
          </form>

          <div className="space-y-8">
            <div className="glass rounded-2xl p-8">
              <h3 className="font-display text-2xl mb-6">Coordonnées</h3>
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
                      <div className="text-muted-foreground">Bientôt disponible</div>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="grid place-items-center w-10 h-10 rounded-full bg-gradient-red shrink-0">
                    <Phone className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Support · 7j/7</div>
                    <div>+33 4 22 13 56 78</div>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="grid place-items-center w-10 h-10 rounded-full bg-gradient-red shrink-0">
                    <MapPin className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Garage HQ</div>
                    <div>12 quai Rambaud, 69002 Lyon</div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="glass rounded-2xl p-8">
              <h3 className="font-display text-2xl mb-6">Réseaux sociaux</h3>
              <div className="flex gap-3">
                {socialLinks.map(({ href, label, Icon }) => (
                  <a key={label} href={href} className="grid place-items-center w-14 h-14 rounded-full glass hover:bg-gradient-red transition" aria-label={label}>
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-6">@motarddecoeur · Rejoignez 120k+ motards.</p>
            </div>

            <div className="glass-red rounded-2xl p-8">
              <h3 className="font-display text-2xl mb-3">Support Premium</h3>
              <p className="text-sm text-foreground/80">Membres Premium et VIP : ligne dédiée 24/7 disponible dans votre espace personnel.</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
