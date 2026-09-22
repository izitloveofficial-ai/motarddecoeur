import type { SVGProps } from "react";

export function IntercomIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M30 48 C30 28, 46 16, 60 16 C74 16, 90 28, 90 48" strokeWidth="2.1" />
      <rect x="20" y="44" width="14" height="22" rx="6" />
      <rect x="86" y="44" width="14" height="22" rx="6" />
      <path d="M34 66 L34 72 Q34 78 40 78 L52 78" strokeWidth="1.8" />
      <circle cx="56" cy="78" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}
