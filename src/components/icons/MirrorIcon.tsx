import type { SVGProps } from "react";

export function MirrorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 110"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <line x1="80" y1="70" x2="70" y2="100" strokeWidth="2.2" />
      <circle cx="68" cy="104" r="4" fill="currentColor" stroke="none" />
      <ellipse cx="94" cy="44" rx="30" ry="24" strokeWidth="2.2" />
      <ellipse cx="94" cy="44" rx="22" ry="17" strokeWidth="1.4" opacity="0.6" />
      <path
        d="M94 50 C86 44, 84 36, 90 32 C93 30, 94 33, 94 35 C94 33, 95 30, 98 32 C104 36, 102 44, 94 50 Z"
        fill="currentColor"
        stroke="none"
        opacity="0.85"
      />
    </svg>
  );
}
