import { useEffect } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import logoOfficiel from "@/assets/logo-officiel.webp";
import motoPassage from "@/assets/moto-passage.mp3";
import { useIsNativeApp } from "@/lib/native";

/** Traits de lumière qui traversent l'écran quand la moto « passe » (position, retard). */
const STREAKS = [
  { top: "42%", delay: "1.47s" },
  { top: "51%", delay: "1.57s" },
  { top: "58%", delay: "1.68s" },
] as const;

/**
 * Ouverture de l'application mobile : sur fond sombre, des traits de lumière
 * traversent l'écran pendant qu'une moto passe (son de 4 s), puis le logo officiel
 * surgit dans un éclat de lumière, et l'écran s'efface. Si le téléphone refuse
 * de lancer le son tout seul, l'animation se déroule simplement sans bruit.
 */
function NativeSplash() {
  useEffect(() => {
    const sound = new Audio(motoPassage);
    sound.volume = 0.9;
    sound.play().catch(() => {});
    return () => sound.pause();
  }, []);

  return (
    <div
      className="animate-splash-native-hide pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#1a1112]"
      aria-hidden="true"
    >
      <span className="splash-line absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#ffd9a0] to-transparent shadow-[0_0_14px_3px_rgba(200,40,58,0.6)]" />
      {STREAKS.map((streak) => (
        <span
          key={streak.top}
          className="splash-streak absolute left-0 h-[3px] w-[85%] rounded-full bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_10px_2px_rgba(255,214,150,0.7)]"
          style={{ top: streak.top, animationDelay: streak.delay }}
        />
      ))}
      <div className="splash-logo relative h-56 w-56 overflow-hidden rounded-[2rem] bg-white sm:h-64 sm:w-64">
        <img
          src={logoOfficiel}
          alt=""
          width={512}
          height={512}
          className="h-full w-full object-cover"
          decoding="async"
        />
        <span className="splash-shine absolute inset-y-0 left-0 w-[14%] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      </div>
    </div>
  );
}

export function SplashScreen() {
  const native = useIsNativeApp();

  if (native) return <NativeSplash />;

  return (
    <div
      className="animate-splash-auto-hide pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-[#21191a]"
      aria-hidden="true"
    >
      <BrandLogo
        className="animate-splash-pulse flex-col gap-4 text-center"
        markClassName="h-28 w-28 sm:h-32 sm:w-32"
        textClassName="text-xl text-white sm:text-2xl"
      />
    </div>
  );
}
