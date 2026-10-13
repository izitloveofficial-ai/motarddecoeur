import { BrandLogo } from "@/components/BrandLogo";
import logoOfficiel from "@/assets/logo-officiel.webp";
import { useIsNativeApp } from "@/lib/native";

export function SplashScreen() {
  const native = useIsNativeApp();

  if (native) {
    // Application mobile : le logo officiel apparaît, brille, puis l'écran s'efface.
    return (
      <div
        className="animate-splash-native-hide pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1112]"
        aria-hidden="true"
      >
        <div className="animate-splash-logo-in relative">
          <div className="animate-splash-glow relative h-56 w-56 overflow-hidden rounded-[2rem] bg-white sm:h-64 sm:w-64">
            <img
              src={logoOfficiel}
              alt=""
              width={512}
              height={512}
              className="h-full w-full object-cover"
              decoding="async"
            />
            <span className="animate-splash-shine absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          </div>
        </div>
      </div>
    );
  }

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
