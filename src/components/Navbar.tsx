import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { supabase } from "@/lib/supabase";

const links = [
  { to: "/", label: "Accueil" },
  { to: "/about", label: "À propos" },
  { to: "/contact", label: "Contact" },
] as const;

const appLinks = [
  { to: "/discover", label: "Rencontres" },
  { to: "/matches", label: "Coups de cœur" },
  { to: "/rides", label: "Balades" },
  { to: "/events", label: "Événements" },
  { to: "/community", label: "Communauté" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    function loadAccountStatus(session: { user: { id: string } } | null) {
      if (!session || !supabase) {
        setIsAdmin(false);
        setIsPremium(false);
        return;
      }

      void supabase
        .rpc("is_admin")
        .then(({ data: adminResult }) => setIsAdmin(adminResult === true));
      void supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", session.user.id)
        .maybeSingle()
        .then(({ data: profile }) => setIsPremium(profile?.is_premium === true));
    }

    supabase.auth.getSession().then(({ data }) => {
      loadAccountStatus(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      loadAccountStatus(session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full bg-white border-b-2 border-primary/60 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-red" />
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 xl:py-2">
        <Link
          to="/"
          aria-label="Motards de Cœur - Accueil"
          className="group shrink-0 text-inherit no-underline"
        >
          <BrandLogo
            className="transition-transform group-hover:scale-[1.02]"
            markClassName="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 xl:h-[72px] xl:w-[72px]"
            textClassName="text-base text-neutral-950 sm:text-lg md:text-xl xl:text-[1.65rem]"
          />
        </Link>

        <div className="hidden xl:flex items-center gap-4 2xl:gap-6">
          <div className="flex items-center gap-4 2xl:gap-6">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="relative text-xs uppercase tracking-wider text-neutral-600 no-underline transition-colors hover:text-neutral-900 2xl:text-sm"
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

          {isAdmin && (
            <div className="flex flex-col gap-1 border-l border-neutral-200 pl-4 2xl:pl-6">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400">
                Application
              </span>
              <div className="flex items-center gap-3 2xl:gap-4">
                {appLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="relative whitespace-nowrap text-xs uppercase tracking-wider text-neutral-600 no-underline transition-colors hover:text-neutral-900"
                    activeProps={{ className: "text-neutral-900" }}
                  >
                    {({ isActive }) => (
                      <>
                        {l.label}
                        {isActive && (
                          <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-red" />
                        )}
                      </>
                    )}
                  </Link>
                ))}
                <Link
                  to="/premium"
                  className="relative whitespace-nowrap text-xs uppercase tracking-wider text-neutral-600 no-underline transition-colors hover:text-neutral-900"
                  activeProps={{ className: "text-neutral-900" }}
                >
                  {({ isActive }) => (
                    <>
                      Mon forfait · {isPremium ? "Premium" : "Basique"}
                      {isActive && (
                        <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-red" />
                      )}
                    </>
                  )}
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="hidden xl:flex items-center gap-3">
          <Link
            to="/join"
            className="px-5 py-2.5 text-sm uppercase tracking-wider bg-gradient-red text-primary-foreground no-underline rounded-full hover:shadow-glow transition-all"
          >
            Pré-inscription gratuite
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
              className="py-2 text-sm uppercase tracking-wider text-neutral-700 no-underline hover:text-neutral-900"
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <div className="mt-1 flex flex-col gap-1 border-t border-neutral-200 pt-3">
              <span className="pb-1 text-xs uppercase tracking-widest text-neutral-400">
                Application
              </span>
              {appLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="py-2 text-sm uppercase tracking-wider text-neutral-700 no-underline hover:text-neutral-900"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/premium"
                onClick={() => setOpen(false)}
                className="py-2 text-sm uppercase tracking-wider text-neutral-700 no-underline hover:text-neutral-900"
              >
                Mon forfait · {isPremium ? "Premium" : "Basique"}
              </Link>
            </div>
          )}
          <Link
            to="/join"
            onClick={() => setOpen(false)}
            className="mt-2 text-center px-5 py-2.5 text-sm uppercase tracking-wider bg-gradient-red text-primary-foreground no-underline rounded-full"
          >
            Pré-inscription gratuite
          </Link>
        </div>
      )}
    </header>
  );
}
