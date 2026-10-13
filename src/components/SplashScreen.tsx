import { BrandLogo } from "@/components/BrandLogo";
import logoOfficiel from "@/assets/logo-officiel.webp";
import splashVideo from "@/assets/splash-moto.mp4";
import splashPoster from "@/assets/splash-moto-poster.jpg";
import { useIsNativeApp } from "@/lib/native";

export function SplashScreen() {
  const native = useIsNativeApp();

  if (native) {
    // Application mobile : courte vidéo de moto au coucher du soleil (muette),
    // puis le logo officiel apparaît en douceur avec un fin reflet.
    return (
      <div
        className="animate-splash-native-hide pointer-events-none fixed inset-0 z-[100] overflow-hidden bg-[#f6d483]"
        aria-hidden="true"
      >
        <video
          className="splash-video absolute inset-0 h-full w-full object-cover"
          src={splashVideo}
          poster={splashPoster}
          autoPlay
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="splash-logo relative h-56 w-56 overflow-hidden rounded-[2rem] bg-white shadow-[0_8px_48px_rgba(120,70,20,0.35)] sm:h-64 sm:w-64">
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
