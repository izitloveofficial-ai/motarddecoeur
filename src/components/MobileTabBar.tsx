import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CardsIcon } from "@/components/icons/CardsIcon";
import { DoubleHeartIcon } from "@/components/icons/DoubleHeartIcon";
import { HeartFilledIcon } from "@/components/icons/HeartFilledIcon";
import { HelmetIcon } from "@/components/icons/HelmetIcon";
import { IntercomIcon } from "@/components/icons/IntercomIcon";
import { supabase } from "@/lib/supabase";

const tabs = [
  { to: "/discover", label: "Rencontres", icon: CardsIcon },
  { to: "/matches", label: "Coup de cœur", icon: HeartFilledIcon },
  { to: "/messages", label: "Discussion", icon: IntercomIcon },
  { to: "/profile/setup", label: "Profil", icon: HelmetIcon },
] as const;

export function MobileTabBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [remainingSuperLikes, setRemainingSuperLikes] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;

    async function loadRemainingSuperLikes(userId: string | undefined) {
      setRemainingSuperLikes(null);
      if (!supabase || !userId) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", userId)
        .maybeSingle();

      if (profileError || profile?.is_premium !== true) return;

      const { data: sentToday, error: quotaError } = await supabase.rpc("super_likes_sent_today");

      if (!quotaError && typeof sentToday === "number") {
        setRemainingSuperLikes(Math.max(0, 3 - sentToday));
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
      void loadRemainingSuperLikes(data.session?.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
      void loadRemainingSuperLikes(session?.user.id);
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
        {tabs.map(({ to, label, icon: Icon }) =>
          label === "Profil" ? (
            <div
              key={to}
              className="flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium text-[#a99b95]"
            >
              <span className="flex items-center gap-2">
                <Link
                  to={to}
                  activeOptions={{ exact: true }}
                  aria-label="Ouvrir mon profil"
                  className="text-inherit no-underline transition-colors"
                  activeProps={{ className: "text-[#e8be6c]" }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </Link>
                {remainingSuperLikes !== null && (
                  <Link
                    to="/super-likes/sent"
                    aria-label={`Voir mes Super coups de cœur envoyés, ${remainingSuperLikes} restant${remainingSuperLikes > 1 ? "s" : ""} aujourd'hui`}
                    title="Voir mes Super coups de cœur envoyés"
                    className="relative text-inherit no-underline transition-colors"
                    activeProps={{ className: "text-[#e8be6c]" }}
                  >
                    <DoubleHeartIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold leading-none text-primary-foreground">
                      {remainingSuperLikes}
                    </span>
                  </Link>
                )}
              </span>
              <Link
                to={to}
                activeOptions={{ exact: true }}
                className="truncate text-inherit no-underline transition-colors"
                activeProps={{ className: "text-[#e8be6c]" }}
              >
                {label}
              </Link>
            </div>
          ) : (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              className="flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium text-[#a99b95] no-underline transition-colors"
              activeProps={{ className: "text-[#e8be6c]" }}
            >
              <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              <span className="truncate">{label}</span>
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
