import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CardsIcon } from "@/components/icons/CardsIcon";
import { HeartFilledIcon } from "@/components/icons/HeartFilledIcon";
import { HelmetIcon } from "@/components/icons/HelmetIcon";
import { IntercomIcon } from "@/components/icons/IntercomIcon";
import { WheelSpinIndicator } from "@/components/icons/WheelSpinIndicator";
import { supabase } from "@/lib/supabase";

const tabs = [
  { to: "/discover", label: "Rencontres", icon: CardsIcon },
  { to: "/matches", label: "Coup de cœur", icon: HeartFilledIcon },
  { to: "/messages", label: "Discussion", icon: IntercomIcon },
  { to: "/profile/setup", label: "Profil", icon: HelmetIcon },
] as const;

export function MobileTabBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [justTapped, setJustTapped] = useState<{ tab: string; tap: number } | null>(null);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapSequenceRef = useRef(0);

  useEffect(
    () => () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    },
    [],
  );

  function handleTabTap(tab: string) {
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapSequenceRef.current += 1;
    setJustTapped({ tab, tap: tapSequenceRef.current });
    tapTimeoutRef.current = setTimeout(() => setJustTapped(null), 600);
  }

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isLoggedIn) return null;

  return (
    <nav
      aria-label="Navigation de l'application"
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-[#d6a85c]/30 bg-[#181112]/95 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur sm:hidden"
    >
      <div className="grid h-16 grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => handleTabTap(to)}
            activeOptions={{ exact: true }}
            className="flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium text-[#a99b95] no-underline transition-colors"
            activeProps={{ className: "text-[#e8be6c]" }}
          >
            <span className="relative flex h-9 w-9 items-center justify-center">
              {justTapped?.tab === to && (
                <WheelSpinIndicator
                  key={justTapped.tap}
                  className="animate-wheel-spin-once absolute inset-0 z-0 m-auto h-9 w-9 text-[#e8be6c]"
                />
              )}
              <Icon className="relative z-10 h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
