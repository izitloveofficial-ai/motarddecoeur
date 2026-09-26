import { BrandLogo } from "@/components/BrandLogo";

type SplashScreenProps = {
  isVisible: boolean;
};

export function SplashScreen({ isVisible }: SplashScreenProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-[#21191a] transition-opacity duration-300 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
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
