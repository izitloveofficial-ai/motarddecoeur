type BrandLogoProps = {
  className?: string;
  textClassName?: string;
};

export function BrandLogo({ className = "", textClassName = "" }: BrandLogoProps) {
  return (
    <span className={`inline-flex shrink-0 items-center ${className}`} aria-label="Motards de Cœur">
      <span className={`font-display font-bold leading-none tracking-wide ${textClassName}`}>
        MOTARDS DE CŒUR
      </span>
    </span>
  );
}
