"use client";

// ============================================================
// app/(dashboard)/dashboard/hooks/page.tsx
//
// Module Hooks Instagram — formulaire + 10 accroches enrichies.
// POST /api/generate/hooks
// ============================================================

import { useState, useEffect } from "react";
import posthog from "posthog-js";
import { useRouter } from "next/navigation";
import { FreeTrialBanner, CopyButton, PaywallBanner } from "@/components/dashboard/FreePaywall";

interface HookItem {
  numero: number;
  hook: string;
  pourquoi: string;
  utilisation: string;
  reelIdee: string | null;
}

interface HooksOutput {
  hooks: HookItem[];
}

const TYPE_OPTIONS = [
  "Éducatif — conseils et astuces",
  "Promotionnel — offres et services",
  "Coulisses — ma vie de professionnelle",
  "Témoignage — retour cliente",
  "Inspiration — motivation et citations",
];

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

const CONSEILS_HOOKS = [
  "Le hook représente les 2 premières lignes de ton post — celles que l'audience voit avant le « voir plus ». C'est le levier le plus sous-estimé d'Instagram. Colle l'un de ces hooks en début de ta prochaine caption, complète avec ton contenu habituel, et observe l'impact sur ton taux de lecture.",
  "Teste plusieurs hooks sur le même sujet pour trouver ton format signature. Certaines professionnelles convertissent 3× mieux avec des questions, d'autres avec des statistiques. La seule façon de savoir : publier et observer les premières 30 minutes d'engagement.",
  "Un bon hook ne dévoile pas tout — il crée une tension que seule la lecture du post peut résoudre. Si quelqu'un peut deviner la fin de ton hook avant de lire le post, reformule. L'objectif : que ta cliente se dise « attends, je veux en savoir plus ».",
];

// ── Utilitaire CTA dynamique ──────────────────────────────────────────────────

