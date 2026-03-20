"use client";

// ============================================================
// app/(dashboard)/dashboard/settings/page.tsx
//
// Page "Mon profil" — profil de marque enrichi.
//
// Sections :
//   1. Identité       — nom marque · instagram · ville
//   2. Activité       — spécialité · services · prix moyen
//   3. Communication  — ton (cartes visuelles) · clientèle · hashtags pills
//
// Indicateur de complétion calculé dynamiquement.
// Bouton sticky "Sauvegarder" apparaît dès qu'il y a des changements.
// ============================================================

import { useState, useEffect, useCallback } from "react";

// ── Données statiques ─────────────────────────────────────────────────────────

const SPECIALITE_PILLS = [
  { emoji: "💅", label: "Onglerie" },
  { emoji: "✂️", label: "Coiffure" },
  { emoji: "🌸", label: "Esthétique" },
  { emoji: "👁️", label: "Extensions de cils" },
  { emoji: "💄", label: "Maquillage" },
  { emoji: "🕊️", label: "Massage" },
];

const TON_OPTIONS = [
  { value: "Chaleureux et proche",     emoji: "🤗", desc: "Tu tuttoies, tu crées du lien" },
  { value: "Expert et éducatif",       emoji: "🎓", desc: "Tu partages ton savoir-faire" },
  { value: "Inspirant et motivant",    emoji: "✨", desc: "Tu boostes et tu inspires" },
  { value: "Professionnel et élégant", emoji: "💎", desc: "Image haut-de-gamme et soignée" },
  { value: "Fun et décalé",            emoji: "🎉", desc: "Humour, légèreté, originalité" },
];

const PRIX_MOYEN_OPTIONS = [
  { value: "Accessible",   desc: "< 30 €"  },
  { value: "Standard",     desc: "30–60 €" },
  { value: "Premium",      desc: "60–100 €"},
  { value: "Luxe",         desc: "> 100 €" },
];

const SERVICES_SUGGESTIONS = [
  "Pose gel", "Nail art", "Remplissage", "Manucure", "Pédicure",
  "Balayage", "Coloration", "Coupe", "Brushing", "Soin visage",
  "Épilation", "Teinture cils", "Lifting cils", "Extension cils",
  "Maquillage mariage", "Microneedling", "Massage relaxant",
];

// ── Types ─────────────────────────────────────────────────────────────────────

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ProfileForm {
  nomMarque:        string;
  instagramHandle:  string;
  ville:            string;
  specialite:       string;
  servicesTags:     string[];
  prixMoyen:        string;
  tonStyle:         string;
  publicCible:      string;
  hashtagsTags:     string[];
}

const EMPTY_FORM: ProfileForm = {
  nomMarque:        "",
  instagramHandle:  "",
  ville:            "",
  specialite:       "",
  servicesTags:     [],
  prixMoyen:        "",
  tonStyle:         "",
  publicCible:      "",
  hashtagsTags:     [],
};

// ── Calcul de complétion ─────────────────────────────────────────────────────

