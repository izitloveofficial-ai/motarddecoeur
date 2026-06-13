import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

const links = [
  { to: "/", label: "Accueil" },
  { to: "/profiles", label: "Membres" },
  { to: "/events", label: "Événements" },
  { to: "/community", label: "Communauté" },
  { to: "/premium", label: "Premium" },
  { to: "/about", label: "À propos" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 z-50 w-full bg-white border-b-2 border-primary/60 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-red" />
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 xl:py-2">
        <Link to="/" aria-label="Motards de Cœur - Accueil" className="group shrink-0">
          <BrandLogo
            className="transition-transform group-hover:scale-[1.02]"
            markClassName="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 xl:h-[72px] xl:w-[72px]"
            textClassName="text-base text-neutral-950 sm:text-lg md:text-xl xl:text-[1.65rem]"
          />
        </Link>

        <div className="hidden xl:flex items-center gap-5 2xl:gap-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-xs uppercase tracking-wider text-neutral-600 hover:text-neutral-900 transition-colors relative 2xl:text-sm"
              activeProps={{ className: "text-neutral-900" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <span className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-red" />
                  )}
                </>
              )}
            </Link>
          ))}
        </div>

        <div className="hidden xl:flex items-center gap-3">
          <Link to="/contact" className="px-4 py-2 text-sm text-neutral-700 hover:text-neutral-900 transition">
            Connexion bientôt disponible
          </Link>
          <Link to="/join" className="px-5 py-2.5 text-sm uppercase tracking-wider bg-gradient-red text-primary-foreground rounded-full hover:shadow-glow transition-all">
            Rejoindre
          </Link>
        </div>

        <button
          className="xl:hidden text-neutral-900"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="xl:hidden max-h-[calc(100vh-6rem)] overflow-y-auto bg-white border-t border-border/40 px-6 py-4 flex flex-col gap-3 animate-fade-in">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="py-2 text-sm uppercase tracking-wider text-neutral-700 hover:text-neutral-900"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/contact"
            onClick={() => setOpen(false)}
            className="py-2 text-sm text-neutral-700 hover:text-neutral-900"
          >
            Connexion bientôt disponible
          </Link>
          <Link
            to="/join"
            onClick={() => setOpen(false)}
            className="mt-2 text-center px-5 py-2.5 text-sm uppercase tracking-wider bg-gradient-red text-primary-foreground rounded-full"
          >
            Rejoindre
          </Link>
        </div>
      )}
    </header>
  );
}
