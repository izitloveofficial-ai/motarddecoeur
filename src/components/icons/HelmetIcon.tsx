import type { SVGProps } from "react";

export function HelmetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 14a8 8 0 0 1 16 0v3a2 2 0 0 1-2 2h-2.5" />
      <path d="M4 14v2a2 2 0 0 0 2 2h2" />
      <path d="M8 18v1a1 1 0 0 0 1 1h2.5" />
      <path d="M9 12.5h6.5l2.5 2" />
      <path d="M20 15.5h1.5" />
    </svg>
  );
}
