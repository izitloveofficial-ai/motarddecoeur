import type { SVGProps } from "react";

export function WheelSpinIndicator(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
      {...props}
    >
      <circle cx="16" cy="16" r="13" strokeWidth={2} />
      <g opacity={0.65}>
        <line x1="16" y1="3" x2="16" y2="29" />
        <line x1="3" y1="16" x2="29" y2="16" />
        <line x1="6.2" y1="6.2" x2="25.8" y2="25.8" />
        <line x1="6.2" y1="25.8" x2="25.8" y2="6.2" />
      </g>
    </svg>
  );
}
