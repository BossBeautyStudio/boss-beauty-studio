"use client";

// ============================================================
// components/PostHogProvider.tsx
//
// Provider client qui initialise PostHog une seule fois,
// côté navigateur uniquement.
//
// Pourquoi ce composant est nécessaire :
//   app/layout.tsx est un Server Component dans Next.js App Router.
//   Un import de posthog-js dans un Server Component ne s'exécute
//   jamais côté client (window est undefined côté serveur).
//   Ce Provider "use client" garantit que posthog.init() est appelé
//   dans un useEffect, donc uniquement dans le navigateur.
//
// Capture automatique :
//   - capture_pageview: true   → chaque changement de route
// ============================================================

import { useEffect } from "react";
import posthog from "posthog-js";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!key) return;

    posthog.init(key, {
      api_host: host ?? "https://eu.i.posthog.com",
      capture_pageview: true,
      // Évite les doublons si le composant se remonte (React StrictMode)
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") {
          ph.opt_in_capturing();
        }
      },
    });
  }, []);

  return <>{children}</>;
}
