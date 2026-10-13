import { BrandLogo } from "@/components/BrandLogo";
import logoOfficiel from "@/assets/logo-officiel.webp";
import { useIsNativeApp } from "@/lib/native";

export function SplashScreen() {
  const native = useIsNativeApp();

  if (native) {
    // Application mobile : une route de nuit, deux phares qui approchent,
    // un éclair de lumière, puis le logo officiel apparaît.
    return (
      <div
        className="animate-splash-native-hide pointer-events-none fixed inset-0 z-[100] overflow-hidden bg-[#120a0b]"
        aria-hidden="true"
      >
        <svg
          className="splash-road absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="splash-road-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#120a0b" />
              <stop offset="1" stopColor="#2b1d20" />
            </linearGradient>
          </defs>
          <polygon points="50,42 -25,100 125,100" fill="url(#splash-road-fill)" />
          <line
            x1="50"
            y1="42"
            x2="-25"
            y2="100"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.35"
          />
          <line
            x1="50"
            y1="42"
            x2="125"
            y2="100"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.35"
          />
        </svg>
        {[0, 0.2, 0.4, 0.6, 0.8].map((delay) => (
          <span
            key={delay}
            className="splash-dash absolute left-1/2 top-[42%] h-10 w-1.5 rounded-sm bg-white/70"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
        <span className="splash-lamp-left absolute left-1/2 top-[42%] h-3.5 w-3.5 rounded-full bg-[radial-gradient(circle,#fff3d6_0%,rgba(255,243,214,0.85)_35%,rgba(255,243,214,0)_70%)]" />
        <span className="splash-lamp-right absolute left-1/2 top-[42%] h-3.5 w-3.5 rounded-full bg-[radial-gradient(circle,#fff3d6_0%,rgba(255,243,214,0.85)_35%,rgba(255,243,214,0)_70%)]" />
        <div className="splash-flash absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,240,215,0.95),rgba(255,240,215,0)_72%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="splash-logo h-56 w-56 overflow-hidden rounded-[2rem] bg-white sm:h-64 sm:w-64">
            <img
              src={logoOfficiel}
              alt=""
              width={512}
              height={512}
              className="h-full w-full object-cover"
              decoding="async"
            />
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
