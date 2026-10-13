import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import motoImg from "@/assets/moto-logo.webp";

const RIDE_DURATION_MS = 900;

/**
 * Appel à l'action : la moto du logo est garée à gauche d'une route en pointillés.
 * Au clic sur le bouton, elle file vers lui, puis on arrive sur la pré-inscription.
 */
export function RideCta({
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
  const navigate = useNavigate();
  const [riding, setRiding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.();
    // Clic avec modificateur (nouvel onglet…) ou animations réduites : lien normal, sans animation.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    if (riding) return;
    setRiding(true);
    timer.current = setTimeout(() => void navigate({ to: "/join" }), RIDE_DURATION_MS);
  }

  return (
    <div className="mx-auto w-full max-w-3xl text-center">
      <h2 className="font-display text-3xl leading-tight sm:text-5xl">
        {title[0]} <span className="text-gradient-red italic">{title[1]}</span>
      </h2>
      <p className="mt-3 text-sm uppercase tracking-[0.25em] text-[#f1d493]">{subtitle}</p>

      <div className="mt-10 flex items-end gap-3 [--bike-w:6.5rem] sm:gap-6 sm:[--bike-w:11rem]">
        <div className="relative h-24 flex-1 sm:h-36">
          <div
            className="absolute inset-x-0 bottom-3 border-t-2 border-dashed border-[#e2b45f]/40"
            aria-hidden="true"
          />
          {/* Traînées de vitesse pendant le démarrage */}
          <div
            className={`absolute bottom-10 left-0 space-y-2 transition-opacity duration-300 sm:bottom-14 ${riding ? "opacity-100" : "opacity-0"}`}
            aria-hidden="true"
          >
            <div className="h-0.5 w-8 rounded bg-[#f6d98d]/60" />
            <div className="ml-3 h-0.5 w-10 rounded bg-[#f6d98d]/40" />
            <div className="h-0.5 w-6 rounded bg-[#f6d98d]/30" />
          </div>
          <img
            src={motoImg}
            alt=""
            aria-hidden="true"
            width={720}
            height={388}
            loading="lazy"
            decoding="async"
            className={`absolute bottom-3 h-auto w-[var(--bike-w)] drop-shadow-[0_6px_18px_rgba(255,255,255,0.12)] transition-[left,transform] duration-[900ms] ease-in ${riding ? "-rotate-2" : ""}`}
            style={{ left: riding ? "calc(100% - var(--bike-w))" : "0px" }}
          />
        </div>
        <Link
          to="/join"
          onClick={handleClick}
          className="group mb-1 inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-gradient-red px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground shadow-glow transition hover:scale-105 sm:mb-3 sm:px-7 sm:py-4 sm:text-sm"
        >
          {label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
