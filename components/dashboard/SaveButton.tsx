"use client";

// ============================================================
// components/dashboard/SaveButton.tsx
//
// Bouton "Sauvegarder dans la bibliothèque" — réutilisable
// dans tous les modules (Post, Carrousel, Hooks, DM).
//
// États :
//   idle    → "Sauvegarder"
//   saving  → "Sauvegarde…"
//   saved   → "✓ Sauvegardé" + bouton Annuler
//   error   → "Erreur — réessayer" (revient à idle après 3s)
//
// Props :
//   module  — module source ("post" | "carousel" | "hooks" | "dm")
//   title   — titre affiché dans la bibliothèque
//   content — output à sauvegarder (objet structuré)
//   params  — inputs du formulaire (optionnel, pour la bibliothèque)
// ============================================================

import { useState } from "react";

type SaveModule = "post" | "carousel" | "hooks" | "dm" | "story" | "reel";

interface SaveButtonProps {
  module: SaveModule;
  title: string;
  content: Record<string, unknown>;
  params?: Record<string, unknown>;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function SaveButton({ module: mod, title, content, params }: SaveButtonProps) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedId, setSavedId] = useState<string | null>(null);

  // ── Sauvegarder ────────────────────────────────────────────
  async function handleSave() {
    if (status === "saving" || status === "saved") return;
    setStatus("saving");

    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: mod, title, content, params }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      const body = await res.json();
      setSavedId(body.id ?? null);
      setStatus("saved");
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  // ── Annuler la sauvegarde ───────────────────────────────────
  async function handleUnsave() {
    if (!savedId) {
      setStatus("idle");
      return;
    }

    try {
      await fetch(`/api/library?id=${encodeURIComponent(savedId)}`, {
        method: "DELETE",
      });
    } catch {
      // silently ignore — on remet à idle dans tous les cas
    } finally {
      setSavedId(null);
      setStatus("idle");
    }
  }

  // ── Rendu ───────────────────────────────────────────────────

  if (status === "saved") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        {/* Badge sauvegardé */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            borderRadius: "var(--radius)",
            padding: "0.35rem 0.75rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            backgroundColor: "var(--surface-alt)",
            border: "1px solid var(--border)",
            color: "var(--accent)",
          }}
        >
          {/* Icône bookmark plein */}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          Sauvegardé
        </span>

        {/* Lien Annuler */}
        <button
          type="button"
          onClick={handleUnsave}
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          Annuler
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <button
        type="button"
        disabled
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          borderRadius: "var(--radius)",
          padding: "0.35rem 0.85rem",
          fontSize: "0.8rem",
          fontWeight: 500,
          backgroundColor: "var(--surface-alt)",
          border: "1px solid var(--border)",
          color: "#cc4444",
          cursor: "default",
        }}
      >
        Erreur — réessayer dans 3s
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={status === "saving"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        borderRadius: "var(--radius)",
        padding: "0.35rem 0.85rem",
        fontSize: "0.8rem",
        fontWeight: 500,
        backgroundColor: "var(--surface-alt)",
        border: "1px solid var(--border)",
        color: status === "saving" ? "var(--text-muted)" : "var(--text)",
        cursor: status === "saving" ? "default" : "pointer",
        transition: "all 0.15s",
      }}
    >
      {/* Icône bookmark */}
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {status === "saving" ? "Sauvegarde…" : "Sauvegarder"}
    </button>
  );
}
