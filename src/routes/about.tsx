import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Heart, Compass, Shield, Flame } from "lucide-react";
import bikeImg from "@/assets/bike-dark.jpg";
import community from "@/assets/community-ride.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — Motard de Cœur" },
      { name: "description", content: "L'histoire de Motard de Cœur : créer des liens authentiques entre passionnés de moto." },
      { property: "og:title", content: "À propos — Motard de Cœur" },
      { property: "og:description", content: "Notre mission : connecter les cœurs sur la route." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <Layout>
      <section className="relative -mt-20 h-[70vh] flex items-end overflow-hidden">
        <img src={bikeImg} alt="" className="absolute inset-0 w-full h-full object-cover" width={1600} height={1000} />
        <div className="absolute inset-0 bg-gradient-overlay" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16 animate-fade-up">
          <span className="text-primary uppercase tracking-[0.4em] text-xs">Notre histoire</span>
          <h1 className="font-display text-6xl md:text-8xl mt-4 leading-none">
            Né d'une <span className="text-gradient-red italic">passion</span><br /> partagée.
          </h1>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="mx-auto max-w-4xl space-y-12 text-lg leading-relaxed text-foreground/85">
          <p className="text-2xl text-foreground font-display italic">
            "Une moto, deux roues, un cœur qui bat à 6000 tours minute."
          </p>
          <p>
            Motard de Cœur est né en 2024, dans un garage du sud de la France,
            entre l'odeur de l'essence et le rugissement d'un V-twin. Trois amis
            motards, lassés des applications de rencontres génériques où personne
            ne comprenait leur passion, ont décidé de créer un endroit à eux.
          </p>
          <p>
            Un sanctuaire numérique pour celles et ceux dont le cœur s'emballe
            au son d'un moteur, qui rêvent de routes infinies et de couchers de
            soleil partagés sur l'autoroute. Pas une simple app de rencontres —
            une véritable confrérie.
          </p>
          <p>
            Aujourd'hui, nous réunissons plus de <strong className="text-primary">48 000 motards vérifiés</strong>
            à travers l'Europe. Riders Harley, pilotes sportifs, voyageurs au long
            cours ou amoureux du custom : tous partagent une même vérité —
            <em> la route rapproche les cœurs</em>.
          </p>
        </div>
      </section>

      <section className="py-32 px-6 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <span className="text-primary uppercase tracking-[0.4em] text-xs">Nos valeurs</span>
            <h2 className="font-display text-5xl md:text-6xl mt-4">Ce qui nous anime</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Heart, title: "Authenticité", desc: "De vraies personnes, de vraies histoires." },
              { icon: Compass, title: "Liberté", desc: "La route comme philosophie de vie." },
              { icon: Shield, title: "Respect", desc: "Une communauté bienveillante et sûre." },
              { icon: Flame, title: "Passion", desc: "L'essence qui coule dans nos veines." },
            ].map((v, i) => (
              <div key={i} className="text-center p-8 glass rounded-2xl hover-lift">
                <div className="grid place-items-center w-14 h-14 mx-auto rounded-xl bg-gradient-red shadow-glow mb-6">
                  <v.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          <img src={community} alt="" className="rounded-2xl shadow-elegant" loading="lazy" width={1600} height={1000} />
          <div>
            <span className="text-primary uppercase tracking-[0.4em] text-xs">Mission</span>
            <h2 className="font-display text-5xl mt-4 mb-6">Connecter les âmes libres.</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Nous existons pour briser l'isolement du motard solitaire. Pour
              transformer chaque rencontre en aventure, chaque match en road trip,
              chaque conversation en histoire qui mérite d'être racontée.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
