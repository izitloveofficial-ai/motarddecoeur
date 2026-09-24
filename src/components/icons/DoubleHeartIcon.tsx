import type { SVGProps } from "react";

export function DoubleHeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 68 62"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Cœur arrière, en haut à gauche */}
      <path d="M18 12 C10 2, -6 5, -6 17 C-6 27, 10 37, 18 44 C26 37, 42 27, 42 17 C42 5, 26 2, 18 12 Z" />
      {/* Cœur avant, décalé en bas à droite, recouvre partiellement le premier */}
      <path
        d="M38 20 C30 10, 14 13, 14 25 C14 35, 30 45, 38 52 C46 45, 62 35, 62 25 C62 13, 46 10, 38 20 Z"
        fill="#21191a"
      />
    </svg>
  );
}
