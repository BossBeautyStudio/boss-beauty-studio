"use client";

// ============================================================
// app/(dashboard)/dashboard/story-reel/page.tsx
//
// Module Story / Reel Instagram — 3 étapes :
//   Étape 1 : Choix du mode (Story ou Reel)
//   Étape 2 : Formulaire (spécialité + sujet + ton)
//   Étape 3 : Résultat avec slides/scènes + templates Canva gratuits
// ============================================================

import { useState, useEffect } from "react";
import posthog from "posthog-js";
import { useRouter } from "next/navigation";
import { FreeTrialBanner, CopyButton, PaywallBanner } from "@/components/dashboard/FreePaywall";
import { WhatsAppCTA } from "@/components/dashboard/WhatsAppCTA";
import { SaveButton } from "@/components/dashboard/SaveButton";
import { ExportPDFButton } from "@/components/dashboard/ExportPDFButton";
import { exportStoryPDF, exportReelPDF } from "@/lib/exportPDF";
import { useBrandProfile } from "@/hooks/useBrandProfile";
import type { StoryOutput, ReelOutput } from "@/lib/prompts";

// ── Types ────────────────────────────────────────────────────────────────────

type Mode = "story" | "reel";

// ── Constantes ────────────────────────────────────────────────────────────────

const TONE_OPTIONS = [
  "Chaleureux et proche",
  "Expert et éducatif",
  "Inspirant et motivant",
  "Fun et décalé",
  "Professionnel et élégant",
];

const SPECIALITE_PILLS = [
  "Onglerie",
  "Coiffure",
  "Esthétique",
  "Maquillage",
  "Cils & sourcils",
  "Massage",
];

// ── Templates Canva par mode ───────────────────────────────────────────────────

const CANVA_STORY = [
  {
    label: "Story beauté conseils",
    url: "https://www.canva.com/templates/?query=beauty+tips+instagram+story",
  },
  {
    label: "Story promotion salon",
    url: "https://www.canva.com/templates/?query=beauty+salon+promotion+instagram+story",
  },
  {
    label: "Story avant / après",
    url: "https://www.canva.com/templates/?query=before+after+beauty+instagram+story",
  },
];

const CANVA_REEL = [
  {
    label: "Miniature Reel beauté",
    url: "https://www.canva.com/templates/?query=instagram+reels+cover+beauty",
  },
  {
    label: "Reel conseils beauté",
    url: "https://www.canva.com/templates/?query=beauty+tips+reels+instagram+video",
  },
  {
    label: "Reel avant / après",
    url: "https://www.canva.com/templates/?query=before+after+beauty+reels+video",
  },
];

// ── Conseils ──────────────────────────────────────────────────────────────────

const CONSEILS_STORY = [
  "Les Stories ont une durée de vie de 24h, mais leur impact peut durer des jours : épingle tes meilleures séquences dans des Highlights thématiques (Soins, Conseils, Avant/Après) pour qu'elles continuent de convertir long après leur publication.",
  "La première Story de ta séquence est la plus importante — c'est elle que voient les personnes qui n'ont pas encore cliqué. Assure-toi qu'elle pose une question ou un problème auquel ta cible s'identifie immédiatement.",
  "Utilise les sondages et questions dans tes Stories pour te créer des idées de contenu illimitées. Une réponse fréquente = un sujet que ton audience veut absolument voir traité.",
];

const CONSEILS_REEL = [
  "Les 3 premières secondes de ton Reel décident de tout. Si l'accroche n'arrête pas le scroll, personne ne verra la suite. Teste plusieurs versions du même début — change juste la première phrase — et observe lequel performe le mieux.",
  "Tu n'as pas besoin de matériel professionnel pour faire des Reels qui convertissent. Un smartphone bien tenu, une bonne lumière naturelle de face, et un fond propre et rangé suffisent. La qualité du contenu prime sur la qualité technique.",
  "Réutilise chaque Reel au maximum : publie-le en Story 24h après avec un sondage ('Utile ou pas ?'), épingle-le sur ton profil si les premières 24h sont bonnes, et mentionne-le en DM à tes clientes les plus actives.",
];

// ── Étape 1 — Sélection du mode ───────────────────────────────────────────────

