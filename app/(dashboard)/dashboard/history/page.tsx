"use client";

// ============================================================
// app/(dashboard)/dashboard/history/page.tsx
//
// Historique des générations — fetch GET /api/generations,
// affichage type + date + bouton voir (modal).
// ============================================================

import { useEffect, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────

type GenerationType = "planning" | "carousel" | "dm" | "hooks" | "post" | "story" | "reel";

interface Generation {
  id: string;
  type: GenerationType;
  inputs: Record<string, unknown>;
  output: unknown;
  tokens_used: number;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────

const TYPE_LABELS: Record<GenerationType, string> = {
  planning: "Planning",
  carousel: "Carrousel",
  dm: "Réponse DM",
  hooks: "Accroches Instagram",
  post: "Post Instagram",
  story: "Stories",
  reel: "Script Reel",
};

const TYPE_ICONS: Record<GenerationType, string> = {
  planning: "📅",
  carousel: "🖼️",
  dm: "💬",
  hooks: "⚡",
  post: "📸",
  story: "📱",
  reel: "🎬",
};

// Traduction des clés techniques en labels lisibles pour toutes les générations
const INPUT_KEY_LABELS: Record<string, string> = {
  typePost: "Type de post",
  specialite: "Spécialité",
  tonStyle: "Style de communication",
  contexte: "Contexte",
  objectif: "Objectif",
  dateDebut: "Début du planning",
  ville: "Ville",
  sujet: "Sujet",
  nombreSlides: "Nombre de slides",
  publicCible: "Public cible",
  messageClient: "Message reçu",
  typeContenu: "Type de contenu",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Page ──────────────────────────────────────────────────────

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Generation | null>(null);

  const fetchGenerations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generations", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Erreur ${res.status}`);
      setGenerations(body.generations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGenerations();
  }, [fetchGenerations]);

  return (
    <div className="fade-in">
      {/* En-tête */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold" style={{ color: "var(--text)" }}>
            Historique
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Tes 20 dernières générations.
          </p>
        </div>
        {!loading && (
          <button className="btn btn-secondary" onClick={fetchGenerations}>
            Actualiser
          </button>
        )}
      </div>

      {/* État chargement */}
      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Chargement…
          </p>
        </div>
      )}

      {/* État erreur */}
      {!loading && error && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <p className="text-sm" style={{ color: "#cc4444" }}>{error}</p>
          <button className="btn btn-secondary mt-4" onClick={fetchGenerations}>
            Réessayer
          </button>
        </div>
      )}

      {/* État vide */}
      {!loading && !error && generations.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p className="mb-1 text-base font-medium" style={{ color: "var(--text)" }}>
            Aucune génération pour l'instant
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Tes créations apparaîtront ici après ta première génération.
          </p>
        </div>
      )}

      {/* Liste */}
      {!loading && !error && generations.length > 0 && (
        <div className="flex flex-col gap-2">
          {generations.map((gen) => (
            <HistoryRow
              key={gen.id}
              generation={gen}
              onView={() => setSelected(gen)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <DetailModal
          generation={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── HistoryRow ─────────────────────────────────────────────────

function HistoryRow({
  generation,
  onView,
}: {
  generation: Generation;
  onView: () => void;
}) {
  const label = TYPE_LABELS[generation.type] ?? generation.type;
  const icon = TYPE_ICONS[generation.type] ?? "✦";

  return (
    <div
      className="card-sm"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      {/* Type + date */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", minWidth: 0 }}>
        {/* Icône */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: "8px",
            backgroundColor: "var(--surface-alt)",
            fontSize: "1rem",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>

        {/* Texte */}
        <div style={{ minWidth: 0 }}>
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--text)" }}
          >
            {label}
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--text-muted)", marginTop: "0.1rem" }}
          >
            {formatDate(generation.created_at)}
          </p>
        </div>
      </div>

      {/* Tokens + bouton */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
        <span
          className="text-xs"
          style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}
        >
          {generation.tokens_used.toLocaleString("fr-FR")} tokens
        </span>
        <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.875rem" }} onClick={onView}>
          Voir
        </button>
      </div>
    </div>
  );
}

// ── DetailModal ────────────────────────────────────────────────

function DetailModal({
  generation,
  onClose,
}: {
  generation: Generation;
  onClose: () => void;
}) {
  const label = TYPE_LABELS[generation.type] ?? generation.type;
  const icon = TYPE_ICONS[generation.type] ?? "✦";

  // Fermer sur Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(2px)",
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <div
        className="fade-in"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 50,
          width: "min(640px, calc(100vw - 2rem))",
          maxHeight: "80vh",
          backgroundColor: "var(--surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.14)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem" }}>{icon}</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {label}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {formatDate(generation.created_at)} · {generation.tokens_used.toLocaleString("fr-FR")} tokens
              </p>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: "1.1rem", padding: "0.25rem 0.5rem" }}
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Contenu scrollable */}
        <div style={{ overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Paramètres */}
          <section>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Paramètres utilisés
            </p>
            <div
              style={{
                backgroundColor: "var(--surface-alt)",
                borderRadius: "var(--radius)",
                padding: "0.875rem 1rem",
              }}
            >
              <InputsView inputs={generation.inputs} />
            </div>
          </section>

          {/* Résultat */}
          <section>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Résultat généré
            </p>
            <OutputView type={generation.type} output={generation.output} />
          </section>
        </div>
      </div>
    </>
  );
}

// ── InputsView ─────────────────────────────────────────────────

function InputsView({ inputs }: { inputs: Record<string, unknown> }) {
  const entries = Object.entries(inputs).filter(([, v]) => v !== undefined && v !== null && v !== "");

  return (
    <dl className="flex flex-col gap-1">
      {entries.map(([key, value]) => (
        <div key={key} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <dt className="text-xs font-semibold" style={{ color: "var(--text-muted)", minWidth: "9rem" }}>
            {INPUT_KEY_LABELS[key] ?? key}
          </dt>
          <dd className="text-xs" style={{ color: "var(--text)", flex: 1 }}>
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ── HooksOutputView ────────────────────────────────────────────
// Composant dédié aux accroches — a son propre état pour le bouton copier.

function HooksOutputView({ output }: { output: unknown }) {
  const [copied, setCopied] = useState(false);

  const o = output as { hooks?: Array<{ numero: number; hook: string }> };
  const hooks = Array.isArray(o?.hooks) ? o.hooks : [];

  if (!hooks.length) {
    return (
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Aucune accroche disponible.
      </p>
    );
  }

  async function copyAll() {
    try {
      const text = hooks.map((h, i) => `${i + 1}. ${h.hook}`).join("\n");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Bouton Copier toutes */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.25rem" }}>
        <button
          onClick={copyAll}
          className="btn btn-secondary"
          style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem" }}
        >
          {copied ? "✓ Copié !" : "📋 Copier toutes les accroches"}
        </button>
      </div>

      {/* Liste des accroches */}
      {hooks.map((item, i) => (
        <div
          key={item.numero ?? i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            backgroundColor: "var(--surface-alt)",
            borderRadius: "var(--radius)",
            padding: "0.65rem 0.875rem",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "1.375rem",
              height: "1.375rem",
              borderRadius: "50%",
              backgroundColor: "var(--accent)",
              color: "#fff",
              fontSize: "0.65rem",
              fontWeight: 700,
              flexShrink: 0,
              marginTop: "0.05rem",
            }}
          >
            {item.numero ?? i + 1}
          </span>
          <p className="text-sm leading-snug" style={{ color: "var(--text)" }}>
            {item.hook}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── OutputView ─────────────────────────────────────────────────
// Affiche le résultat de manière lisible selon le type.

function OutputView({ type, output }: { type: GenerationType; output: unknown }) {
  if (!output || typeof output !== "object") {
    return (
      <pre
        className="text-xs"
        style={{
          backgroundColor: "var(--surface-alt)",
          borderRadius: "var(--radius)",
          padding: "0.875rem 1rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          color: "var(--text)",
        }}
      >
        {JSON.stringify(output, null, 2)}
      </pre>
    );
  }

  if (type === "hooks") {
    return <HooksOutputView output={output} />;
  }

  if (type === "dm") {
    const o = output as { courte?: string; standard?: string; premium?: string };
    return (
      <div className="flex flex-col gap-3">
        {(["courte", "standard", "premium"] as const).map((key) => (
          o[key] ? (
            <div key={key}>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                {key === "courte" ? "⚡ Courte" : key === "standard" ? "💬 Standard" : "✨ Premium"}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{
                  backgroundColor: "var(--surface-alt)",
                  borderRadius: "var(--radius)",
                  padding: "0.75rem 1rem",
                  color: "var(--text)",
                  whiteSpace: "pre-line",
                }}
              >
                {o[key]}
              </p>
            </div>
          ) : null
        ))}
      </div>
    );
  }

  if (type === "planning") {
    const o = output as {
      posts?: Array<{
        jour: number;
        jourNom?: string;
        typeContenu?: string;
        theme: string;
        description?: string;
        caption?: string; // ancienne structure 30 jours
      }>;
    };
    if (Array.isArray(o?.posts)) {
      return (
        <div className="flex flex-col gap-2">
          {o.posts.map((post, i) => (
            <div
              key={i}
              className="text-sm"
              style={{
                backgroundColor: "var(--surface-alt)",
                borderRadius: "var(--radius)",
                padding: "0.75rem 1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                <span className="badge">{post.jourNom ?? `J${post.jour}`}</span>
                {post.typeContenu && (
                  <span className="badge" style={{ opacity: 0.85 }}>{post.typeContenu}</span>
                )}
              </div>
              <strong style={{ color: "var(--text)" }}>{post.theme}</strong>
              {(post.description ?? post.caption) && (
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {post.description ?? post.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  if (type === "carousel") {
    const o = output as { titre?: string; slides?: Array<{ numero: number; titre: string; texte: string }> };
    return (
      <div className="flex flex-col gap-2">
        {o.titre && (
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{o.titre}</p>
        )}
        {Array.isArray(o?.slides) && o.slides.slice(0, 4).map((slide, i) => (
          <div
            key={i}
            className="text-sm"
            style={{
              backgroundColor: "var(--surface-alt)",
              borderRadius: "var(--radius)",
              padding: "0.75rem 1rem",
            }}
          >
            <span className="badge" style={{ marginRight: "0.5rem" }}>#{slide.numero}</span>
            <strong style={{ color: "var(--text)" }}>{slide.titre}</strong>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{slide.texte}</p>
          </div>
        ))}
        {Array.isArray(o?.slides) && o.slides.length > 4 && (
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            + {o.slides.length - 4} autres slides
          </p>
        )}
      </div>
    );
  }

  if (type === "post") {
    const o = output as {
      hook?: string;
      caption?: string;
      hashtags?: string[];
      ideeStory?: string;
      ideeReel?: string | null;
    };
    return (
      <div className="flex flex-col gap-3">
        {/* Première phrase */}
        {o.hook && (
          <div>
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Première phrase
            </p>
            <p
              className="text-sm font-medium"
              style={{
                backgroundColor: "var(--surface-alt)",
                borderRadius: "var(--radius)",
                padding: "0.6rem 0.875rem",
                color: "var(--text)",
              }}
            >
              {o.hook}
            </p>
          </div>
        )}

        {/* Texte du post */}
        {o.caption && (
          <div>
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Texte du post
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{
                backgroundColor: "var(--surface-alt)",
                borderRadius: "var(--radius)",
                padding: "0.75rem 0.875rem",
                color: "var(--text)",
                whiteSpace: "pre-line",
              }}
            >
              {o.caption}
            </p>
          </div>
        )}

        {/* Hashtags */}
        {Array.isArray(o?.hashtags) && o.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {o.hashtags.map((tag) => (
              <span key={tag} className="badge">{tag}</span>
            ))}
          </div>
        )}

        {/* Idée Story */}
        {o.ideeStory && (
          <div
            className="rounded-[10px] px-3 py-2"
            style={{
              backgroundColor: "var(--bg)",
              borderLeft: "3px solid #6b9fd4",
            }}
          >
            <p className="text-xs font-semibold mb-0.5" style={{ color: "#6b9fd4" }}>
              📸 Idée Story
            </p>
            <p className="text-xs" style={{ color: "var(--text)" }}>
              {o.ideeStory}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Fallback JSON
  return (
    <pre
      className="text-xs"
      style={{
        backgroundColor: "var(--surface-alt)",
        borderRadius: "var(--radius)",
        padding: "0.875rem 1rem",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        color: "var(--text)",
        overflowX: "auto",
      }}
    >
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}
