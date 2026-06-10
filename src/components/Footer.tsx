import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube, Send } from "lucide-react";
import logo from "@/assets/logo.png";

const socialLinks = [
  { href: "https://instagram.com/motarddecoeur", label: "Instagram", Icon: Instagram },
  { href: "https://facebook.com/motarddecoeur", label: "Facebook", Icon: Facebook },
  { href: "https://youtube.com/motarddecoeur", label: "YouTube", Icon: Youtube },
];

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-border/40 bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <img src={logo} alt="Motard de Cœur" width={56} height={56} loading="lazy" className="h-12 w-12 object-contain" />
            <span className="font-display text-2xl text-gradient-metal">Motard de Cœur</span>
          </div>
          <p className="text-muted-foreground max-w-md mb-6 italic">
            "La route rapproche les cœurs."
          </p>
          <div className="flex gap-2 max-w-sm">
            <input
              type="email"
              placeholder="Newsletter bientôt disponible"
              disabled
              className="flex-1 px-4 py-3 bg-input/40 border border-border rounded-full text-sm text-muted-foreground disabled:cursor-not-allowed focus:outline-none"
            />
            <a
              href="mailto:hello@motarddecoeur.fr"
              className="px-4 py-3 bg-gradient-red rounded-full text-primary-foreground hover:shadow-glow transition"
              aria-label="Contacter Motard de Cœur par email"
            >
              <Send className="h-4 w-4" />
            </a>
          </div>
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
            {socialLinks.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                className="grid place-items-center w-10 h-10 rounded-full glass hover:bg-primary/20 hover:border-primary/50 transition"
                aria-label={label}
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
