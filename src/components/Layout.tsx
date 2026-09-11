import { type ReactNode, useEffect } from "react";

import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { registerForPushNotifications } from "@/lib/push";

export function Layout({ children }: { children: ReactNode }) {
  useEffect(() => {
    void registerForPushNotifications();
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 md:pt-32 xl:pt-36">{children}</main>
      <Footer />
    </div>
  );
}
