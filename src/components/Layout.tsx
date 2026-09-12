import { type ReactNode, useEffect } from "react";

import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { registerForPushNotifications } from "@/lib/push";

export function Layout({ children }: { children: ReactNode }) {
  useEffect(() => {
    void registerForPushNotifications();
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AnnouncementBanner />
      <main className="flex-1 pt-28 md:pt-32 xl:pt-36">{children}</main>
      <Footer />
    </div>
  );
}
