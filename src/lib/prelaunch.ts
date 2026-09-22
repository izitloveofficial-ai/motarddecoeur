/**
 * Mode pré-lancement fermé.
 *
 * Passer PRELAUNCH_MODE à `false` le jour du lancement officiel :
 * toutes les pages du site redeviennent alors accessibles normalement.
 */
export const PRELAUNCH_MODE = true;

/** Chemins accessibles pendant le mode pré-lancement. */
export const PRELAUNCH_ALLOWED_PATHS = [
  "/sitemap.xml",
  "/join",
  "/about",
  "/mentions-legales",
  "/confidentialite",
  "/conditions-utilisation",
  "/admin/preinscriptions",
  "/admin/members",
  "/admin/reports",
  "/admin/announcements",
  "/admin/status",
  // These pages remain hidden behind their browser-side access guard.
  "/community",
  "/events",
  "/premium",
  "/profiles",
  "/signup",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/profile/setup",
  "/profile/blocked",
  "/discover",
  "/discover/likes",
  "/matches",
  "/matches/new",
  "/messages",
  "/rides",
];

export function isPathAllowedDuringPrelaunch(pathname: string) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return (
    PRELAUNCH_ALLOWED_PATHS.includes(clean) ||
    clean.startsWith("/messages/") ||
    clean.startsWith("/rdv/")
  );
}
