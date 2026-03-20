"use client";

// ============================================================
// app/(onboarding)/onboarding/page.tsx
//
// Wizard first-time — 3 étapes pour configurer le profil de marque.
// Affiché uniquement au premier login (profil vide en base).
// Après soumission → redirige vers /dashboard.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ── Données ───────────────────────────────────────────────────────────────────

const SPECIALITES = [
  { label: "💅 Onglerie", value: "Onglerie" },
  { label: "✂️ Coiffure", value: "Coiffure" },
  { label: "🌸 Esthétique", value: "Esthétique" },
  { label: "👁️ Extensions de cils", value: "Extensions de cils" },
  { label: "💄 Maquillage", value: "Maquillage" },
  { label: "🕊️ Massage", value: "Massage" },
];

const TON_OPTIONS = [
  {
    value: "Chaleureux et proche",
    emoji: "🤗",
    desc: "Tu tuttoies, tu crées du lien",
  },
  {
    value: "Expert et éducatif",
    emoji: "🎓",
    desc: "Tu partages ton savoir-faire",
  },
  {
    value: "Inspirant et motivant",
    emoji: "✨",
    desc: "Tu boostes et tu inspires",
  },
  {
    value: "Professionnel et élégant",
    emoji: "💎",
    desc: "Image haut-de-gamme et soignée",
  },
  {
    value: "Fun et décalé",
    emoji: "🎉",
    desc: "Humour, légèreté, originalité",
  },
];

