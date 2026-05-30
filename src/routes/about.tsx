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
            "Parfois, il suffit d'une rencontre pour changer de route."
          </p>
          <p>
            Motard de Cœur n'est pas né dans un garage, ni autour d'un plan
            marketing. Tout a commencé par une rencontre inattendue, sur un
            site de rencontre tout ce qu'il y a de plus classique. Elle était
            passionnée de moto. Moi, pas du tout.
          </p>
          <p>
            Au fil des conversations, des sourires et des récits de routes
            qu'elle avait avalées, quelque chose a changé. Sa passion est
            devenue contagieuse. Ce que je voyais comme une simple machine
            bruyante est devenu une promesse : celle d'une liberté que je
            n'avais jamais osé m'offrir.
          </p>
          <p>
            Un matin, j'ai franchi le pas. Inscription au permis moto. Et puis
            ce geste que je n'oublierai jamais : <strong className="text-primary">elle m'a offert mon premier casque</strong>.
            Pas un cadeau ordinaire — une déclaration silencieuse, une façon de
            me dire <em>"viens, la route nous attend"</em>. Premiers tours de
            roues maladroits, premier frisson, premier vrai sentiment de
            liberté. Puis, très vite, la première vraie balade à deux — elle
            devant, moi derrière, avant de rouler côte à côte, sur la même
            route.
          </p>
          <p>
            De cette belle histoire est née une évidence : les plus belles
            rencontres ne se font pas sur des applis génériques. Elles se font
            entre passionnés, ou grâce à des passionnés capables de transmettre
            leur feu. <strong className="text-primary">Motard de Cœur</strong>{" "}
            est né pour ça — offrir à d'autres la rencontre qui les fera, eux
            aussi, enfourcher leur première moto, ou trouver la personne avec
            qui partager la prochaine route.
          </p>
          <p className="text-xl text-foreground font-display italic">
            Parce qu'au fond, <em>la route rapproche les cœurs</em>.
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