function ModeSelector({ onSelect }: { onSelect: (m: Mode) => void }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Story & Reel Instagram
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Les formats éphémères et vidéo qui rapprochent de tes clientes.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Card Story */}
        <button
          type="button"
          onClick={() => onSelect("story")}
          className="flex flex-col gap-3 rounded-[18px] px-5 py-6 text-left transition-all hover:shadow-md"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <span className="text-3xl">📸</span>
          <div>
            <p className="mb-1 text-base font-semibold" style={{ color: "var(--text)" }}>
              Séquence Stories
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              4 à 5 slides prêtes à publier — texte, visuel suggéré, emoji, CTA final.
              Format portrait 9:16.
            </p>
          </div>
          <div className="mt-auto flex flex-wrap gap-1.5">
            {["Éducatif", "Coulisses", "Promo", "Avant/Après"].map((tag) => (
              <span key={tag} className="badge" style={{ fontSize: "0.68rem" }}>{tag}</span>
            ))}
          </div>
        </button>

        {/* Card Reel */}
        <button
          type="button"
          onClick={() => onSelect("reel")}
          className="flex flex-col gap-3 rounded-[18px] px-5 py-6 text-left transition-all hover:shadow-md"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <span className="text-3xl">🎬</span>
          <div>
            <p className="mb-1 text-base font-semibold" style={{ color: "var(--text)" }}>
              Script Reel
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Script complet scène par scène (15-25 sec) — accroche, actions à filmer,
              textes overlay, caption + musique.
            </p>
          </div>
          <div className="mt-auto flex flex-wrap gap-1.5">
            {["Astuce", "Tuto rapide", "Transformation", "Coulisses"].map((tag) => (
              <span key={tag} className="badge" style={{ fontSize: "0.68rem" }}>{tag}</span>
            ))}
          </div>
        </button>
      </div>

      {/* Bloc explicatif */}
      <div
        className="rounded-[14px] px-5 py-4"
        style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
      >
        <p className="mb-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
          📱 Pourquoi publier des Stories & Reels ?
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Les Stories créent de la proximité et de la fidélité — tes abonnées les plus actives
          les regardent chaque jour. Les Reels touchent de{" "}
          <span className="font-medium" style={{ color: "var(--text)" }}>nouvelles personnes</span>{" "}
          grâce à l&apos;algorithme de découverte. Ensemble, ils équilibrent ta stratégie :
          fidéliser + attirer.
        </p>
      </div>
    </div>
  );
}

// ── Étape 2 — Formulaire ──────────────────────────────────────────────────────

