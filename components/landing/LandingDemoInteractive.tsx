"use client";

// ============================================================
// components/landing/LandingDemoInteractive.tsx
//
// Démo interactive de la landing page (Feature 4 — V1.2).
// Appelle /api/generate/demo (public, mock data, sans auth).
// Gère 1 démo gratuite en localStorage — après : soft CTA.
// ============================================================

import { useState, useEffect } from "react";

// Funnel : landing → /login → dashboard (2 essais gratuits) → paywall → Stripe
// Ne jamais pointer vers Stripe depuis la landing.
const FREE_ENTRY_URL = "/login";
const DEMO_STORAGE_KEY = "bbs_demo_used";

const POST_TYPES_DEMO = [
  { id: "attirer", label: "Attirer des clientes", icon: "🎯" },
  { id: "avant-apres", label: "Avant / Après", icon: "✨" },
  { id: "conseil", label: "Conseil beauté", icon: "💡" },
  { id: "promo", label: "Promotion / Offre", icon: "🏷️" },
];

const SPECIALITE_PILLS = [
  "Extensions de cils",
  "Onglerie",
  "Coiffure",
  "Esthétique",
  "Maquillage",
];

interface DemoResult {
  hook: string;
  caption: string;
  hashtags: string[];
  ideeStory: string;
  ideeReel: string | null;
}

export default function LandingDemoInteractive() {
  const [specialite, setSpecialite] = useState("Extensions de cils");
  const [typePost, setTypePost] = useState("attirer");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [demoUsed, setDemoUsed] = useState(false);

  // Lire localStorage pour savoir si la démo a déjà été utilisée
  useEffect(() => {
    try {
      const used = localStorage.getItem(DEMO_STORAGE_KEY);
      if (used === "true") setDemoUsed(true);
    } catch {
      // localStorage indisponible (SSR ou navigateur restreint) — OK
    }
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typePost, specialite }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Erreur de génération");

      setResult(body.data);

      // Marquer la démo comme utilisée dans localStorage
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, "true");
        setDemoUsed(true);
      } catch {
        // Non critique
      }
    } catch {
      setError("Une erreur est survenue. Réessaie dans quelques secondes.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    const text = `${result.caption}\n\n${result.hashtags.join(" ")}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const selectedTypeDef = POST_TYPES_DEMO.find((t) => t.id === typePost);

  return (
    <section
      id="demo"
      className="px-5 py-12 sm:py-20"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="mx-auto" style={{ maxWidth: "680px" }}>
        {/* En-tête */}
        <p
          className="mb-2 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          Démonstration interactive
        </p>
        <h2
          className="mb-3 text-center text-2xl font-semibold leading-snug sm:text-3xl"
          style={{ color: "var(--text)" }}
        >
          Génère un post maintenant,{" "}
          <span style={{ color: "var(--accent)" }}>gratuitement</span>
        </h2>
        <p
          className="mb-6 sm:mb-10 text-center text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Choisis ta spécialité et le type de contenu. Le résultat apparaît en 10 secondes.
        </p>

        {/* Formulaire démo */}
        <div
          className="mb-6 overflow-hidden rounded-[20px]"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* Sélecteurs */}
          <div className="px-6 py-6">
            {/* Spécialité */}
            <div className="mb-5">
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Ta spécialité
              </p>
              <div className="flex flex-wrap gap-2">
                {SPECIALITE_PILLS.map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => setSpecialite(pill)}
                    className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor:
                        specialite === pill ? "var(--accent)" : "var(--surface-alt)",
                      color: specialite === pill ? "#fff" : "var(--text-muted)",
                      border:
                        specialite === pill
                          ? "1px solid var(--accent)"
                          : "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Type de post */}
            <div className="mb-6">
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Type de post
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {POST_TYPES_DEMO.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTypePost(t.id)}
                    className="flex flex-col items-center gap-1 rounded-[12px] px-2 py-3 text-center transition-all"
                    style={{
                      backgroundColor:
                        typePost === t.id ? "var(--surface-alt)" : "var(--bg)",
                      border:
                        typePost === t.id
                          ? "2px solid var(--accent)"
                          : "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <span
                      className="text-xs font-medium leading-snug"
                      style={{ color: "var(--text)" }}
                    >
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton générer */}
            <button
              type="button"
              className="btn btn-primary w-full"
              style={{ fontSize: "1rem", padding: "0.8rem 1.5rem" }}
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading
                ? "Génération en cours… ✨"
                : result
                ? "Regénérer →"
                : "Générer mon post →"}
            </button>

            {error && (
              <p
                className="mt-3 text-center text-sm"
                style={{ color: "#cc4444" }}
              >
                {error}
              </p>
            )}
          </div>

          {/* Résultat */}
          {result && (
            <div
              className="slide-up"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {/* Badge type */}
              <div
                className="flex items-center gap-2 px-6 py-3"
                style={{
                  backgroundColor: "var(--surface-alt)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span>{selectedTypeDef?.icon}</span>
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  Post généré · {selectedTypeDef?.label} · {specialite}
                </p>
                <span
                  className="ml-auto flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "#4ade80" }}
                  />
                  Prêt à publier
                </span>
              </div>

              <div className="px-6 py-5">
                {/* Caption */}
                <p
                  className="mb-4 whitespace-pre-line text-sm leading-relaxed"
                  style={{ color: "var(--text)" }}
                >
                  {result.caption}
                </p>

                {/* Hashtags */}
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {result.hashtags.map((tag) => (
                    <span key={tag} className="badge">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Idée Story */}
                <div
                  className="mb-5 rounded-[10px] px-3 py-2.5"
                  style={{
                    backgroundColor: "var(--bg)",
                    borderLeft: "3px solid #6b9fd4",
                  }}
                >
                  <p
                    className="mb-1 text-xs font-semibold"
                    style={{ color: "#6b9fd4" }}
                  >
                    📸 Idée Story
                  </p>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--text)" }}
                  >
                    {result.ideeStory}
                  </p>
                </div>

                {/* Bouton copier + CTA compte */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCopy}
                  >
                    {copied ? "✓ Copié !" : "Copier le post"}
                  </button>
                  <a
                    href={FREE_ENTRY_URL}
                    className="btn btn-primary"
                    style={{ fontSize: "0.9375rem" }}
                  >
                    Créer mon accès gratuit →
                  </a>
                </div>

                {/* Note sous le résultat */}
                <p
                  className="mt-3 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Ce post est un exemple basé sur des données fictives.{" "}
                  <span className="font-medium" style={{ color: "var(--text)" }}>
                    Le vrai outil génère du contenu 100 % adapté à ta spécialité.
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA sous la démo si déjà utilisée */}
        {demoUsed && !loading && (
          <div className="text-center">
            <p
              className="mb-3 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Tu as vu ce que Boss Beauty Studio peut faire. Le vrai outil génère
              un planning de 7 posts pour la semaine en quelques secondes.
            </p>
            <a
              href={FREE_ENTRY_URL}
              className="btn btn-primary"
              style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}
            >
              Essayer gratuitement →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
