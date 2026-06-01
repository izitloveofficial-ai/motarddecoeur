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
    <header className="fixed top-0 z-50 w-full bg-white border-b border-border/40 shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="Motard de Cœur"
            width={180}
            height={120}
            className="h-20 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-xl tracking-wider text-foreground">
              Motard de Cœur
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Ride · Connect · Feel
            </span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm uppercase tracking-wider text-neutral-600 hover:text-neutral-900 transition-colors relative"
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

        <div className="hidden lg:flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-neutral-700 hover:text-neutral-900 transition">
            Connexion
          </button>
          <button className="px-5 py-2.5 text-sm uppercase tracking-wider bg-gradient-red text-primary-foreground rounded-full hover:shadow-glow transition-all">
            Rejoindre
          </button>
        </div>

        <button
          className="lg:hidden text-neutral-900"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden bg-white border-t border-border/40 px-6 py-4 flex flex-col gap-3 animate-fade-in">
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
          <button className="mt-2 px-5 py-2.5 text-sm uppercase tracking-wider bg-gradient-red text-primary-foreground rounded-full">
            Rejoindre
          </button>
        </div>
      )}
    </header>
  );
}
