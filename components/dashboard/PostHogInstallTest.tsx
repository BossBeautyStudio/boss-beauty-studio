"use client";

// ============================================================
// components/dashboard/PostHogInstallTest.tsx
//
// Composant client invisible qui capture l'événement de test
// PostHog une seule fois quand le dashboard est chargé.
// Peut être retiré une fois l'installation validée dans PostHog.
// ============================================================

import { useEffect } from "react";
import posthog from "posthog-js";

export function PostHogInstallTest() {
  useEffect(() => {
    posthog.capture("posthog_installation_test", {
      page: "dashboard_home",
      timestamp: new Date().toISOString(),
    });
  }, []);

  return null;
}
