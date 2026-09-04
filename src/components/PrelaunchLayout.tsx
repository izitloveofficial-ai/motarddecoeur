import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { BrandLogo } from "./BrandLogo";

export function PrelaunchLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex justify-center px-6 pt-8 pb-2 sm:pt-10">
        <BrandLogo
          markClassName="h-14 w-14 sm:h-16 sm:w-16"
          textClassName="text-lg sm:text-xl text-foreground"
        />
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-[#b3a49d]">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link to="/mentions-legales" className="hover:text-primary">
            Mentions légales
          </Link>
          <Link to="/confidentialite" className="hover:text-primary">
            Politique de confidentialité
          </Link>
          <Link to="/conditions-utilisation" className="hover:text-primary">
            Conditions d’utilisation
          </Link>
        </nav>
        <p className="mt-4">© {new Date().getFullYear()} Motards de Cœur</p>
      </footer>
    </div>
  );
}