// ── Composant ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [specialite, setSpecialite] = useState("");
  const [customSpecialite, setCustomSpecialite] = useState("");
  const [tonStyle, setTonStyle] = useState("");
  const [nomMarque, setNomMarque] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const finalSpecialite = specialite || customSpecialite.trim();

  // ── Étape 3 : soumettre ──────────────────────────────────────────────────────
  async function handleSubmit() {
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/brand-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialite: finalSpecialite || null,
          ton_style: tonStyle || null,
          nom_marque: nomMarque.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Erreur serveur");

      // Supprimer la bannière d'onboarding legacy (localStorage)
      try { localStorage.setItem("bbs_onboarded", "1"); } catch { /* non critique */ }

      router.push("/dashboard");
    } catch {
      setError("Une erreur est survenue. Réessaie.");
      setSaving(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{
        background:
          "radial-gradient(circle at 20% 10%, rgba(181,122,140,0.15), transparent 40%), var(--bg)",
      }}
    >
      {/* Logo */}
      <div className="mb-10">
        <Image
          src="/logo.png"
          alt="Boss Beauty Studio"
          width={160}
          height={42}
          priority
          className="object-contain"
        />
      </div>

      {/* Carte wizard */}
      <div
        className="w-full max-w-md rounded-[20px] p-8"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
        }}
      >
        {/* Indicateur d'étapes */}
        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all"
                style={{
                  backgroundColor: n <= step ? "var(--accent)" : "var(--surface-alt)",
                  color: n <= step ? "#fff" : "var(--text-muted)",
                  border: n === step ? "2px solid var(--accent)" : "2px solid transparent",
                  transform: n === step ? "scale(1.1)" : "scale(1)",
                }}
              >
                {n < step ? "✓" : n}
              </div>
              {n < 3 && (
                <div
                  className="h-px flex-1 w-10 transition-all"
                  style={{
                    backgroundColor: n < step ? "var(--accent)" : "var(--border)",
                  }}
                />
              )}
            </div>
          ))}
          <p className="ml-auto text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Étape {step} / 3
          </p>
        </div>

        {/* ── Étape 1 : Spécialité ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="fade-in">
            <h1
              className="mb-1 text-xl font-semibold"
              style={{ color: "var(--text)" }}
            >
              Quelle est ta spécialité ? 💅
            </h1>
            <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Tous tes contenus seront adaptés à ton métier.
            </p>

            <div className="mb-4 grid grid-cols-2 gap-2.5">
              {SPECIALITES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setSpecialite(s.value);
                    setCustomSpecialite("");
                  }}
                  className="rounded-[12px] px-4 py-3 text-left text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      specialite === s.value ? "var(--accent)" : "var(--surface-alt)",
                    color: specialite === s.value ? "#fff" : "var(--text)",
                    border:
                      specialite === s.value
                        ? "1.5px solid var(--accent)"
                        : "1.5px solid var(--border)",
                    transform: specialite === s.value ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <input
              className="input"
              type="text"
              placeholder="Autre spécialité… (ex : microblading)"
              value={customSpecialite}
              onChange={(e) => {
                setCustomSpecialite(e.target.value);
                setSpecialite("");
              }}
            />

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!finalSpecialite}
              className="btn btn-primary mt-6 w-full"
              style={{ opacity: finalSpecialite ? 1 : 0.45 }}
            >
              Continuer →
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-3 w-full text-center text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Passer cette étape
            </button>
          </div>
        )}

        {/* ── Étape 2 : Ton de communication ───────────────────────────── */}
        {step === 2 && (
          <div className="fade-in">
            <h1
              className="mb-1 text-xl font-semibold"
              style={{ color: "var(--text)" }}
            >
              Ton style de communication ✍️
            </h1>
            <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Tes posts et légendes adopteront automatiquement ce ton.
            </p>

            <div className="flex flex-col gap-2.5">
              {TON_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTonStyle(t.value)}
                  className="flex items-center gap-3 rounded-[12px] px-4 py-3.5 text-left transition-all"
                  style={{
                    backgroundColor:
                      tonStyle === t.value ? "rgba(181,122,140,0.08)" : "var(--surface-alt)",
                    border:
                      tonStyle === t.value
                        ? "1.5px solid var(--accent)"
                        : "1.5px solid var(--border)",
                    transform: tonStyle === t.value ? "scale(1.01)" : "scale(1)",
                  }}
                >
                  <span className="text-xl">{t.emoji}</span>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {t.value}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t.desc}
                    </p>
                  </div>
                  {tonStyle === t.value && (
                    <span
                      className="ml-auto text-sm font-bold"
                      style={{ color: "var(--accent)" }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!tonStyle}
              className="btn btn-primary mt-6 w-full"
              style={{ opacity: tonStyle ? 1 : 0.45 }}
            >
              Continuer →
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="mt-3 w-full text-center text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Passer cette étape
            </button>
          </div>
        )}

        {/* ── Étape 3 : Nom de marque ───────────────────────────────────── */}
        {step === 3 && (
          <div className="fade-in">
            <h1
              className="mb-1 text-xl font-semibold"
              style={{ color: "var(--text)" }}
            >
              Dernière touche ✨
            </h1>
            <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Le nom de ton salon ou ta marque — ça personnalise encore plus tes contenus.
            </p>

            <div className="field mb-4">
              <label className="label" htmlFor="nomMarque">
                Nom de ton salon / ta marque{" "}
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                  (optionnel)
                </span>
              </label>
              <input
                id="nomMarque"
                className="input"
                type="text"
                placeholder="Ex : Beauty by Sarah, Studio Lumière…"
                value={nomMarque}
                onChange={(e) => setNomMarque(e.target.value)}
              />
            </div>

            {/* Récap */}
            {(finalSpecialite || tonStyle) && (
              <div
                className="mb-5 rounded-[12px] px-4 py-3.5 text-sm"
                style={{
                  backgroundColor: "var(--surface-alt)",
                  border: "1px solid var(--border)",
                }}
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Ton profil
                </p>
                {finalSpecialite && (
                  <p style={{ color: "var(--text)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Spécialité :</span>{" "}
                    <strong>{finalSpecialite}</strong>
                  </p>
                )}
                {tonStyle && (
                  <p className="mt-1" style={{ color: "var(--text)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Ton :</span>{" "}
                    <strong>{tonStyle}</strong>
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="mb-4 text-sm" style={{ color: "#CC4444" }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="btn btn-primary w-full"
            >
              {saving ? "Configuration…" : "Accéder à mon espace 🚀"}
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-3 w-full text-center text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              ← Retour
            </button>
          </div>
        )}
      </div>

      {/* Note de bas de page */}
      <p className="mt-6 text-xs text-center" style={{ color: "var(--text-muted)" }}>
        Tu pourras modifier ces informations à tout moment dans Mon profil.
      </p>
    </div>
  );
}
