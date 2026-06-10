import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

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
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 xl:py-4">
        <Link to="/" className="flex min-w-0 items-center gap-3 group xl:gap-4">
          <img
            src={logo}
            alt="Motard de Cœur"
            width={140}
            height={140}
            className="h-20 w-20 shrink-0 object-contain transition-transform group-hover:scale-105 drop-shadow-lg md:h-24 md:w-24 xl:h-28 xl:w-28"
          />

          <div className="flex min-w-0 flex-col leading-tight">
            <span className="font-display text-xl tracking-wider text-neutral-900 sm:text-2xl">
              Motard de <span className="text-primary">Cœur</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.24em] text-neutral-500 sm:tracking-[0.3em]">
              Ride · Connect · Feel
            </span>
          </div>
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
          <Link to="/profiles" className="px-5 py-2.5 text-sm uppercase tracking-wider bg-gradient-red text-primary-foreground rounded-full hover:shadow-glow transition-all">
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
            to="/profiles"
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
