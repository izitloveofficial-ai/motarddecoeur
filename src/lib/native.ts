import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";

/** Vrai quand le site tourne dans l'application iPhone / Android (Capacitor). */
export function isNativeApp(): boolean {
  try {
    return typeof window !== "undefined" && Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

const subscribe = () => () => {};

/**
 * Indique si on est dans l'application mobile.
 * Côté serveur et pendant l'hydratation du site web, la valeur est `false`,
 * donc le site web reste strictement identique.
 */
export function useIsNativeApp(): boolean {
  return useSyncExternalStore(subscribe, isNativeApp, () => false);
}

/** Durée d'affichage de l'écran d'ouverture, en millisecondes. */
export const SPLASH_WEB_MS = 1300;
export const SPLASH_NATIVE_MS = 3900;
