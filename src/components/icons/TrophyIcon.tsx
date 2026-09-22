import type { SVGProps } from "react";

type TrophyTier = "bronze" | "silver" | "gold";

const COLORS: Record<TrophyTier, { fill: string; stroke: string }> = {
  bronze: { fill: "#cd7f32", stroke: "#8a5427" },
  silver: { fill: "#c7ccd1", stroke: "#8d9aa3" },
  gold: { fill: "#ffd23f", stroke: "#c99400" },
};

export function TrophyIcon({ tier, ...props }: { tier: TrophyTier } & SVGProps<SVGSVGElement>) {
  const { fill, stroke } = COLORS[tier];

  return (
    <svg viewBox="0 0 44 60" aria-hidden="true" {...props}>
      <path
        d="M4 4 L38 4 L36 34 C36 50, 25 58, 21 58 C17 58, 6 50, 6 34 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 8 C-8 8, -8 26, 6 28"
        fill="none"
        stroke={stroke}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <path
        d="M38 8 C50 8, 50 26, 36 28"
        fill="none"
        stroke={stroke}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <rect x="17" y="58" width="8" height="12" fill={stroke} />
      <rect x="7" y="70" width="28" height="7" rx="2" fill={stroke} />
    </svg>
  );
}
