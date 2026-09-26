import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  redirect,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import {
  PRELAUNCH_MODE,
  getSupabaseAuthCallbackTokens,
  isPathAllowedDuringPrelaunch,
} from "@/lib/prelaunch";
import { hasAppAccess } from "@/lib/require-admin";
import { supabase } from "@/lib/supabase";
import { createTikTokPixelScript } from "@/lib/tiktok-pixel";

import { SITE_URL } from "@/lib/site";
import { SplashScreen } from "@/components/SplashScreen";
const BRAND_LOGO_URL = `${SITE_URL}/favicon.png`;
const BRAND_NAME = "Motards de Cœur";
const TIKTOK_PIXEL_SCRIPT = createTikTokPixelScript();

// Capture and consume the callback once, at module initialization, before any
// route guard can race Supabase's automatic URL-session detection.
const SUPABASE_AUTH_CALLBACK_AT_PAGE_LOAD =
  typeof window !== "undefined" ? consumeSupabaseAuthCallback() : Promise.resolve(false);

async function consumeSupabaseAuthCallback() {
  const tokens = getSupabaseAuthCallbackTokens(window.location.hash);
  if (!tokens) return false;

  try {
    if (!supabase) return false;
    const { error } = await supabase.auth.setSession(tokens);
    return !error;
  } catch {
    return false;
  } finally {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cette page n'a pas pu se charger
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Une erreur est survenue. Vous pouvez réessayer ou revenir à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ location }) => {
    // The server cannot see URL fragments. A magic link initially aimed at a
    // prelaunch-blocked path is therefore redirected to /join while retaining
    // its Supabase tokens. Wait for the explicitly established session before
    // deciding whether the visitor belongs in the application.
    if (
      PRELAUNCH_MODE &&
      typeof window !== "undefined" &&
      location.pathname === "/join" &&
      (await SUPABASE_AUTH_CALLBACK_AT_PAGE_LOAD) &&
      supabase &&
      (await hasAppAccess(supabase))
    ) {
      throw redirect({ to: "/discover" });
    }

    if (PRELAUNCH_MODE && !isPathAllowedDuringPrelaunch(location.pathname)) {
      throw redirect({ to: "/join" });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#21191a" },
      { name: "google-site-verification", content: "5Lg-k1XSiTJJ6JnOTWlcwBMvSSgnn_9c4beUbvD6NAU" },
      { name: "msvalidate.01", content: "2A618F7267ED1C16ECD13B810EBAB33C" },
      { title: BRAND_NAME },
      { name: "author", content: BRAND_NAME },
      { property: "og:site_name", content: BRAND_NAME },
      { property: "og:type", content: "website" },
      { property: "og:image", content: BRAND_LOGO_URL },
      { property: "og:image:alt", content: "Logo Motards de Cœur" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: BRAND_LOGO_URL },
      { name: "twitter:image:alt", content: "Logo Motards de Cœur" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;800;900&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        children: TIKTOK_PIXEL_SCRIPT,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: BRAND_NAME,
              url: SITE_URL,
              logo: BRAND_LOGO_URL,
              image: BRAND_LOGO_URL,
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              url: SITE_URL,
              name: BRAND_NAME,
              description: "Communauté premium de rencontres et événements pour motards.",
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [showSplash, setShowSplash] = useState(true);
  const [renderSplash, setRenderSplash] = useState(true);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setShowSplash(false), 1000);
    const removeTimer = window.setTimeout(() => setRenderSplash(false), 1300);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      {renderSplash ? <SplashScreen isVisible={showSplash} /> : null}
    </QueryClientProvider>
  );
}
