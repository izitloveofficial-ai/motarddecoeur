import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Bike, CheckCircle2, Clock, HeartHandshake, Mail, MapPin, Send } from "lucide-react";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Pré-inscription — Motard de Cœur" },
      { name: "description", content: "Inscrivez-vous pour être prévenu du lancement de Motard de Cœur : rencontres, balades, événements et affinités entre passionnés de moto." },
      { property: "og:title", content: "Pré-inscription — Motard de Cœur" },
      { property: "og:description", content: "La communauté Motard de Cœur ouvre bientôt. Soyez prévenu du lancement." },
      { property: "og:url", content: "/join" },
    ],
    links: [{ rel: "canonical", href: "/join" }],
  }),
  component: Join,
});

const interests = ["Amitié", "Balade", "Rencontre", "Communauté"];
const rideTypes = ["Permis en cours", "125 cc", "Roadster", "Custom", "Sportive", "Touring", "Trail", "Autre"];

function Join() {
  return (
    <Layout>
      <section className="py-20 px-6 border-b border-border/40">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 glass-red px-4 py-2 rounded-full text-xs uppercase tracking-widest mb-6">
              <Clock className="h-3 w-3" /> Ouverture prochaine
            </span>
            <h1 className="font-display text-5xl md:text-7xl leading-none mb-6">
              La communauté <span className="text-gradient-red italic">Motard de Cœur</span> ouvre bientôt.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
              Rencontres, balades, événements et affinités entre passionnés de moto.
              Inscris-toi pour être prévenu du lancement et faire partie des premiers membres.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
              {[
                { icon: HeartHandshake, title: "Rencontres", text: "Des affinités entre passionnés." },
                { icon: Bike, title: "Balades", text: "Des rides et sorties locales." },
                { icon: MapPin, title: "Événements", text: "Des rendez-vous biker à venir." },
              ].map((item) => (
                <div key={item.title} className="glass rounded-2xl p-5">
                  <item.icon className="h-5 w-5 text-primary mb-3" />
                  <h2 className="font-display text-xl mb-1">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <form className="glass rounded-3xl p-8 md:p-10 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <span className="text-primary uppercase tracking-[0.35em] text-xs">Pré-inscription</span>
              <h2 className="font-display text-3xl mt-3 mb-3">Soyez prévenu du lancement</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cette maquette n'est pas encore connectée à une base de données.
                Le formulaire sera activé dès que la collecte réelle sera prête.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="join-firstname" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Prénom</label>
                <input id="join-firstname" name="firstname" disabled placeholder="Ex. Camille" className="w-full cursor-not-allowed px-4 py-3 bg-input/40 border border-border rounded-lg text-muted-foreground focus:outline-none" />
              </div>
              <div>
                <label htmlFor="join-email" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Email</label>
                <input id="join-email" name="email" disabled type="email" placeholder="email bientôt collecté" className="w-full cursor-not-allowed px-4 py-3 bg-input/40 border border-border rounded-lg text-muted-foreground focus:outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="join-location" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Ville ou région</label>
              <input id="join-location" name="location" disabled placeholder="Ex. Lyon, Alpes, Côte d'Azur" className="w-full cursor-not-allowed px-4 py-3 bg-input/40 border border-border rounded-lg text-muted-foreground focus:outline-none" />
            </div>

            <div>
              <label htmlFor="join-bike" className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Type de moto ou permis</label>
              <select id="join-bike" name="bike" disabled className="w-full cursor-not-allowed px-4 py-3 bg-input/40 border border-border rounded-lg text-muted-foreground focus:outline-none">
                {rideTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>

            <fieldset disabled className="space-y-3 opacity-75">
              <legend className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Je cherche</legend>
              <div className="grid grid-cols-2 gap-3">
                {interests.map((interest) => (
                  <label key={interest} className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-input/30 px-3 py-2 text-sm text-muted-foreground">
                    <input type="checkbox" disabled className="accent-primary" />
                    {interest}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex cursor-not-allowed items-start gap-3 rounded-xl border border-border bg-input/30 p-4 text-sm text-muted-foreground opacity-75">
              <input type="checkbox" disabled className="mt-1 accent-primary" />
              J'accepte d'être recontacté au lancement de Motard de Cœur.
            </label>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 px-8 py-4 bg-gradient-red text-primary-foreground rounded-full uppercase tracking-wider text-sm font-medium opacity-75 shadow-glow">
                Pré-inscription bientôt connectée <Send className="h-4 w-4" />
              </button>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Aucun compte ni paiement requis pour l'instant.
              </span>
            </div>
          </form>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl text-center">
          <Mail className="mx-auto h-8 w-8 text-primary mb-5" />
          <h2 className="font-display text-4xl md:text-5xl mb-4">Une première liste d'attente, avant la vraie application.</h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
            Cette étape prépare le lancement sans créer encore de backend complet.
            La collecte réelle sera connectée plus tard, avec consentement clair et stockage sécurisé.
          </p>
        </div>
      </section>
    </Layout>
  );
}
