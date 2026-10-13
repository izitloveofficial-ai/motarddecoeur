import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

/**
 * Appel à l'action en forme de casque de moto : le message est écrit sur la visière
 * et le bouton se trouve sous la visière, là où l'on soulève le casque.
 */
export function HelmetCta({
  title,
  subtitle,
  label,
  onClick,
}: {
  title: [string, string];
  subtitle: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-full bg-[radial-gradient(circle,rgba(123,32,39,0.45)_0%,transparent_65%)] blur-2xl"
        aria-hidden="true"
      />
      <h2 className="sr-only">{title.join(" ")}</h2>
      <svg viewBox="0 0 400 420" className="w-full drop-shadow-2xl" aria-hidden="true">
        <defs>
          <linearGradient id="helmet-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--ember)" }} />
            <stop offset="55%" style={{ stopColor: "var(--primary)" }} />
            <stop offset="100%" style={{ stopColor: "var(--blood)" }} />
          </linearGradient>
          <linearGradient id="helmet-visor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a1d1f" />
            <stop offset="100%" stopColor="#0f0b0c" />
          </linearGradient>
        </defs>
        {/* Coque */}
        <path
          d="M52 235 C52 110 128 36 200 36 C272 36 348 110 348 235 L348 330 C348 372 316 396 274 396 L126 396 C84 396 52 372 52 330 Z"
          fill="url(#helmet-shell)"
        />
        {/* Reflet sur le dessus */}
        <path
          d="M104 150 C118 92 160 62 205 58"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.22"
          strokeWidth="9"
          strokeLinecap="round"
        />
        {/* Liseré doré */}
        <path d="M52 300 L348 300" stroke="#e2b45f" strokeOpacity="0.55" strokeWidth="3" />
        {/* Visière */}
        <path
          d="M82 150 C82 124 112 108 200 108 C288 108 318 124 318 150 L318 236 C318 258 288 268 200 268 C112 268 82 258 82 236 Z"
          fill="url(#helmet-visor)"
          stroke="#e2b45f"
          strokeOpacity="0.6"
          strokeWidth="3"
        />
        <path d="M118 112 L158 112 L116 266 L88 266 Z" fill="#fff" fillOpacity="0.06" />
        {/* Message sur la visière */}
        <g textAnchor="middle" className="font-display">
          <text x="200" y="168" fontSize="25" fill="#f6d98d">
            {title[0]}
          </text>
          <text x="200" y="202" fontSize="25" fill="#f6d98d" fontStyle="italic">
            {title[1]}
          </text>
          <text x="200" y="238" fontSize="13" fill="#d8cbc4" letterSpacing="1.5">
            {subtitle.toUpperCase()}
          </text>
        </g>
        {/* Languette pour soulever la visière */}
        <rect
          x="172"
          y="262"
          width="56"
          height="14"
          rx="7"
          fill="#1a1415"
          stroke="#e2b45f"
          strokeOpacity="0.6"
          strokeWidth="2"
        />
        {/* Aérations de la mentonnière */}
        <g stroke="#0f0b0c" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round">
          <path d="M82 328 L106 328" />
          <path d="M82 346 L106 346" />
          <path d="M294 328 L318 328" />
          <path d="M294 346 L318 346" />
        </g>
      </svg>
      <Link
        to="/join"
        onClick={onClick}
        className="group absolute left-1/2 top-[73%] inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-background px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground shadow-lg ring-1 ring-[#e2b45f]/60 transition hover:scale-105 sm:px-6 sm:text-sm"
      >
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
