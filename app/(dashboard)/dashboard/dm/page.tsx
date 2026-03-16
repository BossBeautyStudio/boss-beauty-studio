"use client";

// ============================================================
// app/(dashboard)/dashboard/dm/page.tsx
//
// Module Réponse DM — formulaire + 3 variantes de réponse.
// POST /api/generate/dm
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FreeTrialBanner, CopyButton, PaywallBanner } from "@/components/dashboard/FreePaywall";

interface DmVariante {
  courte: string;
  standard: string;
  premium: string;
}

const EXEMPLES_MESSAGES = [
  {
    label: "Question tarif",
    message: "Bonjour, c'est combien pour un balayage ?",
  },
  {
    label: "Demande de dispo",
    message: "Vous avez des disponibilités cette semaine ?",
  },
  {
    label: "Renseignement soin",
    message: "Bonjour, je voulais en savoir plus sur vos soins visage, quels sont vos tarifs ?",
  },
];

const CONTEXTE_PILLS = [
  "Nouvelle cliente",
  "Cliente fidèle",
  "Suite à un post Instagram",
];

const CONSEILS_DM = [
  "Réponds toujours dans les 2h aux DM — c'est le délai qui maximise les conversions. Utilise la variante Courte pour les questions simples, Standard au quotidien, et Premium pour les nouvelles clientes ou les prospects hésitants. Tu peux toujours légèrement personnaliser avant d'envoyer.",
  "Une réponse DM qui se termine par une question ouverte convertit mieux qu'une réponse fermée. Plutôt que «\u202fOui, j'ai des créneaux jeudi\u202f», essaie «\u202fJ'ai de la place jeudi ou vendredi, laquelle te convient le mieux ?\u202f» — la cliente reste dans la conversation.",
  "Les clientes qui posent des questions en DM sont déjà intéressées — elles n'ont pas besoin qu'on les convainque, elles ont besoin d'être rassurées et guidées. Une réponse chaleureuse, précise et rapide suffit souvent à déclencher la réservation.",
];

