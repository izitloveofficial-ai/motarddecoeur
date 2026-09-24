import { Link } from "@tanstack/react-router";
import { CardsIcon } from "@/components/icons/CardsIcon";
import { HeartFilledIcon } from "@/components/icons/HeartFilledIcon";
import { HelmetIcon } from "@/components/icons/HelmetIcon";
import { IntercomIcon } from "@/components/icons/IntercomIcon";
import { useAdminStatus } from "@/hooks/use-admin-status";

const tabs = [
  { to: "/discover", label: "Rencontres", icon: CardsIcon },
  { to: "/matches", label: "Coup de cœur", icon: HeartFilledIcon },
  { to: "/messages", label: "Discussion", icon: IntercomIcon },
  { to: "/profile/setup", label: "Profil", icon: HelmetIcon },
] as const;

export function MobileTabBar() {
  const isAdmin = useAdminStatus();
  if (!isAdmin) return null;

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
            activeOptions={{ exact: true }}
            className="flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium text-[#a99b95] no-underline transition-colors"
            activeProps={{ className: "text-[#e8be6c]" }}
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
