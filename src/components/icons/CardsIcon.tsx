import type { SVGProps } from "react";

export function CardsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 60 60"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect
        x="12"
        y="8"
        width="40"
        height="52"
        rx="6"
        transform="rotate(-8 32 34)"
        opacity="0.55"
      />
      <rect x="10" y="4" width="40" height="52" rx="6" />
      <line x1="18" y1="42" x2="42" y2="42" strokeWidth="1.6" />
      <line x1="18" y1="48" x2="34" y2="48" strokeWidth="1.6" />
    </svg>
  );
}
