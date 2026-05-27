import { Link } from "@tanstack/react-router";
import { Heart, Instagram, Facebook, Youtube, Send } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-border/40 bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="grid place-items-center w-10 h-10 rounded-full bg-gradient-red shadow-glow">
              <Heart className="h-4 w-4 text-primary-foreground fill-current" />
            </div>
            <span className="font-display text-2xl text-gradient-metal">Motard de Cœur</span>
          </div>
          <p className="text-muted-foreground max-w-md mb-6 italic">
            "La route rapproche les cœurs."
          </p>
          <form className="flex gap-2 max-w-sm">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 px-4 py-3 bg-input/60 border border-border rounded-full text-sm focus:outline-none focus:ring-red-glow"
            />
            <button className="px-4 py-3 bg-gradient-red rounded-full text-primary-foreground hover:shadow-glow transition">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-widest text-foreground mb-4">Communauté</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/profiles" className="hover:text-primary transition">Membres</Link></li>
            <li><Link to="/events" className="hover:text-primary transition">Événements</Link></li>
            <li><Link to="/community" className="hover:text-primary transition">Forums</Link></li>
            <li><Link to="/premium" className="hover:text-primary transition">Premium</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-widest text-foreground mb-4">Suivez-nous</h4>
          <div className="flex gap-3">
            {[Instagram, Facebook, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid place-items-center w-10 h-10 rounded-full glass hover:bg-primary/20 hover:border-primary/50 transition"
                aria-label="social"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground tracking-wider">
        © {new Date().getFullYear()} Motard de Cœur — Find someone who shares your road.
      </div>
    </footer>
  );
}
