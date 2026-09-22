import type { SVGProps } from "react";

export function HelmetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 80 62"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M40 4 C58 4, 72 18, 72 36 C72 46, 66 54, 58 58 L22 58 C14 54, 8 46, 8 36 C8 18, 22 4, 40 4 Z" />
      <rect x="14" y="30" width="52" height="18" rx="6" />
      <line x1="8" y1="36" x2="14" y2="36" strokeWidth="1.6" />
      <line x1="72" y1="36" x2="66" y2="36" strokeWidth="1.6" />
    </svg>
  );
}
