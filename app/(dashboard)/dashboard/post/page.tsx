"use client";

// ============================================================
// app/(dashboard)/dashboard/post/page.tsx
//
// Module Post Instagram — générateur à 3 étapes.
//
// Étape 1 : Choix du type de post (7 types avec exemples réels)
// Étape 2 : Formulaire (spécialité + ton + contexte optionnel)
// Étape 3 : Résultat avec copy buttons + paywall si essai gratuit
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { POST_TYPES, type PostOutput } from "@/lib/prompts";
import { CopyButton, PaywallBanner } from "@/components/dashboard/FreePaywall";

const TONE_OPTIONS = [
  "Chaleureux et proche",
  "Expert et éducatif",
  "Inspirant et motivant",
  "Professionnel et élégant",
  "Fun et décalé",
];

const SPECIALITE_PILLS = [
  "Onglerie",
  "Coiffure",
  "Esthétique",
  "Extensions de cils",
  "Maquillage",
  "Massage",
];

// ── Step 1 : sélection du type ────────────────────────────────────────────────

function TypeSelector({
  selected,
  onSelect,
  onNext,
}: {
  selected: (typeof POST_TYPES)[number] | null;
  onSelect: (t: (typeof POST_TYPES)[number]) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="mb-8">
        <h1
          className="mb-1 text-2xl font-semibold"
          style={{ color: "var(--text)" }}
        >
          Post Instagram
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Choisis le type de post que tu veux créer.
        </p>
      </div>

      {/* Grille des 5 types */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {POST_TYPES.map((type) => {
          const isSelected = selected?.id === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type)}
              className="flex flex-col gap-2 rounded-[16px] px-4 py-4 text-left transition-all"
              style={{
                backgroundColor: isSelected ? "var(--surface-alt)" : "var(--surface)",
                border: isSelected
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border)",
                outline: "none",
              }}
            >
              <span className="text-xl">{type.icon}</span>
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--text)" }}
              >
                {type.label}
              </span>
              <span
                className="text-xs leading-snug"
                style={{ color: "var(--text-muted)" }}
              >
                {type.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Exemple réel du type sélectionné */}
      {selected && (
        <div className="slide-up mb-8">
          <div
            className="rounded-[16px] overflow-hidden"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            {/* En-tête */}
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{
                backgroundColor: "var(--surface-alt)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span className="text-base">{selected.icon}</span>
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Exemple — {selected.label}
              </p>
            </div>

            {/* Caption exemple */}
            <div className="px-5 py-5">
              <p
                className="mb-4 whitespace-pre-line text-sm leading-relaxed"
                style={{ color: "var(--text)" }}
              >
                {selected.example.caption}
              </p>

              {/* Hashtags exemple */}
              <div className="flex flex-wrap gap-1.5">
                {selected.example.hashtags.map((tag) => (
                  <span key={tag} className="badge">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Voilà le style de post que Boss Beauty Studio génère pour toi
              </p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: "0.875rem", padding: "0.55rem 1.25rem" }}
                onClick={onNext}
              >
                Générer un post similaire →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA si aucun type sélectionné */}
      {!selected && (
        <p
          className="text-center text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Sélectionne un type de post ci-dessus pour voir un exemple.
        </p>
      )}
    </div>
  );
}

// ── Step 2 : formulaire ───────────────────────────────────────────────────────

function PostForm({
  selectedType,
  onBack,
  onResult,
}: {
  selectedType: (typeof POST_TYPES)[number];
  onBack: () => void;
  onResult: (data: PostOutput, isFree: boolean, freeRemaining: number) => void;
}) {
  const router = useRouter();

  const [specialite, setSpecialite] = useState("");
  const [tonStyle, setTonStyle] = useState(TONE_OPTIONS[0]);
  const [contexte, setContexte] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typePost: selectedType.label,
          specialite,
          tonStyle,
          contexte: contexte.trim() || undefined,
        }),
      });

      const body = await res.json();

      if (res.status === 402 && body.paywallRequired) {
        // Quota gratuit épuisé — onResult avec flag paywall
        onResult(
          {
            hook: "",
            caption: "",
            hashtags: [],
            ideeStory: "",
            ideeReel: null,
          },
          true,
          0
        );
        return;
      }

      if (!res.ok) {
        // Pour toutes les erreurs serveur (5xx), on affiche un message simple
        const isServerError = res.status >= 500;
        throw new Error(
          isServerError
            ? "Le générateur est momentanément indisponible. Réessaie dans quelques secondes."
            : (body.error ?? `Erreur ${res.status}`)
        );
      }

      onResult(body.data, body.isFree ?? false, body.freeRemaining ?? 0);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-8">
        <button
          type="button"
          className="mb-4 flex items-center gap-1.5 text-sm"
          style={{ color: "var(--text-muted)" }}
          onClick={onBack}
        >
          <span>←</span> Changer de type
        </button>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selectedType.icon}</span>
          <div>
            <h1
              className="text-2xl font-semibold"
              style={{ color: "var(--text)" }}
            >
              {selectedType.label}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {selectedType.description}
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "520px" }}>
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
                    backgroundColor:
                      specialite === pill
                        ? "var(--accent)"
                        : "var(--surface-alt)",
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
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Contexte optionnel */}
          <div className="field">
            <label className="label" htmlFor="contexte">
              Contexte supplémentaire{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                (optionnel)
              </span>
            </label>
            <input
              id="contexte"
              className="input"
              type="text"
              placeholder="Ex : j'ai une promo cette semaine, je viens de passer une certification…"
              value={contexte}
              onChange={(e) => setContexte(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#cc4444" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !specialite.trim()}
          >
            {loading ? "Génération en cours… ✨" : "Générer mon post →"}
          </button>

          {!loading && (
            <p
              className="text-center text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Génération en ~10 secondes · Post prêt à copier-coller
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Step 3 : résultat ─────────────────────────────────────────────────────────

function PostResult({
  result,
  selectedType,
  isFree,
  freeRemaining,
  onReset,
}: {
  result: PostOutput;
  selectedType: (typeof POST_TYPES)[number];
  isFree: boolean;
  freeRemaining: number;
  onReset: () => void;
}) {
  // Cas paywall total (quota gratuit épuisé avant génération)
  const isFullPaywall = isFree && freeRemaining <= 0 && !result.caption;

  if (isFullPaywall) {
    return (
      <div className="slide-up">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Limite atteinte
          </h2>
          <button className="btn btn-secondary" onClick={onReset}>
            Recommencer
          </button>
        </div>
        <PaywallBanner freeRemaining={0} />
      </div>
    );
  }

  return (
    <div className="slide-up">
      {/* En-tête résultat */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{selectedType.icon}</span>
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text)" }}
          >
            {selectedType.label}
          </h2>
        </div>
        <button className="btn btn-secondary" onClick={onReset}>
          Nouveau post
        </button>
      </div>

      {/* Card résultat */}
      <div
        className="mb-4 overflow-hidden rounded-[18px]"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Première phrase */}
        <div
          className="px-5 py-4"
          style={{
            backgroundColor: "var(--surface-alt)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <p
            className="mb-1 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Première phrase
          </p>
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {result.hook}
          </p>
        </div>

        {/* Texte du post */}
        <div className="px-5 py-5">
          <div className="mb-3 flex items-center justify-between">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Texte du post
            </p>
            <CopyButton
              text={result.caption}
              label="Copier le texte"
              isFree={isFree}
              freeRemaining={freeRemaining}
            />
          </div>

          <p
            className="mb-4 whitespace-pre-line text-sm leading-relaxed"
            style={{ color: "var(--text)" }}
          >
            {result.caption}
          </p>

          {/* Hashtags */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {result.hashtags.map((tag) => (
              <span key={tag} className="badge">
                {tag}
              </span>
            ))}
          </div>

          <CopyButton
            text={[result.caption, "", result.hashtags.join(" ")].join("\n")}
            label="Copier texte + hashtags"
            isFree={isFree}
            freeRemaining={freeRemaining}
          />
        </div>

        {/* Story & Reel */}
        <div
          className="grid gap-3 px-5 py-4 sm:grid-cols-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Story */}
          <div
            className="rounded-[10px] px-3 py-2.5"
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

          {/* Reel */}
          {result.ideeReel && (
            <div
              className="rounded-[10px] px-3 py-2.5"
              style={{
                backgroundColor: "var(--bg)",
                borderLeft: "3px solid #9b7fd4",
              }}
            >
              <p
                className="mb-1 text-xs font-semibold"
                style={{ color: "#9b7fd4" }}
              >
                🎬 Idée Reel
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text)" }}
              >
                {result.ideeReel}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Paywall banner si essai gratuit */}
      {isFree && <PaywallBanner freeRemaining={freeRemaining} />}

      {/* Conseil si abonné */}
      {!isFree && (
        <div
          className="mt-4 rounded-[12px] px-5 py-4"
          style={{
            backgroundColor: "var(--surface-alt)",
            borderLeft: "3px solid var(--accent)",
          }}
        >
          <p
            className="mb-1 text-sm font-semibold"
            style={{ color: "var(--text)" }}
          >
            💡 Conseil Boss Beauty Studio
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Publie ce post, puis utilise le module{" "}
            <span className="font-medium" style={{ color: "var(--text)" }}>
              Hooks Instagram
            </span>{" "}
            pour générer 10 accroches supplémentaires du même type — parfait pour varier
            sans jamais manquer d&apos;inspiration.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function PostPage() {
  type Step = "type" | "form" | "result";

  const [step, setStep] = useState<Step>("type");
  const [selectedType, setSelectedType] = useState<
    (typeof POST_TYPES)[number] | null
  >(null);
  const [result, setResult] = useState<PostOutput | null>(null);
  const [isFree, setIsFree] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState(0);

  function handleTypeSelect(type: (typeof POST_TYPES)[number]) {
    setSelectedType(type);
  }

  function handleTypeNext() {
    if (selectedType) setStep("form");
  }

  function handleResult(
    data: PostOutput,
    free: boolean,
    freeRem: number
  ) {
    setResult(data);
    setIsFree(free);
    setFreeRemaining(freeRem);
    setStep("result");
  }

  function handleReset() {
    setResult(null);
    setStep("type");
    setSelectedType(null);
  }

  return (
    <div className="fade-in">
      {step === "type" && (
        <TypeSelector
          selected={selectedType}
          onSelect={handleTypeSelect}
          onNext={handleTypeNext}
        />
      )}

      {step === "form" && selectedType && (
        <PostForm
          selectedType={selectedType}
          onBack={() => setStep("type")}
          onResult={handleResult}
        />
      )}

      {step === "result" && result && selectedType && (
        <PostResult
          result={result}
          selectedType={selectedType}
          isFree={isFree}
          freeRemaining={freeRemaining}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