function calcCompletion(form: ProfileForm): number {
  const fields = [
    form.nomMarque,
    form.instagramHandle,
    form.ville,
    form.specialite,
    form.servicesTags.length > 0 ? "x" : "",
    form.prixMoyen,
    form.tonStyle,
    form.publicCible,
    form.hashtagsTags.length > 0 ? "x" : "",
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

// ── Parsing des services/hashtags stockés en DB ────────────────────────────

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading]     = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [dirty, setDirty]         = useState(false);

  // Entrée libre pour "Autre spécialité"
  const [customSpecialite, setCustomSpecialite] = useState("");
  // Entrée en cours pour ajouter un service ou hashtag
  const [serviceInput, setServiceInput]   = useState("");
  const [hashtagInput, setHashtagInput]   = useState("");

  // ── Chargement du profil ──────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/brand-profile")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          const loaded: ProfileForm = {
            nomMarque:        data.nom_marque        ?? "",
            instagramHandle:  data.instagram_handle  ?? "",
            ville:            data.ville             ?? "",
            specialite:       data.specialite        ?? "",
            servicesTags:     parseTags(data.services),
            prixMoyen:        data.prix_moyen        ?? "",
            tonStyle:         data.ton_style         ?? "",
            publicCible:      data.public_cible      ?? "",
            hashtagsTags:     parseTags(data.hashtags_favoris),
          };
          setForm(loaded);
          // Si la spécialité n'est pas dans la liste prédéfinie, c'est un custom
          const isPredefined = SPECIALITE_PILLS.some(
            (p) => p.label === loaded.specialite
          );
          if (!isPredefined && loaded.specialite) {
            setCustomSpecialite(loaded.specialite);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function addTag(
    field: "servicesTags" | "hashtagsTags",
    raw: string,
    setInput: (v: string) => void
  ) {
    const tag = raw.trim().replace(/^#+/, "");
    if (!tag) return;
    setForm((prev) => {
      if (prev[field].includes(tag)) return prev;
      return { ...prev, [field]: [...prev[field], tag] };
    });
    setInput("");
    setDirty(true);
  }

  function removeTag(field: "servicesTags" | "hashtagsTags", tag: string) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((t) => t !== tag),
    }));
    setDirty(true);
  }

  // ── Sauvegarde ───────────────────────────────────────────────────────────

  const handleSave = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (saveStatus === "saving") return;
      setSaveStatus("saving");

      const finalSpecialite =
        SPECIALITE_PILLS.some((p) => p.label === form.specialite)
          ? form.specialite
          : customSpecialite.trim() || form.specialite;

      try {
        const res = await fetch("/api/brand-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom_marque:       form.nomMarque.trim()       || null,
            instagram_handle: form.instagramHandle.trim() || null,
            ville:            form.ville.trim()           || null,
            specialite:       finalSpecialite             || null,
            services:         form.servicesTags.join(", ")|| null,
            prix_moyen:       form.prixMoyen              || null,
            ton_style:        form.tonStyle               || null,
            public_cible:     form.publicCible.trim()     || null,
            hashtags_favoris: form.hashtagsTags
                                .map((h) => `#${h}`)
                                .join(" ")               || null,
          }),
        });
        if (!res.ok) throw new Error();
        setSaveStatus("saved");
        setDirty(false);
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [form, customSpecialite, saveStatus]
  );

  // ── Complétion ────────────────────────────────────────────────────────────

  const completion = calcCompletion(form);

  const completionColor =
    completion < 40 ? "#b87333" : completion < 80 ? "#d4a852" : "var(--accent)";

  // ── Affichage ─────────────────────────────────────────────────────────────

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
    <div className="fade-in pb-24">

      {/* ── En-tête ────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Mon profil
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Remplis-le une seule fois — tous les modules se pré-remplissent automatiquement.
        </p>
      </div>

      {/* ── Barre de complétion ────────────────────────────────── */}
      <div
        className="mb-8 rounded-[14px] px-5 py-4"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Complétion du profil
          </p>
          <p
            className="text-sm font-bold tabular-nums"
            style={{ color: completionColor }}
          >
            {completion}%
          </p>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--surface-alt)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${completion}%`, backgroundColor: completionColor }}
          />
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          {completion < 40
            ? "Commence par remplir les champs essentiels — spécialité et ton de communication."
            : completion < 80
            ? "Bon début ! Ajoute tes services et hashtags pour des contenus encore plus précis."
            : "Excellent ! Ton profil est bien rempli, tes contenus seront ultra-personnalisés. ✨"}
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-8">

        {/* ── Section 1 : Identité ────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-base">🏷️</span>
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Identité
            </h2>
          </div>

          <div
            className="rounded-[16px] p-5 flex flex-col gap-5"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Nom de marque */}
            <div className="field">
              <label className="label" htmlFor="nomMarque">
                Nom de ton salon / ta marque
                <span className="ml-1 font-normal" style={{ color: "var(--text-muted)" }}>(optionnel)</span>
              </label>
              <input
                id="nomMarque"
                className="input"
                type="text"
                placeholder="Ex : Beauty by Sarah, Studio Lumière…"
                value={form.nomMarque}
                onChange={(e) => update("nomMarque", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Instagram handle */}
              <div className="field">
                <label className="label" htmlFor="instagram">
                  Compte Instagram
                </label>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    @
                  </span>
                  <input
                    id="instagram"
                    className="input"
                    style={{ paddingLeft: "1.75rem" }}
                    type="text"
                    placeholder="moncompte"
                    value={form.instagramHandle.replace(/^@/, "")}
                    onChange={(e) => update("instagramHandle", e.target.value)}
                  />
                </div>
              </div>

              {/* Ville */}
              <div className="field">
                <label className="label" htmlFor="ville">
                  Ville / Région
                </label>
                <input
                  id="ville"
                  className="input"
                  type="text"
                  placeholder="Ex : Lyon, Paris 11e, Bordeaux…"
                  value={form.ville}
                  onChange={(e) => update("ville", e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2 : Activité ────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-base">💼</span>
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Activité
            </h2>
          </div>

          <div
            className="rounded-[16px] p-5 flex flex-col gap-5"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Spécialité */}
            <div className="field">
              <label className="label">Ta spécialité principale</label>
              <div className="mb-2.5 flex flex-wrap gap-2">
                {SPECIALITE_PILLS.map((pill) => {
                  const isActive = form.specialite === pill.label;
                  return (
                    <button
                      key={pill.label}
                      type="button"
                      onClick={() => {
                        update("specialite", pill.label);
                        setCustomSpecialite("");
                      }}
                      className="rounded-full px-3 py-1.5 text-sm font-medium transition-all"
                      style={{
                        backgroundColor: isActive ? "var(--accent)" : "var(--surface-alt)",
                        color: isActive ? "#fff" : "var(--text)",
                        border: isActive ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                        transform: isActive ? "scale(1.03)" : "scale(1)",
                      }}
                    >
                      {pill.emoji} {pill.label}
                    </button>
                  );
                })}
              </div>
              <input
                className="input"
                type="text"
                placeholder="Autre… (ex : prothésiste ongulaire, microblading)"
                value={customSpecialite}
                onChange={(e) => {
                  setCustomSpecialite(e.target.value);
                  if (e.target.value) update("specialite", "");
                  setDirty(true);
                }}
              />
            </div>

            {/* Services */}
            <div className="field">
              <label className="label">
                Tes services principaux
                <span className="ml-1 font-normal" style={{ color: "var(--text-muted)" }}>(optionnel)</span>
              </label>

              {/* Tags existants */}
              {form.servicesTags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {form.servicesTags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: "rgba(181,122,140,0.12)",
                        color: "var(--accent)",
                        border: "1px solid rgba(181,122,140,0.3)",
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag("servicesTags", tag)}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        aria-label={`Supprimer ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input + suggestions */}
              <input
                className="input"
                type="text"
                placeholder="Ajouter un service (Entrée pour valider)"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag("servicesTags", serviceInput, setServiceInput);
                  }
                }}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SERVICES_SUGGESTIONS.filter(
                  (s) =>
                    !form.servicesTags.includes(s) &&
                    (!serviceInput ||
                      s.toLowerCase().includes(serviceInput.toLowerCase()))
                )
                  .slice(0, 8)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          servicesTags: prev.servicesTags.includes(s)
                            ? prev.servicesTags
                            : [...prev.servicesTags, s],
                        }));
                        setDirty(true);
                      }}
                      className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: "var(--surface-alt)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      + {s}
                    </button>
                  ))}
              </div>
            </div>

            {/* Prix moyen */}
            <div className="field">
              <label className="label">
                Fourchette de prix moyenne
                <span className="ml-1 font-normal" style={{ color: "var(--text-muted)" }}>(optionnel)</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRIX_MOYEN_OPTIONS.map((opt) => {
                  const isActive = form.prixMoyen === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update("prixMoyen", opt.value)}
                      className="rounded-[12px] px-3 py-3 text-center transition-all"
                      style={{
                        backgroundColor: isActive ? "rgba(181,122,140,0.1)" : "var(--surface-alt)",
                        border: isActive ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                        transform: isActive ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      <p className="text-sm font-semibold" style={{ color: isActive ? "var(--accent)" : "var(--text)" }}>
                        {opt.value}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3 : Communication ────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-base">✍️</span>
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Communication
            </h2>
          </div>

          <div
            className="rounded-[16px] p-5 flex flex-col gap-5"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Ton de communication — cartes visuelles */}
            <div className="field">
              <label className="label">Ton style de communication</label>
              <div className="flex flex-col gap-2">
                {TON_OPTIONS.map((t) => {
                  const isActive = form.tonStyle === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => update("tonStyle", t.value)}
                      className="flex items-center gap-3 rounded-[12px] px-4 py-3.5 text-left transition-all"
                      style={{
                        backgroundColor: isActive ? "rgba(181,122,140,0.08)" : "var(--surface-alt)",
                        border: isActive ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                        transform: isActive ? "scale(1.01)" : "scale(1)",
                      }}
                    >
                      <span className="text-xl shrink-0">{t.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {t.value}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {t.desc}
                        </p>
                      </div>
                      {isActive && (
                        <span className="text-sm font-bold shrink-0" style={{ color: "var(--accent)" }}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clientèle cible */}
            <div className="field">
              <label className="label" htmlFor="publicCible">
                Ta clientèle cible
                <span className="ml-1 font-normal" style={{ color: "var(--text-muted)" }}>(optionnel)</span>
              </label>
              <input
                id="publicCible"
                className="input"
                type="text"
                placeholder="Ex : femmes 25-45 ans, mamans actives, professionnelles…"
                value={form.publicCible}
                onChange={(e) => update("publicCible", e.target.value)}
              />
            </div>

            {/* Hashtags favoris — pills */}
            <div className="field">
              <label className="label">
                Hashtags favoris
                <span className="ml-1 font-normal" style={{ color: "var(--text-muted)" }}>(optionnel)</span>
              </label>

              {form.hashtagsTags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {form.hashtagsTags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: "var(--surface-alt)",
                        color: "var(--text)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag("hashtagsTags", tag)}
                        className="opacity-50 hover:opacity-100 transition-opacity ml-0.5"
                        aria-label={`Supprimer #${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <input
                className="input"
                type="text"
                placeholder="#onglerie (Entrée pour valider)"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag("hashtagsTags", hashtagInput, setHashtagInput);
                  }
                  if (e.key === " ") {
                    e.preventDefault();
                    addTag("hashtagsTags", hashtagInput, setHashtagInput);
                  }
                }}
              />
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Tape un hashtag et appuie sur Entrée ou Espace pour l&apos;ajouter
              </p>
            </div>
          </div>
        </section>

      </form>

      {/* ── Bouton sauvegarder — sticky ──────────────────────── */}
      <div
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        style={{ pointerEvents: dirty || saveStatus !== "idle" ? "auto" : "none" }}
      >
        <div
          className="flex items-center gap-3 rounded-full px-6 py-3 shadow-xl transition-all duration-300"
          style={{
            backgroundColor:
              saveStatus === "saved"
                ? "#2e7d32"
                : saveStatus === "error"
                ? "#CC4444"
                : "var(--accent)",
            opacity: dirty || saveStatus !== "idle" ? 1 : 0,
            transform:
              dirty || saveStatus !== "idle" ? "translateY(0)" : "translateY(16px)",
            color: "#fff",
          }}
        >
          {saveStatus === "saving" && (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="text-sm font-semibold"
            style={{ color: "#fff", background: "none", border: "none", cursor: "pointer" }}
          >
            {saveStatus === "saving"
              ? "Sauvegarde…"
              : saveStatus === "saved"
              ? "✓ Profil sauvegardé !"
              : saveStatus === "error"
              ? "Erreur — réessaie"
              : "💾 Sauvegarder le profil"}
          </button>
        </div>
      </div>

    </div>
  );
}
