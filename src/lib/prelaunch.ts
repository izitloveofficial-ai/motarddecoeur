/**
 * Mode pré-lancement fermé.
 *
 * Passer PRELAUNCH_MODE à `false` le jour du lancement officiel :
 * toutes les pages du site redeviennent alors accessibles normalement.
 */
export const PRELAUNCH_MODE = true;

/** Chemins accessibles pendant le mode pré-lancement. */
export const PRELAUNCH_ALLOWED_PATHS = [
  "/join",
  "/mentions-legales",
  "/confidentialite",
  "/conditions-utilisation",
  "/admin/login",
  "/admin/preinscriptions",
  "/admin/members",
  "/admin/reports",
  "/signup",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/profile/setup",
  "/discover",
  "/matches",
  "/rides",
];

export function isPathAllowedDuringPrelaunch(pathname: string) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return PRELAUNCH_ALLOWED_PATHS.includes(clean) || clean.startsWith("/messages/");
}
