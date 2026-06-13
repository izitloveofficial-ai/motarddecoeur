import { Bike, Heart } from "lucide-react";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

export function BrandLogo({ className = "", markClassName = "", textClassName = "" }: BrandLogoProps) {
  return (
    <span className={`flex shrink-0 items-center gap-3 ${className}`}>
      <span
        aria-hidden="true"
        className={`relative grid shrink-0 place-items-center border border-neutral-300 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-800 shadow-md ring-1 ring-primary/30 ${markClassName}`}
        style={{ clipPath: "polygon(50% 0%, 90% 14%, 84% 74%, 50% 100%, 16% 74%, 10% 14%)" }}
      >
        <Bike className="h-[48%] w-[48%] text-neutral-100" strokeWidth={2.2} />
        <Heart className="absolute bottom-[18%] right-[18%] h-[22%] w-[22%] fill-primary text-primary" strokeWidth={2} />
      </span>
      <span className={`font-display font-bold uppercase leading-none tracking-wide ${textClassName}`}>
        Motards<br />de Cœur
      </span>
    </span>
  );
}
