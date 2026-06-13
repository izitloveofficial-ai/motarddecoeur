import { Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-border/40 bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <div className="mb-4">
            <BrandLogo
              markClassName="h-14 w-14 sm:h-16 sm:w-16"
              textClassName="text-xl text-foreground sm:text-2xl"
            />
          </div>
          <p className="text-muted-foreground max-w-md mb-6 italic">
            "La route rapproche les cœurs."
          </p>
          <div className="flex gap-2 max-w-sm">
            <input
              type="email"
              placeholder="Pré-inscription via la page dédiée"
              disabled
              className="flex-1 px-4 py-3 bg-input/40 border border-border rounded-full text-sm text-muted-foreground disabled:cursor-not-allowed focus:outline-none"
            />
            <Link
              to="/join"
              className="px-4 py-3 bg-gradient-red rounded-full text-primary-foreground hover:shadow-glow transition"
              aria-label="Aller à la pré-inscription"
            >
              <Send className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-widest text-foreground mb-4">Communauté</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/join" className="hover:text-primary transition">Pré-inscription</Link></li>
            <li><Link to="/profiles" className="hover:text-primary transition">Membres</Link></li>
            <li><Link to="/events" className="hover:text-primary transition">Événements</Link></li>
            <li><Link to="/community" className="hover:text-primary transition">Forums</Link></li>
            <li><Link to="/premium" className="hover:text-primary transition">Premium</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-widest text-foreground mb-4">Réseaux sociaux</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Les comptes officiels seront ajoutés ici après confirmation, avant une communication publique plus large.
          </p>
        </div>
      </div>
      <div className="border-t border-border/40 py-6 px-6 text-center text-xs text-muted-foreground tracking-wider">
        <div>© {new Date().getFullYear()} Motards de Cœur — Find someone who shares your road.</div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 normal-case tracking-normal">
          <Link to="/confidentialite" className="hover:text-primary transition">Politique de confidentialité</Link>
          <Link to="/mentions-legales" className="hover:text-primary transition">Mentions légales</Link>
          <Link to="/conditions-utilisation" className="hover:text-primary transition">Conditions d'utilisation</Link>
        </div>
      </div>
    </footer>
  );
}
