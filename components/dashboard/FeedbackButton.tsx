"use client";

// ============================================================
// components/dashboard/FeedbackButton.tsx
//
// Bouton feedback fixe en bas à droite du dashboard.
// Ouvre une modal avec un textarea (max 1000 chars).
// Envoie un POST /api/feedback → email vers feedback@bossbeautystudio.site
// Toast inline après envoi réussi (aucune dépendance externe).
// ============================================================

import { useState, useEffect, useRef } from "react";

const MAX_CHARS = 1000;

interface FeedbackButtonProps {
  userEmail: string;
}

export function FeedbackButton({ userEmail }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [showToast, setShowToast] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus textarea quand la modal s'ouvre
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Fermer avec Échap
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Nettoyer le timer toast au démontage
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function handleClose() {
    if (status === "sending") return;
    setIsOpen(false);
    // Reset différé pour éviter le flash
    setTimeout(() => {
      setMessage("");
      setStatus("idle");
    }, 300);
  }

  function triggerToast() {
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3500);
  }

  async function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed || status === "sending") return;

    setStatus("sending");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erreur serveur");
      }

      setStatus("success");
      triggerToast();

      // Fermer la modal après un court délai
      setTimeout(() => handleClose(), 1800);
    } catch {
      setStatus("error");
    }
  }

  const charsLeft = MAX_CHARS - message.length;
  const isOverLimit = charsLeft < 0;
  const canSubmit =
    message.trim().length > 0 && !isOverLimit && status !== "sending";

  return (
    <>
      {/* ── Bouton fixe ───────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-100"
        style={{
          bottom: "1.5rem",
          right: "1.5rem",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        }}
        aria-label="Envoyer un feedback"
      >
        💬 Feedback
      </button>

      {/* ── Overlay + Modal ───────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div
            className="slide-up w-full overflow-hidden rounded-[20px]"
            style={{
              maxWidth: "480px",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
          >
            {/* En-tête */}
            <div
              className="flex items-start justify-between px-6 pt-6 pb-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "var(--accent)" }}
                >
                  Feedback
                </p>
                <h2
                  id="feedback-title"
                  className="text-base font-semibold leading-snug"
                  style={{ color: "var(--text)", maxWidth: "320px" }}
                >
                  Comment pouvons-nous améliorer Boss Beauty Studio ?
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={status === "sending"}
                className="ml-4 shrink-0 rounded-full p-1.5 transition-colors hover:bg-gray-100"
                style={{ color: "var(--text-muted)" }}
                aria-label="Fermer"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Corps */}
            <div className="px-6 py-5">
              {status === "success" ? (
                /* État succès */
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <span className="text-4xl">🙏</span>
                  <p
                    className="text-base font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    Merci pour ton retour !
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    On prend en compte chaque suggestion pour améliorer l&apos;outil.
                  </p>
                </div>
              ) : (
                /* Formulaire */
                <>
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="Suggestion, bug rencontré, fonctionnalité souhaitée..."
                    rows={5}
                    maxLength={MAX_CHARS + 50} // on gère côté UI
                    disabled={status === "sending"}
                    className="w-full resize-none rounded-[12px] px-4 py-3 text-sm leading-relaxed outline-none transition-all"
                    style={{
                      backgroundColor: "var(--bg)",
                      border: isOverLimit
                        ? "1.5px solid #cc4444"
                        : "1.5px solid var(--border)",
                      color: "var(--text)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = isOverLimit
                        ? "#cc4444"
                        : "var(--accent)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = isOverLimit
                        ? "#cc4444"
                        : "var(--border)")
                    }
                  />

                  {/* Compteur de caractères */}
                  <div className="mt-1.5 flex items-center justify-between">
                    <div>
                      {status === "error" && (
                        <p className="text-xs" style={{ color: "#cc4444" }}>
                          Une erreur est survenue. Réessaie dans quelques secondes.
                        </p>
                      )}
                    </div>
                    <p
                      className="text-xs tabular-nums"
                      style={{
                        color: isOverLimit ? "#cc4444" : "var(--text-muted)",
                      }}
                    >
                      {message.length} / {MAX_CHARS}
                    </p>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Envoyé depuis{" "}
                      <span className="font-medium" style={{ color: "var(--text)" }}>
                        {userEmail}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className="btn btn-primary shrink-0"
                      style={{
                        fontSize: "0.875rem",
                        padding: "0.5rem 1.25rem",
                        opacity: canSubmit ? 1 : 0.5,
                        cursor: canSubmit ? "pointer" : "not-allowed",
                      }}
                    >
                      {status === "sending" ? "Envoi…" : "Envoyer →"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────── */}
      <div
        className="fixed z-50 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg transition-all"
        style={{
          bottom: "5rem",
          right: "1.5rem",
          backgroundColor: "var(--accent)",
          color: "#fff",
          transform: showToast ? "translateY(0)" : "translateY(12px)",
          opacity: showToast ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}
        role="status"
        aria-live="polite"
      >
        ✓ Feedback envoyé
      </div>
    </>
  );
}
