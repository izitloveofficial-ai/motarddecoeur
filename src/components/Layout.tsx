import type { ReactNode } from "react";

import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 md:pt-32 xl:pt-36">{children}</main>
      <Footer />
    </div>
  );
}
