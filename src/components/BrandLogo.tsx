import logoProvisoire from "../assets/logo-motards-de-coeur-provisoire.svg";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

export function BrandLogo({ className = "", markClassName = "", textClassName = "" }: BrandLogoProps) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-3 ${className}`} aria-label="Motards de Cœur">
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-neutral-200 ${markClassName}`}
      >
        <img
          src={logoProvisoire}
          alt="Motards de Cœur"
          className="h-full w-full object-contain"
          loading="eager"
          decoding="async"
        />
      </span>
      <span className={`font-display font-bold uppercase leading-none tracking-wide ${textClassName}`}>
        <span className="block">MOTARDS</span>
        <span className="block">DE CŒUR</span>
      </span>
    </span>
  );
}
