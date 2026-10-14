import { useSyncExternalStore } from "react";

/**
 * État partagé du menu de l'application mobile.
 * - `open` : le menu plein écran est ouvert.
 * - `slots` : nombre de boutons « trois traits » intégrés à l'en-tête d'une page.
 *   Tant qu'il y en a un, le bouton flottant n'est pas affiché (pas de chevauchement).
 */
type NativeMenuState = { open: boolean; slots: number };

let state: NativeMenuState = { open: false, slots: 0 };
const listeners = new Set<() => void>();

function update(next: Partial<NativeMenuState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const nativeMenu = {
  setOpen(open: boolean) {
    update({ open });
  },
  toggle() {
    update({ open: !state.open });
  },
  addSlot() {
    update({ slots: state.slots + 1 });
    return () => update({ slots: Math.max(0, state.slots - 1) });
  },
};

export function useNativeMenu(): NativeMenuState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}
