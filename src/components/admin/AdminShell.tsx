import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type AdminLink = {
  to: "/admin/members" | "/admin/preinscriptions" | "/admin/reports" | "/admin/announcements";
  label: string;
};

const ADMIN_LINKS: AdminLink[] = [
  { to: "/admin/members", label: "Voir les membres" },
  { to: "/admin/preinscriptions", label: "Voir les pré-inscriptions" },
  { to: "/admin/reports", label: "Voir les signalements" },
  { to: "/admin/announcements", label: "Gérer les annonces" },
];

/** Cadre commun des pages d'administration : en-tête, message d'état et liens de navigation. */
export function AdminShell({
  title,
  description,
  maxWidth = "max-w-7xl",
  current,
  children,
}: {
  title: string;
  description?: string;
  maxWidth?: string;
  current: AdminLink["to"];
  children: ReactNode;
}) {
  const links = ADMIN_LINKS.filter((link) => link.to !== current);
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className={`mx-auto ${maxWidth}`}>
        <p className="text-xs uppercase tracking-[.3em] text-primary">Administration privée</p>
        <h1 className="mt-2 font-display text-4xl">{title}</h1>
        {description && <p className="mt-3 text-sm text-muted-foreground">{description}</p>}
        {children}
        <nav aria-label="Navigation administration" className="mt-8 text-sm">
          {links.map((link, index) => (
            <span key={link.to}>
              {index > 0 && " · "}
              <Link to={link.to} className="text-primary hover:underline">
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </main>
  );
}

/** Message d'état (chargement, erreur, résultat) annoncé aux lecteurs d'écran. */
export function AdminNotice({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-xl border border-primary/30 p-3" role="status">
      {message}
    </p>
  );
}
