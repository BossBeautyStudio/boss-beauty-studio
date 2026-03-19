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

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { POST_TYPES, type PostOutput } from "@/lib/prompts";
import { FreeTrialBanner, CopyButton, PaywallBanner } from "@/components/dashboard/FreePaywall";
import { WhatsAppCTA } from "@/components/dashboard/WhatsAppCTA";
import { SaveButton } from "@/components/dashboard/SaveButton";
import { useBrandProfile } from "@/hooks/useBrandProfile";

// ── Types partagés ────────────────────────────────────────────────────────────

interface PostParams {
  typePost: string;
  specialite: string;
  tonStyle: string;
  contexte?: string;
}

// ── Structure pour futures transformations rapides ────────────────────────────
// Décommenter + brancher sur une API IA quand prêt
// const QUICK_TRANSFORMS = [
//   { id: "plus-vendeur", label: "💰 Plus vendeur" },
//   { id: "plus-court",   label: "✂️ Plus court"   },
//   { id: "plus-naturel", label: "🌿 Plus naturel"  },
// ] as const;

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

// ── Mapping type de post → templates Canva ────────────────────────────────────
// Structure extensible : plusieurs templates possibles par type
const CANVA_POST_TEMPLATES: Record<string, { label: string; url: string }[]> = {
  attirer: [
    {
      label: "Template marketing beauté",
      url: "https://www.canva.com/templates/?query=beauty+salon+marketing+instagram+post",
    },
    {
      label: "Template call to action",
      url: "https://www.canva.com/templates/?query=beauty+call+to+action+instagram+post",
    },
  ],
  "avant-apres": [
    {
      label: "Template avant / après",
      url: "https://www.canva.com/templates/?query=before+after+transformation+beauty+instagram+post",
    },
    {
      label: "Template transformation",
      url: "https://www.canva.com/templates/?query=beauty+transformation+instagram+post",
    },
  ],
  promo: [
    {
      label: "Template promotion",
      url: "https://www.canva.com/templates/?query=beauty+salon+promotion+sale+instagram+post",
    },
    {
      label: "Template offre spéciale",
      url: "https://www.canva.com/templates/?query=beauty+special+offer+instagram+post",
    },
  ],
  conseil: [
    {
      label: "Template conseil beauté",
      url: "https://www.canva.com/templates/?query=beauty+tips+educational+instagram+post",
    },
    {
      label: "Template astuce du jour",
      url: "https://www.canva.com/templates/?query=beauty+tip+of+the+day+instagram+post",
    },
  ],
  "reponse-dm": [
    {
      label: "Template Q&A beauté",
      url: "https://www.canva.com/templates/?query=beauty+question+answer+instagram+post",
    },
    {
      label: "Template éducatif",
      url: "https://www.canva.com/templates/?query=beauty+educational+instagram+post",
    },
  ],
};

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
  isFree,
  freeRemaining,
}: {
  selectedType: (typeof POST_TYPES)[number];
  onBack: () => void;
  onResult: (data: PostOutput, isFree: boolean, freeRemaining: number, params: PostParams) => void;
  isFree: boolean;
  freeRemaining: number;
}) {
  const router = useRouter();
  const { profile } = useBrandProfile();

  const [specialite, setSpecialite] = useState("");
  const [tonStyle, setTonStyle] = useState(TONE_OPTIONS[0]);
  const [contexte, setContexte] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplissage depuis le profil de marque
  useEffect(() => {
    if (!profile) return;
    if (profile.specialite) setSpecialite((prev) => prev || profile.specialite!);
    if (profile.ton_style) {
      const match = TONE_OPTIONS.find((t) => t === profile.ton_style);
      if (match) setTonStyle(match);
    }
  }, [profile]);

  // Pré-remplissage depuis URL params (venant d'un autre module)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("contexte");
    if (c) setContexte(decodeURIComponent(c));
  }, []);

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
          0,
          { typePost: selectedType.label, specialite, tonStyle, contexte: contexte.trim() || undefined }
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

      onResult(body.data, body.isFree ?? false, body.freeRemaining ?? 0, {
        typePost: selectedType.label,
        specialite,
        tonStyle,
        contexte: contexte.trim() || undefined,
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

      {/* Bandeau essai gratuit */}
      {isFree && <FreeTrialBanner freeRemaining={freeRemaining} />}

      {/* Paywall si quota épuisé avant même de soumettre */}
      {isFree && freeRemaining <= 0 && (
        <PaywallBanner freeRemaining={0} />
      )}

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
  onRegenerate,
  regenerating,
  params,
}: {
  result: PostOutput;
  selectedType: (typeof POST_TYPES)[number];
  isFree: boolean;
  freeRemaining: number;
  onReset: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
  params: PostParams | null;
}) {
  // ── Inline editing state ──────────────────────────────────────────────────
  const [editedCaption, setEditedCaption] = useState(result.caption);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedHook, setEditedHook] = useState(result.hook);
  const [isEditingHook, setIsEditingHook] = useState(false);

  // Sync quand result change (régénération)
  useEffect(() => {
    setEditedCaption(result.caption);
    setIsEditingCaption(false);
    setEditedHook(result.hook);
    setIsEditingHook(false);
  }, [result]);

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
          <div className="mb-2 flex items-center justify-between gap-2">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Première phrase
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: "0.7rem", padding: "0.2rem 0.55rem" }}
              onClick={() => setIsEditingHook((v) => !v)}
            >
              {isEditingHook ? "💾 Enregistrer" : "✏️ Modifier"}
            </button>
          </div>
          {isEditingHook ? (
            <textarea
              className="textarea"
              value={editedHook}
              onChange={(e) => setEditedHook(e.target.value)}
              rows={2}
              style={{ fontSize: "0.875rem", fontWeight: 500 }}
            />
          ) : (
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {editedHook}
            </p>
          )}
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
              text={editedCaption}
              label="Copier le texte"
              isFree={isFree}
              freeRemaining={freeRemaining}
            />
          </div>

          {isEditingCaption ? (
            <textarea
              className="textarea mb-4"
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              rows={8}
            />
          ) : (
            <p
              className="mb-4 whitespace-pre-line text-sm leading-relaxed"
              style={{ color: "var(--text)" }}
            >
              {editedCaption}
            </p>
          )}

          {/* Hashtags */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {result.hashtags.map((tag) => (
              <span key={tag} className="badge">
                {tag}
              </span>
            ))}
          </div>

          <CopyButton
            text={[editedCaption, "", result.hashtags.join(" ")].join("\n")}
            label="Copier texte + hashtags"
            isFree={isFree}
            freeRemaining={freeRemaining}
          />

          {/* Barre d'actions — modifier / régénérer / sauvegarder */}
          <div
            className="mt-3 flex flex-wrap gap-2"
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
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem" }}
              onClick={onRegenerate}
              disabled={regenerating}
            >
              {regenerating ? "⏳ Régénération…" : "🔄 Régénérer"}
            </button>
            <SaveButton
              module="post"
              title={`Post ${selectedType.label}${params?.specialite ? ` — ${params.specialite}` : ""}`}
              content={{
                hook: editedHook,
                caption: editedCaption,
                hashtags: result.hashtags,
                ideeStory: result.ideeStory,
                ideeReel: result.ideeReel ?? null,
              }}
              params={params ? (params as unknown as Record<string, unknown>) : undefined}
            />
          </div>
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

      {/* Bloc Canva — template adapté au type de post */}
      {(() => {
        const templates = CANVA_POST_TEMPLATES[selectedType.id] ?? [];
        if (!templates.length) return null;
        return (
          <div
            className="mb-4 rounded-[14px] px-5 py-5"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
              🎨 Créer le visuel dans{" "}
              <span style={{ color: "var(--accent)" }}>Canva gratuit</span>
            </p>
            <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {/* Version desktop — phrase complète */}
              <span className="hidden sm:inline">
                Utilise un template prêt à l&apos;emploi adapté à ce type de post — crée ton
                visuel en quelques secondes, sans designer.
              </span>
              {/* Version mobile — plus courte */}
              <span className="sm:hidden">
                Template Canva prêt à personnaliser en quelques clics.
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
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
          </div>
        );
      })()}

      {/* Workflow — continuer avec ce contenu */}
      <div
        className="mb-4 rounded-[14px] px-5 py-4"
        style={{
          backgroundColor: "var(--surface-alt)",
          border: "1px solid var(--border)",
        }}
      >
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          Continuer avec ce contenu
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/dashboard/hooks?sujet=${encodeURIComponent((result.hook || "").slice(0, 100))}&from=post`}
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem" }}
          >
            ⚡ Affiner les accroches
          </a>
          <a
            href="/dashboard/dm?from=post"
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem" }}
          >
            💬 Préparer réponses DM
          </a>
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

      {/* CTA WhatsApp — analyse personnalisée */}
      <WhatsAppCTA />
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
  const [lastParams, setLastParams] = useState<PostParams | null>(null);
  const [regenerating, setRegenerating] = useState(false);

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

  function handleTypeSelect(type: (typeof POST_TYPES)[number]) {
    setSelectedType(type);
  }

  function handleTypeNext() {
    if (selectedType) setStep("form");
  }

  function handleResult(
    data: PostOutput,
    free: boolean,
    freeRem: number,
    params: PostParams
  ) {
    setResult(data);
    setLastParams(params);
    posthog.capture("generate_post", { module: "post" });
    setIsFree(free);
    setFreeRemaining(freeRem);
    setStep("result");
  }

  async function handleRegenerate() {
    if (!lastParams) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/generate/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastParams),
      });
      const body = await res.json();
      if (res.ok && body.data) {
        setResult(body.data);
        posthog.capture("generate_post", { module: "post", action: "regenerate" });
      }
    } catch {
      // silently ignore
    } finally {
      setRegenerating(false);
    }
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
          isFree={isFree}
          freeRemaining={freeRemaining}
        />
      )}

      {step === "result" && result && selectedType && (
        <PostResult
          result={result}
          selectedType={selectedType}
          isFree={isFree}
          freeRemaining={freeRemaining}
          onReset={handleReset}
          onRegenerate={handleRegenerate}
          regenerating={regenerating}
          params={lastParams}
        />
      )}
    </div>
  );
}
