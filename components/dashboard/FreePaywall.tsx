"use client";

// ============================================================
// components/dashboard/FreePaywall.tsx
//
// Composants de conversion essai gratuit → abonnement.
//
// Logique par état :
//   isFree=false                 → aucun composant ne s'affiche.
//   isFree=true, remaining > 0   → compteur discret + nudge doux post-résultat.
//   isFree=true, remaining === 0 → paywall complet avec bénéfices + CTA fort.
// ============================================================

import { useState, useEffect } from "react";
import posthog from "posthog-js";

const CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL ?? "/login";

// ── Bénéfices produit ─────────────────────────────────────────────────────────

const BENEFITS = [
  "Des posts qui attirent des clientes — générés en 30 secondes",
  "Planning hebdomadaire, carrousels, accroches, réponses DM — tout inclus",
  "Contenu 100 % adapté à ta spécialité beauté, prêt à copier-coller",
] as const;

// ── Modal paywall ─────────────────────────────────────────────────────────────

function PaywallModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-[20px]"
        style={{
          backgroundColor: "var(--bg)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative px-6 pt-6 pb-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-sm transition-opacity hover:opacity-70"
            style={{ backgroundColor: "var(--surface-alt)", color: "var(--text-muted)" }}
            aria-label="Fermer"
          >
            ✕
          </button>

          <div
            className="mb-4 flex h-11 w-11 items-center justify-center rounded-full text-xl"
            style={{ backgroundColor: "var(--surface-alt)" }}
          >
            ✨
          </div>

          <h3
            className="mb-1.5 text-base font-semibold leading-snug"
            style={{ color: "var(--text)" }}
          >
            Continue à créer du contenu qui attire des clientes.
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Tu as utilisé tes générations gratuites. L&apos;abonnement donne accès
            à tous les modules, sans limite, sans interruption.
          </p>
        </div>

        {/* Bénéfices */}
        <div className="px-6 py-4">
          <ul className="flex flex-col gap-2.5">
            {BENEFITS.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2.5 text-sm"
                style={{ color: "var(--text)" }}
              >
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div
          className="px-6 pb-6"
          style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}
        >
          <a
            href={CHECKOUT_URL}
            className="btn btn-primary"
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              fontSize: "0.9375rem",
              padding: "0.75rem 1.5rem",
            }}
          >
            Continuer à créer du contenu →
          </a>
          <p className="mt-2.5 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            29€/mois · Accès immédiat · Sans engagement
          </p>
        </div>
      </div>
    </div>
  );
}

// ── FreeTrialBanner — compteur discret ────────────────────────────────────────

interface FreeTrialBannerProps {
  freeRemaining: number;
}

/**
 * Bandeau compact affiché au-dessus du formulaire pour les utilisateurs en essai.
 * Discret et non-agressif — simple compteur avec lien d'abonnement.
 * Disparaît si freeRemaining <= 0 (PaywallBanner prend le relais côté résultats).
 */
export function FreeTrialBanner({ freeRemaining }: FreeTrialBannerProps) {
  if (freeRemaining <= 0) return null;

  const isLast = freeRemaining === 1;

  return (
    <div
      className="mb-5 flex items-center justify-between gap-3 rounded-[10px] px-3.5 py-2.5"
      style={{
        backgroundColor: isLast ? "var(--surface)" : "var(--surface-alt)",
        border: isLast ? "1px solid var(--accent)" : "1px solid var(--border)",
      }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {isLast ? (
          <>
            ⚠️{" "}
            <span className="font-semibold" style={{ color: "var(--accent)" }}>
              Dernière génération gratuite
            </span>{" "}
            — abonne-toi pour continuer sans interruption.
          </>
        ) : (
          <>
            ✨ Essai gratuit ·{" "}
            <span className="font-semibold" style={{ color: "var(--text)" }}>
              {freeRemaining} génération{freeRemaining > 1 ? "s" : ""} restante{freeRemaining > 1 ? "s" : ""}
            </span>
          </>
        )}
      </p>
      <a
        href={CHECKOUT_URL}
        className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-85"
        style={{ backgroundColor: "var(--accent)" }}
      >
        S&apos;abonner
      </a>
    </div>
  );
}

// ── CopyButton avec logique paywall ──────────────────────────────────────────

interface CopyButtonProps {
  text: string;
  label?: string;
  isFree: boolean;
  freeRemaining: number;
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
      <button
        type="button"
        onClick={handleClick}
        className={className ?? "btn btn-secondary"}
        style={isBlocked ? { opacity: 0.6, cursor: "pointer" } : undefined}
      >
        {isBlocked ? (
          <span className="flex items-center gap-1.5">🔒 {label}</span>
        ) : copied ? (
          "✓ Copié !"
        ) : (
          label
        )}
      </button>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </>
  );
}

