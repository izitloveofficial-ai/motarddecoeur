import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

/**
 * Appel à l'action en forme de motard casqué : le message est écrit sur la visière
 * et le bouton est placé sur le blouson, comme un écusson.
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
      <svg viewBox="0 0 400 500" className="w-full drop-shadow-2xl" aria-hidden="true">
        <defs>
          <linearGradient id="helmet-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--ember)" }} />
            <stop offset="55%" style={{ stopColor: "var(--primary)" }} />
            <stop offset="100%" style={{ stopColor: "var(--blood)" }} />
          </linearGradient>
          <linearGradient id="helmet-jacket" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a373c" />
            <stop offset="100%" stopColor="#1f1618" />
          </linearGradient>
          <linearGradient id="helmet-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--background)", stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: "var(--background)", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="helmet-visor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a1d1f" />
            <stop offset="100%" stopColor="#0f0b0c" />
          </linearGradient>
        </defs>
        {/* Buste du motard : blouson de cuir */}
        <path
          d="M0 500 L0 412 C0 352 60 320 132 308 L268 308 C340 320 400 352 400 412 L400 500 Z"
          fill="url(#helmet-jacket)"
        />
        <path d="M150 308 L200 364 L170 424 L108 332 Z" fill="#5a4448" />
        <path d="M250 308 L200 364 L230 424 L292 332 Z" fill="#5a4448" />
        <path
          d="M150 308 L200 364 L170 424"
          fill="none"
          stroke="#e2b45f"
          strokeOpacity="0.5"
          strokeWidth="2"
        />
        <path
          d="M250 308 L200 364 L230 424"
          fill="none"
          stroke="#e2b45f"
          strokeOpacity="0.5"
          strokeWidth="2"
        />
        <path
          d="M200 364 L200 500"
          stroke="#e2b45f"
          strokeOpacity="0.6"
          strokeWidth="3"
          strokeDasharray="4 5"
        />
        {/* Bandes sur les épaules */}
        <path
          d="M34 392 C60 346 98 324 134 316 L138 338 C108 348 82 366 62 402 Z"
          fill="var(--primary)"
        />
        <path
          d="M366 392 C340 346 302 324 266 316 L262 338 C292 348 318 366 338 402 Z"
          fill="var(--primary)"
        />
        <path
          d="M44 410 C66 372 100 350 138 342"
          fill="none"
          stroke="#e2b45f"
          strokeOpacity="0.7"
          strokeWidth="3"
        />
        <path
          d="M356 410 C334 372 300 350 262 342"
          fill="none"
          stroke="#e2b45f"
          strokeOpacity="0.7"
          strokeWidth="3"
        />
        {/* Cou et col du casque */}
        <path d="M148 292 L252 292 L262 316 L138 316 Z" fill="#150f10" />
        {/* Fondu en bas du buste */}
        <rect x="0" y="440" width="400" height="60" fill="url(#helmet-fade)" />
        <g transform="translate(40 14) scale(0.8)">
          {/* Coque : calotte large qui se resserre vers la mentonnière */}
          <path
            d="M200 22 C302 22 364 100 364 196 C364 240 356 270 340 296 C326 322 304 342 280 352 L120 352 C96 342 74 322 60 296 C44 270 36 240 36 196 C36 100 98 22 200 22 Z"
            fill="url(#helmet-shell)"
          />
          {/* Bande de course dorée */}
          <path d="M184 24 L216 24 L222 112 L178 112 Z" fill="#e2b45f" fillOpacity="0.85" />
          {/* Reflet sur la calotte */}
          <path
            d="M86 150 C96 96 138 58 178 50"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.25"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Visière */}
          <path
            d="M58 156 C58 128 92 110 200 110 C308 110 342 128 342 156 L342 226 C342 246 318 258 288 258 L112 258 C82 258 58 246 58 226 Z"
            fill="url(#helmet-visor)"
            stroke="#e2b45f"
            strokeOpacity="0.7"
            strokeWidth="3"
          />
          <path d="M110 114 L150 112 L112 256 L78 252 Z" fill="#fff" fillOpacity="0.07" />
          {/* Vis de la visière */}
          <circle
            cx="46"
            cy="196"
            r="9"
            fill="#2a1d1f"
            stroke="#e2b45f"
            strokeOpacity="0.7"
            strokeWidth="2"
          />
          <circle
            cx="354"
            cy="196"
            r="9"
            fill="#2a1d1f"
            stroke="#e2b45f"
            strokeOpacity="0.7"
            strokeWidth="2"
          />
          {/* Message sur la visière */}
          <g textAnchor="middle" className="font-display">
            <text x="200" y="168" fontSize="26" fill="#f6d98d">
              {title[0]}
            </text>
            <text x="200" y="203" fontSize="26" fill="#f6d98d" fontStyle="italic">
              {title[1]}
            </text>
            <text x="200" y="236" fontSize="12" fill="#d8cbc4" letterSpacing="1.5">
              {subtitle.toUpperCase()}
            </text>
          </g>
          {/* Languette pour soulever la visière */}
          <rect
            x="176"
            y="252"
            width="48"
            height="14"
            rx="7"
            fill="#1a1415"
            stroke="#e2b45f"
            strokeOpacity="0.7"
            strokeWidth="2"
          />
          {/* Ligne de la mentonnière et aération discrète */}
          <path
            d="M84 318 C120 346 280 346 316 318"
            fill="none"
            stroke="#000"
            strokeOpacity="0.25"
            strokeWidth="3"
          />
          <rect
            x="172"
            y="292"
            width="56"
            height="26"
            rx="12"
            fill="#150f10"
            stroke="#e2b45f"
            strokeOpacity="0.5"
            strokeWidth="2"
          />
          <g stroke="#e2b45f" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round">
            <path d="M186 300 L214 300" />
            <path d="M186 310 L214 310" />
          </g>
        </g>
      </svg>
      <Link
        to="/join"
        onClick={onClick}
        className="group absolute left-1/2 top-[80%] inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-background px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground shadow-lg ring-1 ring-[#e2b45f]/60 transition hover:scale-105 sm:px-6 sm:text-sm"
      >
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