function StoryReelForm({
  mode,
  onBack,
  onResult,
  isFree,
  freeRemaining,
}: {
  mode: Mode;
  onBack: () => void;
  onResult: (
    data: StoryOutput | ReelOutput,
    isFree: boolean,
    freeRemaining: number,
    params: { specialite: string; sujet: string; tonStyle: string }
  ) => void;
  isFree: boolean;
  freeRemaining: number;
}) {
  const router = useRouter();
  const { profile } = useBrandProfile();

  const [specialite, setSpecialite] = useState("");
  const [sujet, setSujet] = useState("");
  const [tonStyle, setTonStyle] = useState(TONE_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplissage profil de marque
  useEffect(() => {
    if (!profile) return;
    if (profile.specialite) setSpecialite((prev) => prev || profile.specialite!);
    if (profile.ton_style) {
      const match = TONE_OPTIONS.find((t) => t === profile.ton_style);
      if (match) setTonStyle(match);
    }
  }, [profile]);

  const isStory = mode === "story";
  const label = isStory ? "Story" : "Reel";
  const icon = isStory ? "📸" : "🎬";

  const SUJET_EXAMPLES = isStory
    ? ["Erreur fréquente à éviter", "Avant / après prestation", "Promo de la semaine", "Coulisses de mon travail"]
    : ["Astuce rapide en 20 sec", "Transformation avant/après", "La question qu'on me pose tout le temps", "Ma journée type"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate/story-reel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, specialite, sujet, tonStyle }),
      });

      const body = await res.json();

      if (res.status === 402 && body.paywallRequired) {
        onResult(
          isStory
            ? { titre: "", slides: [], hashtags: [], cta: "" }
            : { accroche: "", scenes: [], caption: "", hashtags: [], musique: "" },
          true,
          0,
          { specialite, sujet, tonStyle }
        );
        return;
      }

      if (!res.ok) {
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      onResult(body.data, body.isFree ?? false, body.freeRemaining ?? 0, {
        specialite,
        sujet,
        tonStyle,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <button
          type="button"
          className="mb-4 flex items-center gap-1.5 text-sm"
          style={{ color: "var(--text-muted)" }}
          onClick={onBack}
        >
          <span>←</span> Changer de format
        </button>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
              {isStory ? "Séquence Stories" : "Script Reel"}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {isStory
                ? "4-5 slides prêtes à publier, avec texte, visuel et CTA."
                : "Script scène par scène pour un Reel de 15-25 secondes."}
            </p>
          </div>
        </div>
      </div>

      {isFree && <FreeTrialBanner freeRemaining={freeRemaining} />}
      {isFree && freeRemaining <= 0 && <PaywallBanner freeRemaining={0} />}

      {/* Exemples de sujets */}
      <div
        className="mb-6 rounded-[12px] px-4 py-4"
        style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
      >
        <p className="mb-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          Sujets qui fonctionnent bien en {label}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUJET_EXAMPLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSujet(s)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: sujet === s ? "var(--accent)" : "var(--surface)",
                color: sujet === s ? "#fff" : "var(--text-muted)",
                border: sujet === s ? "1px solid var(--accent)" : "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ maxWidth: "540px" }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Spécialité */}
          <div className="field">
            <label className="label" htmlFor="specialite">
              Ta spécialité *
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {SPECIALITE_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setSpecialite(pill)}
                  disabled={loading}
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
              required
              disabled={loading}
            />
          </div>

          {/* Sujet */}
          <div className="field">
            <label className="label" htmlFor="sujet">
              Sujet / thème *
            </label>
            <input
              id="sujet"
              className="input"
              type="text"
              placeholder={
                isStory
                  ? "Ex : 3 erreurs à éviter, avant/après client, promo de la semaine…"
                  : "Ex : astuce rapide, transformation, question fréquente…"
              }
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Ton */}
          <div className="field">
            <label className="label" htmlFor="tonStyle">
              Ton style de communication *
            </label>
            <select
              id="tonStyle"
              className="select"
              value={tonStyle}
              onChange={(e) => setTonStyle(e.target.value)}
              disabled={loading}
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#cc4444" }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !specialite.trim() || !sujet.trim()}
          >
            {loading
              ? isStory ? "Création de ta séquence… ✨" : "Script Reel en cours… ✨"
              : isStory ? "Générer mes Stories →" : "Générer mon script Reel →"}
          </button>

          {!loading && (
            <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
              Génération en ~10 secondes ·{" "}
              {isStory ? "4-5 slides prêtes à publier" : "Script scène par scène + caption"}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Étape 3 — Résultat Story ──────────────────────────────────────────────────

function StoryResult({
  result,
  isFree,
  freeRemaining,
  onReset,
  params,
}: {
  result: StoryOutput;
  isFree: boolean;
  freeRemaining: number;
  onReset: () => void;
  params: { specialite: string; sujet: string; tonStyle: string };
}) {
  const [conseil] = useState<string>(
    () => CONSEILS_STORY[Math.floor(Math.random() * CONSEILS_STORY.length)]
  );

  const isFullPaywall = isFree && freeRemaining <= 0 && result.slides.length === 0;

  if (isFullPaywall) {
    return (
      <div className="slide-up">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Limite atteinte</h2>
          <button className="btn btn-secondary" onClick={onReset}>Recommencer</button>
        </div>
        <PaywallBanner freeRemaining={0} />
      </div>
    );
  }

  return (
    <div className="slide-up">
      {/* En-tête */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📸</span>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Ta séquence Stories
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportPDFButton
            onExport={() =>
              exportStoryPDF(result, { specialite: params.specialite, sujet: params.sujet })
            }
          />
          <button className="btn btn-secondary" onClick={onReset}>Nouvelles Stories</button>
        </div>
      </div>

      {/* Titre interne */}
      {result.titre && (
        <div
          className="mb-4 rounded-[12px] px-4 py-3"
          style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Série
          </p>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{result.titre}</p>
        </div>
      )}

      {/* Slides */}
      <div className="mb-4 flex flex-col gap-3">
        {result.slides.map((slide) => (
          <div
            key={slide.numero}
            className="card"
            style={{ borderLeft: "3px solid var(--accent)" }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {slide.numero}
              </span>
              <span className="text-lg">{slide.emoji}</span>
            </div>

            {/* Texte de la slide */}
            <p className="mb-3 text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
              &ldquo;{slide.texte}&rdquo;
            </p>

            {/* Visuel suggéré */}
            <div
              className="mb-3 rounded-[8px] px-3 py-2.5"
              style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
            >
              <p className="mb-0.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                📷 Visuel à filmer
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                {slide.visuel}
              </p>
            </div>

            <div className="flex gap-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.6rem" }}>
              <CopyButton
                text={slide.texte}
                label="Copier le texte"
                isFree={isFree}
                freeRemaining={freeRemaining}
                className="btn btn-secondary"
              />
            </div>
          </div>
        ))}
      </div>

      {/* CTA + Hashtags */}
      <div className="card mb-4">
        <div className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            CTA — Dernière slide
          </p>
          <div
            className="rounded-[10px] px-4 py-3"
            style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              {result.cta}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Hashtags
            </p>
            <CopyButton
              text={result.hashtags.join(" ")}
              label="Copier"
              isFree={isFree}
              freeRemaining={freeRemaining}
              className="btn btn-secondary shrink-0"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.hashtags.map((tag) => (
              <span key={tag} className="badge">{tag}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div
          className="mt-4 flex flex-wrap gap-2"
          style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}
        >
          <SaveButton
            module="story"
            title={`Stories ${params.sujet}${params.specialite ? ` — ${params.specialite}` : ""}`}
            content={result as unknown as Record<string, unknown>}
            params={params}
          />
        </div>
      </div>

      {/* Canva Story */}
      <div
        className="mb-4 rounded-[14px] px-5 py-5"
        style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
      >
        <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
          📐 Mettre en forme sur{" "}
          <span style={{ color: "var(--accent)" }}>Canva gratuit</span>
        </p>
        <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Choisis un template Story portrait (1080 × 1920 px), colle le texte de chaque slide,
          ajoute ton visuel — prêt en quelques minutes.
        </p>
        <div className="flex flex-wrap gap-2">
          {CANVA_STORY.map((t) => (
            <a
              key={t.label}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.85rem" }}
            >
              {t.label} ↗
            </a>
          ))}
        </div>

        {/* Guide en 3 étapes */}
        <div
          className="mt-4 rounded-[10px] px-4 py-4"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="mb-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            Créer ta Story en 3 clics
          </p>
          <div className="flex flex-col gap-3">
            {[
              {
                titre: "Duplique le template",
                detail: "Ouvre un template Story, clique 'Personnaliser ce modèle'. Duplique-le autant de fois qu'il y a de slides.",
              },
              {
                titre: "Colle les textes",
                detail: "Remplace le texte du template par le texte de chaque slide généré ci-dessus.",
              },
              {
                titre: "Ajoute le visuel",
                detail: "Insère ta photo ou vidéo en fond. Format : 1080 × 1920 px. Télécharge chaque slide séparément en PNG.",
              },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{step.titre}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow */}
      <div
        className="mb-4 rounded-[14px] px-5 py-4"
        style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Continuer avec ce contenu
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/dashboard/post?contexte=${encodeURIComponent((params.sujet || "").slice(0, 100))}&from=story`}
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem" }}
          >
            📝 Adapter en post
          </a>
          <a
            href={`/dashboard/carousel?sujet=${encodeURIComponent((params.sujet || "").slice(0, 100))}&from=story`}
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem" }}
          >
            🖼️ En carrousel
          </a>
        </div>
      </div>

      {/* Conseil */}
      <div
        className="mb-4 rounded-[12px] px-5 py-4"
        style={{ backgroundColor: "var(--surface-alt)", borderLeft: "3px solid var(--accent)" }}
      >
        <p className="mb-1.5 text-sm font-semibold" style={{ color: "var(--text)" }}>
          💡 Conseil Boss Beauty Studio
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{conseil}</p>
      </div>

      {isFree && <PaywallBanner freeRemaining={freeRemaining} />}
      <WhatsAppCTA />
    </div>
  );
}

// ── Étape 3 — Résultat Reel ───────────────────────────────────────────────────

function ReelResult({
  result,
  isFree,
  freeRemaining,
  onReset,
  params,
}: {
  result: ReelOutput;
  isFree: boolean;
  freeRemaining: number;
  onReset: () => void;
  params: { specialite: string; sujet: string; tonStyle: string };
}) {
  const [editedCaption, setEditedCaption] = useState(result.caption);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [conseil] = useState<string>(
    () => CONSEILS_REEL[Math.floor(Math.random() * CONSEILS_REEL.length)]
  );

  useEffect(() => {
    setEditedCaption(result.caption);
    setIsEditingCaption(false);
  }, [result.caption]);

  const isFullPaywall = isFree && freeRemaining <= 0 && result.scenes.length === 0;

  if (isFullPaywall) {
    return (
      <div className="slide-up">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Limite atteinte</h2>
          <button className="btn btn-secondary" onClick={onReset}>Recommencer</button>
        </div>
        <PaywallBanner freeRemaining={0} />
      </div>
    );
  }

  // Couleur par scène (alternance)
  const SCENE_COLORS = ["var(--accent)", "#6b9fd4", "#9b7fd4", "#7fc9a0", "#d4976b"];

  return (
    <div className="slide-up">
      {/* En-tête */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎬</span>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Ton script Reel
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportPDFButton
            onExport={() =>
              exportReelPDF(result, { specialite: params.specialite, sujet: params.sujet })
            }
          />
          <button className="btn btn-secondary" onClick={onReset}>Nouveau Reel</button>
        </div>
      </div>

      {/* Accroche */}
      <div
        className="mb-4 card"
        style={{ borderLeft: "4px solid var(--accent)" }}
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
          ⚡ Accroche — 3 premières secondes
        </p>
        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
          {result.accroche}
        </p>
      </div>

      {/* Script scènes */}
      <div className="mb-4 flex flex-col gap-2">
        {result.scenes.map((scene, idx) => {
          const color = SCENE_COLORS[idx % SCENE_COLORS.length];
          return (
            <div
              key={scene.numero}
              className="card"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {scene.numero}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: "var(--surface-alt)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                >
                  {scene.duree}
                </span>
              </div>

              {/* Action à filmer */}
              <div className="mb-2">
                <p className="mb-0.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  🎥 Action
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                  {scene.action}
                </p>
              </div>

              {/* Texte overlay */}
              <div
                className="rounded-[8px] px-3 py-2"
                style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
              >
                <p className="mb-0.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  💬 Texte overlay
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {scene.overlay}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Musique */}
      <div
        className="mb-4 rounded-[10px] px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
      >
        <span className="text-lg">🎵</span>
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Musique suggérée</p>
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{result.musique}</p>
        </div>
      </div>

      {/* Caption */}
      <div className="card mb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Caption du post
          </p>
          <CopyButton
            text={editedCaption}
            label="Copier"
            isFree={isFree}
            freeRemaining={freeRemaining}
            className="btn btn-secondary shrink-0"
          />
        </div>

        {isEditingCaption ? (
          <textarea
            className="textarea mb-4"
            value={editedCaption}
            onChange={(e) => setEditedCaption(e.target.value)}
            rows={7}
          />
        ) : (
          <p className="mb-4 whitespace-pre-line text-sm leading-relaxed" style={{ color: "var(--text)" }}>
            {editedCaption}
          </p>
        )}

        {/* Hashtags */}
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Hashtags
          </p>
          <CopyButton
            text={result.hashtags.join(" ")}
            label="Copier"
            isFree={isFree}
            freeRemaining={freeRemaining}
            className="btn btn-secondary shrink-0"
          />
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {result.hashtags.map((tag) => (
            <span key={tag} className="badge">{tag}</span>
          ))}
        </div>

        {/* Actions */}
        <div
          className="flex flex-wrap gap-2"
          style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem" }}
            onClick={() => setIsEditingCaption((v) => !v)}
          >
            {isEditingCaption ? "💾 Enregistrer" : "✏️ Modifier"}
          </button>
          <SaveButton
            module="reel"
            title={`Reel ${params.sujet}${params.specialite ? ` — ${params.specialite}` : ""}`}
            content={{
              accroche: result.accroche,
              scenes: result.scenes,
              caption: editedCaption,
              hashtags: result.hashtags,
              musique: result.musique,
            }}
            params={params}
          />
        </div>
      </div>

      {/* Canva Reel */}
      <div
        className="mb-4 rounded-[14px] px-5 py-5"
        style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
      >
        <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
          🎨 Templates visuels sur{" "}
          <span style={{ color: "var(--accent)" }}>Canva gratuit</span>
        </p>
        <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Crée ta miniature Reel (cover) et prépare tes textes overlay avec ces templates.
          Format Reel : 1080 × 1920 px.
        </p>
        <div className="flex flex-wrap gap-2">
          {CANVA_REEL.map((t) => (
            <a
              key={t.label}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.85rem" }}
            >
              {t.label} ↗
            </a>
          ))}
        </div>

        {/* Astuce tournage */}
        <div
          className="mt-4 rounded-[10px] px-4 py-4"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            🎥 Tourner ton Reel seule — les bases
          </p>
          <div className="flex flex-col gap-2">
            {[
              "Lumière : fenêtre de face ou ring light — évite les contre-jours.",
              "Son : parle clairement. Un micro-cravate à 15€ change tout si tu fais des voix off.",
              "Rythme : respecte les durées indiquées par scène pour rester sous 25 secondes.",
            ].map((tip, i) => (
              <p key={i} className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                <span className="font-semibold" style={{ color: "var(--accent)" }}>·</span>{" "}
                {tip}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow */}
      <div
        className="mb-4 rounded-[14px] px-5 py-4"
        style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Continuer avec ce contenu
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/dashboard/hooks?sujet=${encodeURIComponent((params.sujet || "").slice(0, 100))}&from=reel`}
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem" }}
          >
            ⚡ Générer les accroches
          </a>
          <a
            href={`/dashboard/post?contexte=${encodeURIComponent((params.sujet || "").slice(0, 100))}&from=reel`}
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem" }}
          >
            📝 En post Instagram
          </a>
        </div>
      </div>

      {/* Conseil */}
      <div
        className="mb-4 rounded-[12px] px-5 py-4"
        style={{ backgroundColor: "var(--surface-alt)", borderLeft: "3px solid var(--accent)" }}
      >
        <p className="mb-1.5 text-sm font-semibold" style={{ color: "var(--text)" }}>
          💡 Conseil Boss Beauty Studio
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{conseil}</p>
      </div>

      {isFree && <PaywallBanner freeRemaining={freeRemaining} />}
      <WhatsAppCTA />
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────

export default function StoryReelPage() {
  type Step = "mode" | "form" | "result";

  const [step, setStep] = useState<Step>("mode");
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [result, setResult] = useState<StoryOutput | ReelOutput | null>(null);
  const [lastParams, setLastParams] = useState<{
    specialite: string;
    sujet: string;
    tonStyle: string;
  } | null>(null);
  const [isFree, setIsFree] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState(0);

  // Charger le statut de quota au montage
  useEffect(() => {
    fetch("/api/user/quota")
      .then((r) => r.json())
      .then((body) => {
        if (body.isSubscriber === false) {
          setIsFree(true);
          setFreeRemaining(body.freeRemaining ?? 0);
        }
      })
      .catch(() => {/* silently ignore */});
  }, []);

  function handleModeSelect(mode: Mode) {
    setSelectedMode(mode);
    setStep("form");
  }

  function handleResult(
    data: StoryOutput | ReelOutput,
    free: boolean,
    freeRem: number,
    params: { specialite: string; sujet: string; tonStyle: string }
  ) {
    setResult(data);
    setLastParams(params);
    setIsFree(free);
    setFreeRemaining(freeRem);
    posthog.capture("generate_post", { module: selectedMode });
    setStep("result");
  }

  function handleReset() {
    setResult(null);
    setStep("mode");
    setSelectedMode(null);
  }

  return (
    <div className="fade-in">
      {step === "mode" && <ModeSelector onSelect={handleModeSelect} />}

      {step === "form" && selectedMode && (
        <StoryReelForm
          mode={selectedMode}
          onBack={() => setStep("mode")}
          onResult={handleResult}
          isFree={isFree}
          freeRemaining={freeRemaining}
        />
      )}

      {step === "result" && result && selectedMode === "story" && lastParams && (
        <StoryResult
          result={result as StoryOutput}
          isFree={isFree}
          freeRemaining={freeRemaining}
          onReset={handleReset}
          params={lastParams}
        />
      )}

      {step === "result" && result && selectedMode === "reel" && lastParams && (
        <ReelResult
          result={result as ReelOutput}
          isFree={isFree}
          freeRemaining={freeRemaining}
          onReset={handleReset}
          params={lastParams}
        />
      )}
    </div>
  );
}