export default function DmPage() {
  const router = useRouter();

  const [messageClient, setMessageClient] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [contexte, setContexte] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DmVariante | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Free trial state
  const [isFree, setIsFree] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState(0);

  // Conseil aléatoire sélectionné une seule fois au montage
  const [conseil] = useState<string>(
    () => CONSEILS_DM[Math.floor(Math.random() * CONSEILS_DM.length)]
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
      const res = await fetch("/api/generate/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageClient,
          specialite,
          contexte: contexte || undefined,
        }),
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

  async function handleCopy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // silently ignore
    }
  }

  function handleContextePill(pill: string) {
    setContexte((prev) => {
      if (prev.includes(pill)) return prev;
      return prev.trim() ? `${prev.trim()}, ${pill}` : pill;
    });
  }

  return (
    <div className="fade-in">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Réponse DM
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          3 réponses rédigées à ta place pour chaque message client.
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

          {/* Bloc d'explication renforcé */}
          <div
            className="mb-6 rounded-[14px] px-5 py-5"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text)" }}>
              💬 Une réponse DM bien rédigée = une cliente de plus
            </p>
            <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Les clientes qui envoient un DM sont déjà intéressées. Ce qui fait la différence,
              c&apos;est{" "}
              <span className="font-medium" style={{ color: "var(--text)" }}>
                la rapidité et la chaleur de ta réponse
              </span>
              . Une réponse froide ou trop lente, et elles vont voir ailleurs.
            </p>
            <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Tu obtiens{" "}
              <span className="font-medium" style={{ color: "var(--text)" }}>
                3 variantes calibrées
              </span>{" "}
              : courte (10 secondes), standard (ton quotidien), premium (pour convertir une nouvelle
              cliente hésitante). Tu choisis, tu copies, tu envoies.
            </p>
            <div
              className="rounded-[10px] px-4 py-3"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                Important → Colle le message exact reçu, sans le reformuler.
                Plus c&apos;est précis, meilleure est la réponse.
              </p>
            </div>
          </div>

          <div className="card" style={{ maxWidth: "560px" }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="field">
                <label className="label" htmlFor="messageClient">
                  Message reçu en DM *
                </label>

                {/* Exemples cliquables */}
                <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Exemples — clique pour remplir automatiquement :
                </p>
                <div className="mb-3 flex flex-col gap-2">
                  {EXEMPLES_MESSAGES.map((ex) => (
                    <button
                      key={ex.message}
                      type="button"
                      onClick={() => setMessageClient(ex.message)}
                      disabled={loading}
                      className="rounded-[10px] px-4 py-3 text-left transition-colors"
                      style={{
                        backgroundColor:
                          messageClient === ex.message
                            ? "var(--surface)"
                            : "var(--surface-alt)",
                        border:
                          messageClient === ex.message
                            ? "1px solid var(--accent)"
                            : "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                    >
                      <p
                        className="mb-0.5 text-xs font-semibold"
                        style={{
                          color:
                            messageClient === ex.message
                              ? "var(--accent)"
                              : "var(--text-muted)",
                        }}
                      >
                        {ex.label}
                      </p>
                      <p className="text-sm" style={{ color: "var(--text)" }}>
                        &ldquo;{ex.message}&rdquo;
                      </p>
                    </button>
                  ))}
                </div>

                <p className="mb-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  Ou colle un vrai message reçu aujourd&apos;hui ↓
                </p>
                <textarea
                  id="messageClient"
                  className="textarea"
                  placeholder="Colle ici le message exact reçu en DM…"
                  value={messageClient}
                  onChange={(e) => setMessageClient(e.target.value)}
                  rows={3}
                  required
                  disabled={loading}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="specialite">
                  Ta spécialité *
                </label>
                <input
                  id="specialite"
                  className="input"
                  type="text"
                  placeholder="Ex : coiffeuse, esthéticienne, onglerie…"
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="contexte">
                  Détail important{" "}
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optionnel mais puissant)</span>
                </label>
                {/* Pills de contexte */}
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {CONTEXTE_PILLS.map((pill) => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => handleContextePill(pill)}
                      disabled={loading}
                      className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: contexte.includes(pill)
                          ? "var(--accent)"
                          : "var(--surface-alt)",
                        color: contexte.includes(pill) ? "#ffffff" : "var(--text-muted)",
                        border: contexte.includes(pill)
                          ? "1px solid var(--accent)"
                          : "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                    >
                      {pill}
                    </button>
                  ))}
                </div>
                <textarea
                  id="contexte"
                  className="textarea"
                  placeholder="Ex : hors zone géographique, demande suite à un post, cliente qui hésite…"
                  value={contexte}
                  onChange={(e) => setContexte(e.target.value)}
                  rows={2}
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
                disabled={loading}
              >
                {loading ? "Rédaction de tes 3 réponses… ✨" : "Rédiger mes 3 réponses →"}
              </button>

              {!loading && (
                <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  Génération en ~10 secondes · 3 variantes prêtes à copier
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
              Tes 3 variantes de réponse
            </h2>
            <button
              className="btn btn-secondary"
              onClick={() => setResult(null)}
            >
              Nouveau DM
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Variante courte */}
            <VarianteCard
              label="⚡ Courte"
              description="1–2 phrases — idéale pour une réponse rapide ou un client direct"
              text={result.courte}
              colorKey="courte"
              copied={copied}
              onCopy={handleCopy}
              isFree={isFree}
              freeRemaining={freeRemaining}
            />

            {/* Variante standard */}
            <VarianteCard
              label="💬 Standard"
              description="2–3 phrases — chaleureuse et informative, ton du quotidien"
              text={result.standard}
              colorKey="standard"
              copied={copied}
              onCopy={handleCopy}
              isFree={isFree}
              freeRemaining={freeRemaining}
            />

            {/* Variante premium */}
            <VarianteCard
              label="✨ Premium"
              description="3–4 phrases — personnalisée avec valeur ajoutée, idéale pour convertir"
              text={result.premium}
              colorKey="premium"
              copied={copied}
              onCopy={handleCopy}
              isFree={isFree}
              freeRemaining={freeRemaining}
            />
          </div>

          {/* Message original */}
          <div className="card mt-4" style={{ opacity: 0.7 }}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Message original
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-muted)" }}>
              {messageClient}
            </p>
          </div>

          {/* Pourquoi ce contenu attire des clientes */}
          <div
            className="mt-4 rounded-[14px] px-5 py-4"
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
                ✨ Si tu veux un rendez-vous, envoie-moi &ldquo;CILS&rdquo; en DM
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

// ── Sous-composant VarianteCard ──────────────────────────────

interface VarianteCardProps {
  label: string;
  description: string;
  text: string;
  colorKey: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
  isFree: boolean;
  freeRemaining: number;
}

function VarianteCard({ label, description, text, colorKey, copied, onCopy, isFree, freeRemaining }: VarianteCardProps) {
  return (
    <div className="card">
      {/* En-tête */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        </div>
        <CopyButton
          text={text}
          label="Copier"
          isFree={isFree}
          freeRemaining={freeRemaining}
          className="btn btn-secondary shrink-0"
        />
      </div>

      {/* Texte */}
      <div
        className="rounded-[10px] px-4 py-3"
        style={{ backgroundColor: "var(--surface-alt)" }}
      >
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text)" }}>
          {text}
        </p>
      </div>
    </div>
  );
}
