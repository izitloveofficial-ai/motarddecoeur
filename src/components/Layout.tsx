import { type ReactNode, useEffect } from "react";

import { Navbar } from "./Navbar";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { MobileTabBar } from "./MobileTabBar";
import { registerForPushNotifications } from "@/lib/push";

export function Layout({ children }: { children: ReactNode }) {
  useEffect(() => {
    void registerForPushNotifications();
  }, []);
  return (
    <div className="app-shell min-h-screen flex flex-col">
      <Navbar />
      <AnnouncementBanner />
      <main className="app-main flex-1 pb-20 pt-24 sm:pb-0 sm:pt-28 md:pt-32 xl:pt-36">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
