"use client";

// ============================================================
// components/dashboard/FreePaywall.tsx
//
// Overlay paywall affiché sur le bouton Copier quand l'utilisatrice
// a épuisé ses 3 générations gratuites sans abonnement.
//
// Usage :
//   <CopyButton text="…" isFree={true} freeRemaining={0} />
//
// isFree=false → bouton copie normal.
// isFree=true && freeRemaining > 0 → copie normale + badge "N essai(s) restant(s)".
// isFree=true && freeRemaining === 0 → clic ouvre la modal paywall.
// ============================================================

import { useState, useEffect } from "react";
import posthog from "posthog-js";

const CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL ?? "/login";

// ── Modal paywall ─────────────────────────────────────────────────────────────

function PaywallModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-[20px] p-8"
        style={{
          backgroundColor: "var(--bg)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fermer */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-sm transition-opacity hover:opacity-70"
          style={{
            backgroundColor: "var(--surface-alt)",
            color: "var(--text-muted)",
          }}
          aria-label="Fermer"
        >
          ✕
        </button>

        {/* Icône */}
        <div
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-full text-2xl"
          style={{ backgroundColor: "var(--surface-alt)" }}
        >
          ✨
        </div>

        {/* Titre */}
        <h3
          className="mb-2 text-lg font-semibold leading-snug"
          style={{ color: "var(--text)" }}
        >
          Débloque Boss Beauty Studio pour générer des posts illimités.
        </h3>

        {/* Sous-texte */}
        <p
          className="mb-6 text-sm leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Tu as utilisé tes 3 générations gratuites. L&apos;abonnement te donne
          accès à tous les modules — planning 30 jours, carrousel, accroches Instagram,
          réponses DM — sans limite.
        </p>

        {/* Features rapides */}
        <ul className="mb-6 flex flex-col gap-2">
          {[
            "Planning Instagram — 30 posts complets",
            "Posts, carrousels, accroches Instagram, réponses DM",
            "Contenu 100 % adapté à ta spécialité",
            "Annulation en 1 clic, sans engagement",
          ].map((f) => (
            <li
              key={f}
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text)" }}
            >
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={CHECKOUT_URL}
          className="btn btn-primary"
          style={{
            width: "100%",
            display: "flex",
            fontSize: "0.9375rem",
            padding: "0.75rem 1.5rem",
          }}
        >
          S&apos;abonner — 29€/mois →
        </a>

        <p
          className="mt-3 text-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Paiement sécurisé · Sans engagement · Accès immédiat
        </p>
      </div>
    </div>
  );
}

// ── FreeTrialBanner — bandeau pré-formulaire ──────────────────────────────────

interface FreeTrialBannerProps {
  freeRemaining: number;
}

/**
 * Bandeau compact affiché AU-DESSUS du formulaire pour les utilisateurs en essai.
 * Disparaît si freeRemaining <= 0 (PaywallBanner prend le relais dans les résultats).
 */
export function FreeTrialBanner({ freeRemaining }: FreeTrialBannerProps) {
  if (freeRemaining <= 0) return null;
  const isLast = freeRemaining === 1;

  return (
    <div
      className="mb-6 flex items-center justify-between gap-4 rounded-[12px] px-4 py-3"
      style={{
        backgroundColor: isLast ? "var(--surface)" : "var(--surface-alt)",
        border: isLast ? "1px solid var(--accent)" : "1px solid var(--border)",
      }}
    >
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {isLast && "⚠️ "}
        <span
          className="font-medium"
          style={{ color: isLast ? "var(--accent)" : "var(--text)" }}
        >
          {freeRemaining} génération{freeRemaining > 1 ? "s" : ""} gratuite
          {freeRemaining > 1 ? "s" : ""} restante{freeRemaining > 1 ? "s" : ""}
        </span>
      </p>
      <a
        href={CHECKOUT_URL}
        className="shrink-0 text-xs font-semibold"
        style={{ color: "var(--accent)" }}
      >
        S&apos;abonner →
      </a>
    </div>
  );
}

// ── CopyButton avec logique paywall ──────────────────────────────────────────

interface CopyButtonProps {
  text: string;            // texte à copier
  label?: string;          // libellé du bouton (défaut : "Copier")
  isFree: boolean;         // true si génération gratuite
  freeRemaining: number;   // générations gratuites restantes
  className?: string;
}

export function CopyButton({
  text,
  label = "Copier",
  isFree,
  freeRemaining,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Copie bloquée si gratuit ET plus de quota
  const isBlocked = isFree && freeRemaining <= 0;

  function handleClick() {
    if (isBlocked) {
      posthog.capture("paywall_shown", { source: "copy_block" });
      setShowPaywall(true);
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <div className="relative inline-flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={handleClick}
          className={className ?? "btn btn-secondary"}
          style={
            isBlocked
              ? { opacity: 0.6, cursor: "pointer" }
              : undefined
          }
        >
          {isBlocked ? (
            <span className="flex items-center gap-1.5">
              🔒 {label}
            </span>
          ) : copied ? (
            "✓ Copié !"
          ) : (
            label
          )}
        </button>

        {/* Badge "N génération(s) restante(s)" pour les utilisateurs en essai */}
        {isFree && freeRemaining > 0 && (
          <span
            className="text-[10px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            {freeRemaining} génération{freeRemaining > 1 ? "s" : ""} gratuite{freeRemaining > 1 ? "s" : ""} restante{freeRemaining > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </>
  );
}

// ── PaywallBanner — bandeau discret sous le résultat ─────────────────────────

interface PaywallBannerProps {
  freeRemaining: number;
}

export function PaywallBanner({ freeRemaining }: PaywallBannerProps) {
  // Capture PostHog une seule fois quand la bannière paywall dure s'affiche
  useEffect(() => {
    if (freeRemaining === 0) {
      posthog.capture("paywall_shown", { source: "result_banner" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (freeRemaining > 0) {
    return (
      <div
        className="mt-4 rounded-[12px] px-4 py-3 text-sm"
        style={{
          backgroundColor: "var(--surface-alt)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        Il te reste{" "}
        <span className="font-medium" style={{ color: "var(--accent)" }}>
          {freeRemaining} génération{freeRemaining > 1 ? "s" : ""} gratuite{freeRemaining > 1 ? "s" : ""}
        </span>
        . Abonne-toi pour générer sans limite et accéder à tous les modules.
      </div>
    );
  }

  return (
    <div
      className="mt-4 overflow-hidden rounded-[14px]"
      style={{ border: "1px solid var(--accent)", boxShadow: "0 4px 16px rgba(181,122,140,0.12)" }}
    >
      <div
        className="px-5 py-4"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
          Débloque Boss Beauty Studio pour générer des posts illimités.
        </p>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Tu as utilisé tes 3 générations gratuites. L&apos;abonnement donne accès à tous les modules sans limite.
        </p>
        <a
          href={CHECKOUT_URL}
          className="btn btn-primary"
          style={{ fontSize: "0.875rem", padding: "0.6rem 1.25rem" }}
        >
          S&apos;abonner — 29€/mois →
        </a>
      </div>
    </div>
  );
}
