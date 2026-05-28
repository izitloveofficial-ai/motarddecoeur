import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { MessageCircle, Users, MapPin, Flame, Heart, Share2 } from "lucide-react";
import community from "@/assets/community-ride.jpg";
import w1 from "@/assets/profile-woman.jpg";
import m1 from "@/assets/profile-man.jpg";
import w2 from "@/assets/profile-woman2.jpg";
import m2 from "@/assets/profile-man2.jpg";
import bike from "@/assets/bike-dark.jpg";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Communauté — Motard de Cœur" },
      { name: "description", content: "Groupes, forums, ride planning et expériences partagées entre motards passionnés." },
      { property: "og:title", content: "Communauté — Motard de Cœur" },
      { property: "og:description", content: "Rejoignez les groupes Harley, sport, touring et custom, suivez le feed de la tribu et planifiez vos rides avec une vraie communauté de motards passionnés." },
      { property: "og:url", content: "/community" },
    ],
    links: [{ rel: "canonical", href: "/community" }],
  }),
  component: Community,
});

const GROUPS = [
  { name: "Harley Riders France", members: 12400, img: bike, tag: "Cruiser" },
  { name: "Sport Bike Addicts", members: 8900, img: community, tag: "Sport" },
  { name: "Custom & Café Racer", members: 5600, img: bike, tag: "Custom" },
  { name: "Touring Europe", members: 7800, img: community, tag: "Touring" },
];

const POSTS = [
  { user: "Sophie L.", img: w1, time: "il y a 2h", text: "Première sortie matinale dans les Cévennes. La brume, le soleil qui perce, le vrombissement... pure magie ✨", likes: 142, comments: 28, photo: community },
  { user: "Marc D.", img: m1, time: "il y a 5h", text: "Qui est partant pour un trackday à Magny-Cours le 15 ? On peut covoiturer depuis Paris.", likes: 67, comments: 41 },
  { user: "Camille R.", img: w2, time: "hier", text: "Mon nouveau projet custom prend forme. Bientôt les photos finales 🔥", likes: 234, comments: 56, photo: bike },
  { user: "Antoine V.", img: m2, time: "il y a 2j", text: "10 ans de Harley aujourd'hui. Merci à cette communauté pour les rencontres incroyables.", likes: 412, comments: 89 },
];

function Community() {
  return (
    <Layout>
      <section className="py-16 px-6 border-b border-border/40">
        <div className="mx-auto max-w-7xl">
          <span className="text-primary uppercase tracking-[0.4em] text-xs">Tribu</span>
          <h1 className="font-display text-5xl md:text-7xl mt-4 mb-4">La <span className="text-gradient-red italic">communauté</span> avant tout.</h1>
          <p className="text-muted-foreground max-w-2xl text-lg">Groupes, discussions, plans de rides. Chaque jour, des milliers de motards partagent leur passion.</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-3xl mb-8 flex items-center gap-3"><Flame className="text-primary" /> Groupes populaires</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {GROUPS.map((g, i) => (
              <article key={i} className="group relative aspect-[4/5] rounded-2xl overflow-hidden hover-lift cursor-pointer">
                <img src={g.img} alt={g.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-overlay" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="glass-red px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">{g.tag}</span>
                  <h3 className="font-display text-2xl mt-3 mb-1">{g.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {g.members.toLocaleString()} membres</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-display text-3xl flex items-center gap-3"><MessageCircle className="text-primary" /> Feed de la tribu</h2>

            {POSTS.map((p, i) => (
              <article key={i} className="glass rounded-2xl p-6 hover-lift">
                <header className="flex items-center gap-3 mb-4">
                  <img src={p.img} alt={p.user} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30" loading="lazy" />
                  <div>
                    <div className="font-medium">{p.user}</div>
                    <div className="text-xs text-muted-foreground">{p.time}</div>
                  </div>
                </header>
                <p className="text-foreground/90 mb-4 leading-relaxed">{p.text}</p>
                {p.photo && (
                  <img src={p.photo} alt="" className="rounded-xl mb-4 w-full max-h-80 object-cover" loading="lazy" />
                )}
                <div className="flex items-center gap-6 text-sm text-muted-foreground border-t border-border/40 pt-4">
                  <button className="flex items-center gap-2 hover:text-primary transition"><Heart className="h-4 w-4" /> {p.likes}</button>
                  <button className="flex items-center gap-2 hover:text-primary transition"><MessageCircle className="h-4 w-4" /> {p.comments}</button>
                  <button className="flex items-center gap-2 hover:text-primary transition ml-auto"><Share2 className="h-4 w-4" /> Partager</button>
                </div>
              </article>
            ))}
          </div>

          <aside className="space-y-8">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display text-xl mb-4 flex items-center gap-2"><MapPin className="text-primary h-5 w-5" /> Ride planning</h3>
              <ul className="space-y-4">
                {[
                  { name: "Pyrénées Loop", date: "Sam 14 Juin", joined: 12 },
                  { name: "Verdon Sunset", date: "Dim 22 Juin", joined: 8 },
                  { name: "Vosges Route", date: "Sam 5 Juil", joined: 18 },
                ].map((r, i) => (
                  <li key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.date}</div>
                    </div>
                    <span className="text-primary text-xs">+{r.joined} riders</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
              <img src={community} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-overlay" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-xs uppercase tracking-widest text-primary mb-2">Citation du jour</p>
                <p className="font-display text-2xl italic">"Quatre roues déplacent le corps, deux roues déplacent l'âme."</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