// ── PaywallBanner ─────────────────────────────────────────────────────────────

interface PaywallBannerProps {
  freeRemaining: number;
}

/**
 * Bannière affichée sous le résultat après chaque génération gratuite.
 *
 * freeRemaining > 0  → Célébration du contenu créé + soft nudge (1 clic pour voir l'offre)
 * freeRemaining === 0 → Paywall complet avec bénéfices, transition émotionnelle, CTA fort
 */
export function PaywallBanner({ freeRemaining }: PaywallBannerProps) {
  useEffect(() => {
    if (freeRemaining === 0) {
      posthog.capture("paywall_shown", { source: "result_banner" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cas 1 : génération réussie, encore du quota gratuit ──────────────────
  if (freeRemaining > 0) {
    return (
      <div
        className="mt-4 rounded-[12px] px-5 py-4"
        style={{
          backgroundColor: "var(--surface-alt)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
          ✨ Ton contenu est prêt à publier !
        </p>
        <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Il te reste{" "}
          <span className="font-semibold" style={{ color: "var(--accent)" }}>
            {freeRemaining} génération{freeRemaining > 1 ? "s" : ""} gratuite{freeRemaining > 1 ? "s" : ""}
          </span>
          . Abonne-toi pour créer du contenu chaque semaine, sans jamais être bloquée.
        </p>
        <a
          href={CHECKOUT_URL}
          className="text-sm font-semibold"
          style={{ color: "var(--accent)" }}
        >
          Voir l&apos;offre — 29€/mois →
        </a>
      </div>
    );
  }

  // ── Cas 2 : quota épuisé — paywall complet avec transition ───────────────
  return (
    <div
      className="mt-4 overflow-hidden rounded-[18px]"
      style={{
        border: "1px solid var(--accent)",
        boxShadow: "0 4px 24px rgba(181,122,140,0.15)",
      }}
    >
      <div
        className="px-5 py-5"
        style={{ backgroundColor: "var(--surface)" }}
      >
        {/* Transition émotionnelle */}
        <p
          className="mb-1.5 text-base font-semibold leading-snug"
          style={{ color: "var(--text)" }}
        >
          ✨ Tu viens de créer du contenu prêt à publier.
        </p>
        <p
          className="mb-5 text-sm leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Imagine ce même niveau de contenu chaque semaine — sans passer des
          heures à chercher quoi écrire ou comment le formuler.
        </p>

        {/* Bénéfices */}
        <ul className="mb-5 flex flex-col gap-2.5">
          {BENEFITS.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2.5 text-sm"
              style={{ color: "var(--text)" }}
            >
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={CHECKOUT_URL}
          className="btn btn-primary"
          style={{
            display: "inline-flex",
            fontSize: "0.9375rem",
            padding: "0.7rem 1.5rem",
          }}
        >
          Continuer à créer du contenu →
        </a>
        <p className="mt-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
          29€/mois · Accès immédiat · Annulation en 1 clic
        </p>
      </div>
    </div>
  );
}
