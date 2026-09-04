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
];

export function isPathAllowedDuringPrelaunch(pathname: string) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return PRELAUNCH_ALLOWED_PATHS.includes(clean);
}
