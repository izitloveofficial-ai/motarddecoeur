import { Link } from "@tanstack/react-router";
import { Instagram, Send } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export function Footer() {
  return (
    <footer className="safe-bottom relative mt-16 sm:mt-24 lg:mt-32 border-t border-border/40 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-16 md:grid-cols-4 md:gap-12">
        <div className="md:col-span-2">
          <div className="mb-4">
            <BrandLogo
              markClassName="h-14 w-14 sm:h-16 sm:w-16"
              textClassName="text-xl text-foreground sm:text-2xl"
            />
          </div>
          <p className="text-muted-foreground max-w-md mb-6">
            Rencontres, balades et communauté moto : rejoignez Motards de Cœur avant le lancement.
          </p>
          <div className="flex max-w-sm gap-2">
            <input
              type="email"
              placeholder="Pré-inscription gratuite"
              disabled
              className="min-w-0 flex-1 px-4 py-3 text-base sm:text-sm bg-input/40 border border-border rounded-full text-muted-foreground disabled:cursor-not-allowed focus:outline-none"
            />
            <Link
              to="/join"
              className="grid min-h-11 min-w-11 place-items-center px-4 py-3 bg-gradient-red rounded-full text-primary-foreground hover:shadow-glow transition"
              aria-label="Se pré-inscrire gratuitement"
            >
              <Send className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-widest text-foreground mb-4">Communauté</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/join" className="hover:text-primary transition">
                Pré-inscription
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm uppercase tracking-widest text-foreground mb-4">
            Réseaux sociaux
          </h4>
          <div className="flex items-center gap-3">
            <a
              href="https://www.tiktok.com/@motardsdecoeur"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Motards de Cœur sur TikTok"
              className="grid h-11 w-11 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                <path d="M16.6 5.82a4.85 4.85 0 0 1-1.2-3.2h-3.5v13.93a2.94 2.94 0 1 1-2.53-2.91V10.1a6.48 6.48 0 1 0 6.03 6.47V9.5a8.3 8.3 0 0 0 4.85 1.55V7.56a4.88 4.88 0 0 1-3.65-1.74Z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/motardsdecoeur/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Motards de Cœur sur Instagram"
              className="grid h-11 w-11 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/40 py-6 px-6 text-center text-xs text-muted-foreground tracking-wider">
        <div>
          © {new Date().getFullYear()} Motards de Cœur — Trouvez quelqu'un qui partage votre route.
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 normal-case tracking-normal">
          <Link to="/confidentialite" className="hover:text-primary transition">
            Politique de confidentialité
          </Link>
          <Link to="/mentions-legales" className="hover:text-primary transition">
            Mentions légales
          </Link>
          <Link to="/conditions-utilisation" className="hover:text-primary transition">
            Conditions d'utilisation
          </Link>
        </div>
      </div>
    </footer>
  );
}
