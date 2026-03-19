"use client";

// ============================================================
// app/(dashboard)/dashboard/library/page.tsx
//
// Bibliothèque de contenu — affiche les contenus sauvegardés
// depuis les modules Post, Carrousel, Hooks et DM.
//
// Fonctionnalités :
//   — Filtre par module (Tous / Post / Carrousel / Hooks / DM)
//   — Aperçu du contenu par type
//   — Copie rapide du contenu principal
//   — Suppression avec confirmation
//   — État vide avec CTA vers les modules
// ============================================================

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type SaveModule = "post" | "carousel" | "hooks" | "dm";

interface SavedItem {
  id: string;
  module: SaveModule;
  title: string;
  content: Record<string, unknown>;
  params: Record<string, unknown> | null;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MODULE_LABELS: Record<SaveModule, string> = {
  post: "Post Instagram",
  carousel: "Carrousel",
  hooks: "Accroches",
  dm: "Réponse DM",
};

const MODULE_ICONS: Record<SaveModule, string> = {
  post: "📸",
  carousel: "🖼️",
  hooks: "⚡",
  dm: "💬",
};

const MODULE_COLORS: Record<SaveModule, string> = {
  post: "#b57a8c",
  carousel: "#7a9cb5",
  hooks: "#b59a4a",
  dm: "#7ab58a",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Extraction du texte principal à copier selon le module ────────────────────

function getMainText(module: SaveModule, content: Record<string, unknown>): string {
  switch (module) {
    case "post": {
      const parts: string[] = [];
      if (content.hook) parts.push(String(content.hook));
      if (content.caption) parts.push(String(content.caption));
      if (Array.isArray(content.hashtags) && content.hashtags.length > 0) {
        parts.push(content.hashtags.join(" "));
      }
      return parts.join("\n\n");
    }
    case "carousel": {
      const slides = Array.isArray(content.slides) ? content.slides : [];
      const parts: string[] = [];
      if (content.titre) parts.push(`📌 ${content.titre}`);
      slides.forEach((s: unknown) => {
        const slide = s as { numero?: number; titre?: string; texte?: string };
        if (slide.titre) parts.push(`Slide ${slide.numero ?? ""} — ${slide.titre}`);
        if (slide.texte) parts.push(slide.texte);
      });
      if (content.caption) parts.push(`\n📝 Caption :\n${content.caption}`);
      if (Array.isArray(content.hashtags) && content.hashtags.length > 0) {
        parts.push(content.hashtags.join(" "));
      }
      return parts.join("\n\n");
    }
    case "hooks": {
      const hooks = Array.isArray((content as { hooks?: unknown[] }).hooks)
        ? (content as { hooks: Array<{ numero?: number; hook?: string }> }).hooks
        : [];
      return hooks.map((h, i) => `${h.numero ?? i + 1}. ${h.hook ?? ""}`).join("\n");
    }
    case "dm": {
      // Copie la variante Standard par défaut
      return String(content.standard ?? content.courte ?? "");
    }
    default:
      return "";
  }
}

// ── Aperçu du contenu ─────────────────────────────────────────────────────────

function ContentPreview({
  module,
  content,
}: {
  module: SaveModule;
  content: Record<string, unknown>;
}) {
  if (module === "post") {
    return (
      <div>
        {content.hook && (
          <p
            className="mb-1 text-sm font-medium"
            style={{ color: "var(--text)", lineHeight: 1.5 }}
          >
            {String(content.hook).slice(0, 100)}
            {String(content.hook).length > 100 ? "…" : ""}
          </p>
        )}
        {content.caption && (
          <p
            className="text-xs"
            style={{ color: "var(--text-muted)", lineHeight: 1.5 }}
          >
            {String(content.caption).slice(0, 120)}
            {String(content.caption).length > 120 ? "…" : ""}
          </p>
        )}
      </div>
    );
  }

  if (module === "carousel") {
    const slides = Array.isArray(content.slides) ? content.slides : [];
    return (
      <div>
        {content.titre && (
          <p className="mb-1 text-sm font-medium" style={{ color: "var(--text)" }}>
            {String(content.titre)}
          </p>
        )}
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {slides.length} slide{slides.length > 1 ? "s" : ""}
          {slides[0] &&
            typeof slides[0] === "object" &&
            (slides[0] as { titre?: string }).titre
            ? ` · Slide 1 : ${(slides[0] as { titre: string }).titre}`
            : ""}
        </p>
      </div>
    );
  }

  if (module === "hooks") {
    const hooks = Array.isArray((content as { hooks?: unknown[] }).hooks)
      ? (content as { hooks: Array<{ hook?: string }> }).hooks
      : [];
    return (
      <div>
        <p className="mb-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {hooks.length} accroche{hooks.length > 1 ? "s" : ""}
        </p>
        {hooks[0]?.hook && (
          <p className="text-sm" style={{ color: "var(--text)", lineHeight: 1.5 }}>
            1. {String(hooks[0].hook).slice(0, 100)}
            {String(hooks[0].hook).length > 100 ? "…" : ""}
          </p>
        )}
      </div>
    );
  }

  if (module === "dm") {
    return (
      <div className="flex flex-col gap-1">
        {(["courte", "standard", "premium"] as const).map((key) =>
          content[key] ? (
            <div key={key}>
              <span
                className="text-[10px] font-semibold"
                style={{ color: "var(--text-muted)", textTransform: "uppercase" }}
              >
                {key === "courte" ? "⚡ Courte" : key === "standard" ? "💬 Standard" : "✨ Premium"}
              </span>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text)" }}
              >
                {String(content[key]).slice(0, 80)}
                {String(content[key]).length > 80 ? "…" : ""}
              </p>
            </div>
          ) : null
        )}
      </div>
    );
  }

  return null;
}

// ── Carte d'un contenu sauvegardé ─────────────────────────────────────────────

function LibraryCard({
  item,
  onDelete,
}: {
  item: SavedItem;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const color = MODULE_COLORS[item.module] ?? "var(--accent)";

  async function handleCopy() {
    const text = getMainText(item.module, item.content);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently ignore
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    try {
      await fetch(`/api/library?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      onDelete(item.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div
      className="overflow-hidden rounded-[16px]"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Barre de couleur du module */}
      <div style={{ height: "3px", backgroundColor: color }} />

      <div className="px-5 py-4">
        {/* Header — module + date */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2rem",
                height: "2rem",
                borderRadius: "8px",
                backgroundColor: "var(--surface-alt)",
                fontSize: "0.9rem",
                flexShrink: 0,
              }}
            >
              {MODULE_ICONS[item.module]}
            </span>
            <div>
              <p className="text-xs font-semibold" style={{ color }}>
                {MODULE_LABELS[item.module]}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {formatDate(item.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Titre */}
        <p
          className="mb-3 text-sm font-semibold"
          style={{ color: "var(--text)", lineHeight: 1.4 }}
        >
          {item.title}
        </p>

        {/* Aperçu du contenu */}
        <div
          className="mb-4 rounded-[10px] px-3 py-3"
          style={{
            backgroundColor: "var(--surface-alt)",
            border: "1px solid var(--border)",
          }}
        >
          <ContentPreview module={item.module} content={item.content} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-secondary"
            style={{ fontSize: "0.78rem", padding: "0.35rem 0.85rem" }}
          >
            {copied ? "✓ Copié !" : "📋 Copier"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{
              fontSize: "0.78rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius)",
              border: confirmDelete ? "1px solid #cc4444" : "1px solid var(--border)",
              backgroundColor: confirmDelete ? "#fff0f0" : "var(--surface-alt)",
              color: confirmDelete ? "#cc4444" : "var(--text-muted)",
              cursor: deleting ? "default" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {deleting ? "Suppression…" : confirmDelete ? "Confirmer ?" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Onglets de filtre ─────────────────────────────────────────────────────────

const FILTER_TABS: { key: SaveModule | "all"; label: string; icon: string }[] = [
  { key: "all", label: "Tous", icon: "✦" },
  { key: "post", label: "Post", icon: "📸" },
  { key: "carousel", label: "Carrousel", icon: "🖼️" },
  { key: "hooks", label: "Accroches", icon: "⚡" },
  { key: "dm", label: "DM", icon: "💬" },
];

// ── Page principale ───────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SaveModule | "all">("all");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/library", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Erreur ${res.status}`);
      setItems(body.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  const filtered =
    filter === "all" ? items : items.filter((item) => item.module === filter);

  return (
    <div className="fade-in">
      {/* En-tête */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold" style={{ color: "var(--text)" }}>
            Mes créations
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Tes contenus sauvegardés depuis tous les modules.
          </p>
        </div>
        {!loading && items.length > 0 && (
          <span
            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            {items.length} sauvegardé{items.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filtres */}
      {!loading && !error && items.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? items.length
                : items.filter((i) => i.module === tab.key).length;
            if (tab.key !== "all" && count === 0) return null;
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  borderRadius: "var(--radius-full, 999px)",
                  padding: "0.35rem 0.875rem",
                  fontSize: "0.8rem",
                  fontWeight: isActive ? 600 : 400,
                  backgroundColor: isActive ? "var(--accent)" : "var(--surface)",
                  color: isActive ? "#fff" : "var(--text-muted)",
                  border: isActive
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tab.icon} {tab.label}
                {count > 0 && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      opacity: 0.75,
                    }}
                  >
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* État chargement */}
      {loading && (
        <div
          className="card"
          style={{ textAlign: "center", padding: "2.5rem" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Chargement…
          </p>
        </div>
      )}

      {/* État erreur */}
      {!loading && error && (
        <div
          className="card"
          style={{ textAlign: "center", padding: "2.5rem" }}
        >
          <p className="text-sm mb-4" style={{ color: "#cc4444" }}>
            {error}
          </p>
          <button className="btn btn-secondary" onClick={fetchItems}>
            Réessayer
          </button>
        </div>
      )}

      {/* État vide */}
      {!loading && !error && items.length === 0 && (
        <div
          className="rounded-[18px] px-8 py-12 text-center"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px dashed var(--border)",
          }}
        >
          <p className="mb-1 text-4xl">🔖</p>
          <p
            className="mb-2 mt-4 text-base font-semibold"
            style={{ color: "var(--text)" }}
          >
            Aucun contenu sauvegardé
          </p>
          <p
            className="mb-6 text-sm leading-relaxed"
            style={{ color: "var(--text-muted)", maxWidth: "320px", margin: "0 auto 1.5rem" }}
          >
            Après avoir généré un post, un carrousel ou des accroches, clique
            sur &ldquo;Sauvegarder&rdquo; pour le retrouver ici.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/dashboard/post"
              className="btn btn-primary"
              style={{ fontSize: "0.875rem" }}
            >
              Créer un post →
            </Link>
            <Link
              href="/dashboard/planning"
              className="btn btn-secondary"
              style={{ fontSize: "0.875rem" }}
            >
              Mon planning →
            </Link>
          </div>
        </div>
      )}

      {/* Filtre sans résultats */}
      {!loading && !error && items.length > 0 && filtered.length === 0 && (
        <div
          className="card"
          style={{ textAlign: "center", padding: "2rem" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Aucun contenu dans cette catégorie.
          </p>
        </div>
      )}

      {/* Grille de cartes */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((item) => (
            <LibraryCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
