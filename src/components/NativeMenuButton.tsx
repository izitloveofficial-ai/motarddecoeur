import { useEffect } from "react";
import { Menu } from "lucide-react";
import { useIsNativeApp } from "@/lib/native";
import { nativeMenu } from "@/lib/native-menu";

/**
 * Bouton « trois traits » à placer à droite de la ligne de titre d'une page.
 * N'apparaît que dans l'application mobile ; le site web n'est pas modifié.
 */
export function NativeMenuButton() {
  const native = useIsNativeApp();

  useEffect(() => {
    if (!native) return;
    return nativeMenu.addSlot();
  }, [native]);

  if (!native) return null;

  return (
    <button
      type="button"
      onClick={() => nativeMenu.toggle()}
      aria-label="Menu"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#d6a85c]/50 bg-[#181112]/90 text-[#fff9f0] shadow-md"
    >
      <Menu aria-hidden="true" />
    </button>
  );
}
