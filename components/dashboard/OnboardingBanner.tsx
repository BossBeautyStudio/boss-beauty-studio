"use client";

// ============================================================
// components/dashboard/OnboardingBanner.tsx
//
// Bannière de premier lancement — guide l'utilisatrice vers
// le module Planning pour maximiser l'effet "wow" immédiat.
//
// Affiché uniquement à la première visite (localStorage).
// Disparaît définitivement après clic sur "Générer" ou ✕.
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "bbs_onboarded";

export function OnboardingBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setShow(true);
      }
    } catch {
      // localStorage bloqué (mode privé strict) — on n'affiche rien
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // non critique
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="mb-6 flex items-start gap-4 rounded-[14px] px-5 py-4"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--accent)",
        boxShadow: "0 2px 12px rgba(181,122,140,0.12)",
      }}
    >
      {/* Icône */}
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ backgroundColor: "var(--surface-alt)" }}
      >
        🗓️
      </div>

      {/* Texte */}
      <div className="flex-1">
        <p
          className="mb-1 text-sm font-semibold"
          style={{ color: "var(--text)" }}
        >
          Par où commencer ?
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          On te recommande de démarrer avec le{" "}
          <span className="font-semibold" style={{ color: "var(--text)" }}>
            Planning Instagram
          </span>{" "}
          — 7 posts pour toute la semaine, générés en quelques secondes.
        </p>
        <Link
          href="/dashboard/planning"
          onClick={dismiss}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: "var(--accent)" }}
        >
          Générer mon planning
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="mt-0.5 shrink-0 text-sm transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)", opacity: 0.4 }}
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>
  );
}