function getCtaKeyword(specialite: string): string {
  const s = specialite.toLowerCase();
  if (s.includes("ongl") || s.includes("nail")) return "ONGLES";
  if (
    s.includes("coiff") ||
    s.includes("balayage") ||
    s.includes("cheveu") ||
    s.includes("couleur")
  )
    return "COULEUR";
  if (
    s.includes("esthét") ||
    s.includes("soin") ||
    s.includes("peau") ||
    s.includes("facial")
  )
    return "SOIN";
  if (s.includes("maquill") || s.includes("makeup")) return "MAKEUP";
  if (s.includes("cil") || s.includes("sourcil") || s.includes("extension"))
    return "CILS";
  if (s.includes("massage") || s.includes("corps")) return "MASSAGE";
  return "RDV";
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function HooksPage() {
  const router = useRouter();

  const [specialite, setSpecialite] = useState("");
  const [typeContenu, setTypeContenu] = useState(TYPE_OPTIONS[0]);
  const [tonStyle, setTonStyle] = useState(TONE_OPTIONS[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HooksOutput | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  // Free trial state
  const [isFree, setIsFree] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState(0);

  // Conseil aléatoire sélectionné une seule fois au montage
  const [conseil] = useState<string>(
    () => CONSEILS_HOOKS[Math.floor(Math.random() * CONSEILS_HOOKS.length)]
  );

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialite, typeContenu, tonStyle }),
      });

      const body = await res.json();

      if (res.status === 402 && body.paywallRequired) {
        setIsFree(true);
        setFreeRemaining(0);
        setError(null);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      setResult(body.data);
      posthog.capture("generate_post", { module: "hooks" });
      if (body.isFree) {
        setIsFree(true);
        setFreeRemaining(body.freeRemaining ?? 0);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string, numero: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(numero);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // silently ignore
    }
  }

  const ctaKeyword = getCtaKeyword(specialite);

  return (
    <div className="fade-in">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Accroches Instagram
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          La première phrase décide si ton post est lu ou scrollé.
        </p>
      </div>

      {/* Formulaire */}
      {!result && (
        <>
          {/* Bandeau essai gratuit */}
          {isFree && <FreeTrialBanner freeRemaining={freeRemaining} />}

          {/* Paywall si quota épuisé */}
          {isFree && freeRemaining <= 0 && (
            <PaywallBanner freeRemaining={0} />
          )}

          {/* Bloc explicatif */}
          <div
            className="mb-4 rounded-[14px] px-5 py-4"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="mb-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
              ⚡ C&apos;est quoi une accroche ?
            </p>
            <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Une accroche, c&apos;est la toute première phrase de ton post Instagram. C&apos;est elle
              qui décide si une personne s&apos;arrête pour lire — ou continue à scroller. Sur
              Instagram, tu as moins de 2 secondes pour capter l&apos;attention. Une bonne accroche peut
              multiplier par 3 ou 4 le nombre de personnes qui lisent vraiment ton contenu.
            </p>
            <div
              className="mb-3 rounded-[10px] px-4 py-3"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="mb-1 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Comment utiliser tes accroches
              </p>
              <ol className="flex flex-col gap-1">
                {[
                  "Colle l'accroche choisie tout en haut de ton texte de post",
                  "Complète avec ton contenu habituel",
                  "Termine par un appel à l'action vers tes DM ou ton agenda",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text)" }}>
                    <span
                      className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: "var(--accent)" }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>
              Nouveau → chaque accroche inclut maintenant : pourquoi ça marche, comment l&apos;utiliser,
              et une idée Reel associée.
            </p>
          </div>

          <div className="card" style={{ maxWidth: "560px" }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Spécialité avec pills */}
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
                          specialite === pill ? "var(--accent)" : "var(--surface-alt)",
                        color: specialite === pill ? "#ffffff" : "var(--text-muted)",
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
                  placeholder="Ou tape ta spécialité — ex : prothésiste ongulaire, dermopigmentation…"
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Type de contenu */}
              <div className="field">
                <label className="label" htmlFor="typeContenu">
                  Type de contenu *
                </label>
                <select
                  id="typeContenu"
                  className="select"
                  value={typeContenu}
                  onChange={(e) => setTypeContenu(e.target.value)}
                  disabled={loading}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
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
                <p className="text-sm" style={{ color: "#cc4444" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Génération de tes 10 accroches… ✨" : "Générer mes 10 accroches →"}
              </button>

              {!loading && (
                <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  Génération en ~10 secondes · 10 accroches prêtes à copier
                </p>
              )}
            </form>
          </div>
        </>
      )}

      {/* Résultat */}
      {result && (
        <div className="slide-up">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
              Tes 10 accroches Instagram
            </h2>
            <button
              className="btn btn-secondary"
              onClick={() => setResult(null)}
            >
              Nouvelles accroches
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {result.hooks.map((item) => (
              <div key={item.numero} className="card">
                {/* En-tête : numéro + bouton copier */}
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: "var(--accent)" }}
                    >
                      {item.numero}
                    </span>
                    {/* Hook — héros de la carte */}
                    <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
                      {item.hook}
                    </p>
                  </div>
                  <CopyButton
                    text={item.hook}
                    label="Copier"
                    isFree={isFree}
                    freeRemaining={freeRemaining}
                    className="btn btn-secondary shrink-0"
                  />
                </div>

                {/* Pourquoi ça marche */}
                <p
                  className="mb-3 text-xs leading-relaxed"
                  style={{ color: "var(--text-muted)", fontStyle: "italic" }}
                >
                  Pourquoi ça marche : {item.pourquoi}
                </p>

                {/* Comment l'utiliser */}
                <div
                  className="mb-3 rounded-[8px] px-3 py-2.5"
                  style={{ backgroundColor: "var(--surface-alt)", border: "1px solid var(--border)" }}
                >
                  <p className="mb-0.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                    🎯 Comment l&apos;utiliser
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                    {item.utilisation}
                  </p>
                </div>

                {/* Idée Reel — conditionnel */}
                {item.reelIdee && (
                  <div
                    className="rounded-[8px] px-3 py-2.5"
                    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <p className="mb-0.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      🎬 Idée Reel associée
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                      {item.reelIdee}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pourquoi ce contenu attire des clientes */}
          <div
            className="mt-6 rounded-[14px] px-5 py-4"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text)" }}>
              🎯 Pourquoi ce contenu attire des clientes
            </p>
            <ul className="flex flex-col gap-1.5">
              {[
                "Il répond à une question fréquente des clientes",
                "Il renforce ton expertise",
                "Il donne envie aux personnes intéressées de t'écrire en DM",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  <span className="mt-px shrink-0 font-bold" style={{ color: "var(--accent)" }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Transformer ce contenu en clientes */}
          <div
            className="mt-3 rounded-[14px] px-5 py-4"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="mb-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
              💡 Transformer ce contenu en clientes
            </p>
            <p className="mb-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Publie ce contenu puis ajoute en fin de caption :
            </p>
            <div
              className="rounded-[10px] px-4 py-3"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                ✨ Si tu veux un rendez-vous, envoie-moi &ldquo;{ctaKeyword}&rdquo; en DM
              </p>
            </div>
          </div>

          {/* Conseil Boss Beauty Studio — variante aléatoire */}
          <div
            className="mt-3 rounded-[12px] px-5 py-4"
            style={{
              backgroundColor: "var(--surface-alt)",
              borderLeft: "3px solid var(--accent)",
            }}
          >
            <p className="mb-1.5 text-sm font-semibold" style={{ color: "var(--text)" }}>
              💡 Conseil Boss Beauty Studio
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {conseil}
            </p>
          </div>

          {/* Bandeau paywall free trial */}
          {isFree && <PaywallBanner freeRemaining={freeRemaining} />}
        </div>
      )}
    </div>
  );
}
