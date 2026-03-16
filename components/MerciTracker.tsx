"use client";

// ============================================================
// components/MerciTracker.tsx
//
// Composant client invisible injecté dans app/merci/page.tsx
// (Server Component) pour envoyer l'événement PostHog
// subscription_started au chargement de la page de confirmation.
//
// La page /merci n'est atteinte qu'après un paiement Stripe
// réussi (success_url configuré dans /api/checkout).
// ============================================================

import { useEffect } from "react";
import posthog from "posthog-js";

export function MerciTracker() {
  useEffect(() => {
    posthog.capture("subscription_started");
  }, []);

  return null;
}
