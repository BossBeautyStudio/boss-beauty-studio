"use client";

// ============================================================
// app/(dashboard)/dashboard/settings/page.tsx
//
// Page Paramètres — Profil de marque.
// Permet à l'utilisatrice de sauvegarder sa spécialité, son ton,
// sa clientèle cible et ses hashtags favoris pour pré-remplir
// automatiquement tous les modules.
// ============================================================

import { useState, useEffect } from "react";
import type { BrandProfile } from "@/hooks/useBrandProfile";

const SPECIALITE_PILLS = [
  "Onglerie",
  "Coiffure",
  "Esthétique",
  "Extensions de cils",
  "Maquillage",
  "Massage",
];

const TONE_OPTIONS = [
  "Chaleureux et proche",
  "Expert et éducatif",
  "Inspirant et motivant",
  "Professionnel et élégant",
  "Fun et décalé",
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  // Champs du profil
  const [nomMarque, setNomMarque] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [tonStyle, setTonStyle] = useState(TONE_OPTIONS[0]);
  const [publicCible, setPublicCible] = useState("");
  const [hashtagsFavoris, setHashtagsFavoris] = useState("");

  // État UI
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Charger le profil existant au montage
  useEffect(() => {
    fetch("/api/brand-profile")
      .then((r) => r.json())
      .then((data: BrandProfile | null) => {
        if (data) {
          setNomMarque(data.nom_marque ?? "");
          setSpecialite(data.specialite ?? "");
          setTonStyle(data.ton_style ?? TONE_OPTIONS[0]);
          setPublicCible(data.public_cible ?? "");
          setHashtagsFavoris(data.hashtags_favoris ?? "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");

    try {
      const res = await fetch("/api/brand-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom_marque: nomMarque.trim() || null,
          specialite: specialite.trim() || null,
          ton_style: tonStyle || null,
          public_cible: publicCible.trim() || null,
          hashtags_favoris: hashtagsFavoris.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Erreur serveur");

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  if (loading) {
    return (
      <div className="fade-in flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Chargement…
        </p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Paramètres
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Remplis ton profil une seule fois — tous les modules se pré-remplissent automatiquement.
        </p>
      </div>

      {/* Bannière info */}
      <div
        className="mb-6 rounded-[14px] px-5 py-4"
        style={{
          backgroundColor: "var(--surface-alt)",
          borderLeft: "3px solid var(--accent)",
        }}
      >
        <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
          ✨ Ton profil de marque
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Ces informations sont utilisées pour pré-remplir les champs dans chaque module.
          Tu peux toujours les modifier ponctuellement lors d&apos;une génération.
        </p>
      </div>

      {/* Formulaire */}
      <div className="card" style={{ maxWidth: "560px" }}>
        <form onSubmit={handleSave} className="flex flex-col gap-6">

          {/* Nom de la marque / salon */}
          <div className="field">
            <label className="label" htmlFor="nomMarque">
              Nom de ta marque ou de ton salon{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optionnel)</span>
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

          {/* Spécialité */}
          <div className="field">
            <label className="label" htmlFor="specialite">
              Ta spécialité principale
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {SPECIALITE_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setSpecialite(pill)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: specialite === pill ? "var(--accent)" : "var(--surface-alt)",
                    color: specialite === pill ? "#fff" : "var(--text-muted)",
                    border: specialite === pill ? "1px solid var(--accent)" : "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  {pill}
                </button>
              ))}
            </div>
            <input
              id="specialite"
              className="input"
              type="text"
              placeholder="Ou tape ta spécialité — ex : prothésiste ongulaire…"
              value={specialite}
              onChange={(e) => setSpecialite(e.target.value)}
            />
          </div>

          {/* Ton de communication */}
          <div className="field">
            <label className="label" htmlFor="tonStyle">
              Ton style de communication
            </label>
            <select
              id="tonStyle"
              className="select"
              value={tonStyle}
              onChange={(e) => setTonStyle(e.target.value)}
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Clientèle cible */}
          <div className="field">
            <label className="label" htmlFor="publicCible">
              Ta clientèle cible{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optionnel)</span>
            </label>
            <input
              id="publicCible"
              className="input"
              type="text"
              placeholder="Ex : femmes 25-45 ans, mamans actives, professionnelles…"
              value={publicCible}
              onChange={(e) => setPublicCible(e.target.value)}
            />
          </div>

          {/* Hashtags favoris */}
          <div className="field">
            <label className="label" htmlFor="hashtagsFavoris">
              Tes hashtags favoris{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optionnel)</span>
            </label>
            <textarea
              id="hashtagsFavoris"
              className="textarea"
              placeholder="#onglerie #nailart #beauty #beauté #coiffure…"
              value={hashtagsFavoris}
              onChange={(e) => setHashtagsFavoris(e.target.value)}
              rows={3}
            />
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Sépare-les par des espaces ou des virgules
            </p>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving"
                ? "Sauvegarde…"
                : saveStatus === "saved"
                ? "✓ Profil sauvegardé !"
                : saveStatus === "error"
                ? "Erreur — réessaie"
                : "Sauvegarder mon profil"}
            </button>

            {saveStatus === "saved" && (
              <p className="text-sm" style={{ color: "var(--accent)" }}>
                Les modules se pré-remplissent dès maintenant.
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Bloc info usage */}
      <div
        className="mt-8 rounded-[14px] px-5 py-5"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          maxWidth: "560px",
        }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Comment ça fonctionne
        </p>
        <div className="flex flex-col gap-3">
          {[
            {
              icon: "📝",
              text: "Remplis ton profil une seule fois ici",
            },
            {
              icon: "⚡",
              text: "Tes champs se pré-remplissent dans Post, Carrousel, Hooks et DM",
            },
            {
              icon: "✏️",
              text: "Tu peux toujours modifier ponctuellement lors d'une génération",
            },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span className="text-base">{icon}</span>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
