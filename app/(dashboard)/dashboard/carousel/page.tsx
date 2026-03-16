"use client";

// ============================================================
// app/(dashboard)/dashboard/carousel/page.tsx
//
// Module Carrousel Instagram — formulaire + résultat slides.
// POST /api/generate/carousel
// ============================================================

import { useState, useEffect } from "react";
import posthog from "posthog-js";
import { useRouter } from "next/navigation";
import { FreeTrialBanner, CopyButton, PaywallBanner } from "@/components/dashboard/FreePaywall";

interface CarouselSlide {
  numero: number;
  titre: string;
  texte: string;
  visuel: string;
}

interface CarouselOutput {
  titre: string;
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
  cta: string;
}

const TONE_OPTIONS = [
  "Pédagogique et bienveillant",
  "Expert et professionnel",
  "Inspirant et motivant",
  "Fun et accessible",
  "Chaleureux et proche",
];

const CANVA_CAROUSELS = [
  {
    label: "Carrousel éducatif",
    url: "https://www.canva.com/templates/?query=beauty+educational+instagram+carousel",
  },
  {
    label: "Carrousel conseils",
    url: "https://www.canva.com/templates/?query=beauty+tips+instagram+carousel",
  },
  {
    label: "Carrousel avant / après",
    url: "https://www.canva.com/templates/?query=beauty+before+after+instagram+carousel",
  },
];

const CANVA_POSTS = [
  {
    label: "Post promotion",
    url: "https://www.canva.com/templates/?query=beauty+promotion+instagram+post",
  },
  {
    label: "Post conseil",
    url: "https://www.canva.com/templates/?query=beauty+tips+instagram+post",
  },
  {
    label: "Citation beauté",
    url: "https://www.canva.com/templates/?query=beauty+quote+instagram+post",
  },
];

const CONSEILS_CAROUSEL = [
  "Les carrousels génèrent 3× plus d'enregistrements que les posts classiques — c'est le format le plus puissant pour ta notoriété. Publie-le un mardi ou mercredi matin, et ajoute-le immédiatement à tes Highlights Instagram dans une catégorie « Conseils » ou « Astuces » pour qu'il continue à travailler pour toi.",
  "La première slide est décisive : si elle n'accroche pas, personne ne swipe. Assure-toi que le titre de couverture pose une question ou promet un bénéfice concret. Le reste du carrousel peut être parfait — sans une bonne cover, il ne sera jamais lu.",
  "Réutilise chaque carrousel au maximum : poste-le en Reel en lisant les slides à voix haute, partage-le en Story avec un sondage, et mentionne-le en DM à tes clientes. Un seul carrousel bien fait peut alimenter une semaine entière de contenu.",
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

export default function CarouselPage() {
  const router = useRouter();

  const [sujet, setSujet] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [nombreSlides, setNombreSlides] = useState(7);
  const [tonStyle, setTonStyle] = useState(TONE_OPTIONS[0]);
  const [publicCible, setPublicCible] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CarouselOutput | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Free trial state
  const [isFree, setIsFree] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState(0);

  // Conseil aléatoire sélectionné une seule fois au montage
  const [conseil] = useState<string>(
    () => CONSEILS_CAROUSEL[Math.floor(Math.random() * CONSEILS_CAROUSEL.length)]
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

  async function handleCopy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // silently ignore
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sujet,
          specialite,
          nombreSlides,
          tonStyle,
          publicCible: publicCible || undefined,
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
      posthog.capture("generate_post", { module: "carousel" });
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

  const ctaKeyword = getCtaKeyword(specialite);

  return (
    <div className="fade-in">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Carrousel Instagram
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Le format qui génère 3× plus de sauvegardes que les posts classiques.
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
              🖼️ Le format Instagram qui fait sauvegarder — et revenir
            </p>
            <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Un carrousel éducatif bien fait capte l&apos;attention sur les 3 premières slides,
              génère des{" "}
              <span className="font-medium" style={{ color: "var(--text)" }}>
                sauvegardes
              </span>{" "}
              (le signal le plus fort pour l&apos;algo), et amène les bonnes clientes à te contacter
              en DM.
            </p>
            <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Tu obtiens :{" "}
              <span className="font-medium" style={{ color: "var(--text)" }}>
                titre accrocheur · slides complets · caption · hashtags · visuels suggérés
              </span>
              . Compatible{" "}
              <span className="font-medium" style={{ color: "var(--accent)" }}>
                Canva gratuit
              </span>{" "}
              — les templates sont prêts à personnaliser en quelques clics.
            </p>

            {/* Astuce sujets */}
            <div
              className="rounded-[10px] px-4 py-3"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="mb-1 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Sujets qui performent le mieux
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Erreurs à éviter",
                  "Étapes à suivre",
                  "Mythes vs vérité",
                  "Avant / après",
                  "Questions fréquentes",
                ].map((s) => (
                  <span key={s} className="badge" style={{ fontSize: "0.7rem" }}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ maxWidth: "560px" }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="field">
                <label className="label" htmlFor="sujet">
                  Sujet du carrousel *
                </label>
                <input
                  id="sujet"
                  className="input"
                  type="text"
                  placeholder="Ex : 5 erreurs qui abîment ta peau, comment préparer son skin avant le soleil…"
                  value={sujet}
                  onChange={(e) => setSujet(e.target.value)}
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
                  placeholder="Ex : esthéticienne, coiffeuse, prothésiste ongulaire…"
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="nombreSlides">
                  Nombre de slides *{" "}
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    ({nombreSlides} slides)
                  </span>
                </label>
                <input
                  id="nombreSlides"
                  className="input"
                  type="range"
                  min={5}
                  max={10}
                  step={1}
                  value={nombreSlides}
                  onChange={(e) => setNombreSlides(Number(e.target.value))}
                  disabled={loading}
                  style={{ padding: "0.25rem 0", cursor: "pointer" }}
                />
                <div
                  className="flex justify-between text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>5 — concis</span>
                  <span>10 — complet</span>
                </div>
              </div>

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

              <div className="field">
                <label className="label" htmlFor="publicCible">
                  Public cible{" "}
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optionnel)</span>
                </label>
                <input
                  id="publicCible"
                  className="input"
                  type="text"
                  placeholder="Ex : femmes 30-45 ans, jeunes mamans, peaux sensibles…"
                  value={publicCible}
                  onChange={(e) => setPublicCible(e.target.value)}
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
                {loading ? "Création de ton carrousel… ✨" : "Générer mon carrousel →"}
              </button>

              {!loading && (
                <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  Génération en ~15 secondes · Slides + caption + hashtags
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
              Ton carrousel
            </h2>
            <button
              className="btn btn-secondary"
              onClick={() => setResult(null)}
            >
              Nouveau carrousel
            </button>
          </div>

          {/* Titre principal */}
          <div className="card mb-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Titre de couverture
            </p>
            <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>
              {result.titre}
            </p>
          </div>

          {/* Slides */}
          <div className="mb-4 flex flex-col gap-3">
            {result.slides.map((slide) => (
              <div key={slide.numero} className="card">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    {slide.numero}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {slide.titre}
                  </span>
                </div>
                <p className="mb-2 text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                  {slide.texte}
                </p>
                <div
                  className="rounded-[8px] px-3 py-2"
                  style={{ backgroundColor: "var(--surface-alt)" }}
                >
                  <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                    📷 Visuel suggéré
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                    {slide.visuel}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Caption + Hashtags + CTA */}
          <div className="card mb-4">
            <div className="mb-2 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Texte de publication
              </p>
              <CopyButton
                text={result.caption}
                label="📋 Copier"
                isFree={isFree}
                freeRemaining={freeRemaining}
                className="btn btn-secondary shrink-0"
              />
            </div>
            <p className="mb-4 text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text)" }}>
              {result.caption}
            </p>

            <div className="mb-1 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Hashtags
              </p>
              <CopyButton
                text={result.hashtags.join(" ")}
                label="📋 Copier"
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

            <div
              className="rounded-[10px] px-3 py-2.5"
              style={{ backgroundColor: "var(--surface-alt)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Invitation à réserver
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {result.cta}
              </p>
            </div>
          </div>

          {/* Bloc Canva — Carrousels */}
          <div
            className="rounded-[14px] px-5 py-5"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
              📐 Mettre en forme sur{" "}
              <span style={{ color: "var(--accent)" }}>Canva gratuit</span>
            </p>
            <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Choisis un template, colle les textes générés ci-dessus, et ton carrousel est prêt
              en quelques minutes — sans designer, sans abonnement payant.
            </p>

            {/* Boutons carrousels */}
            <div className="mb-5 flex flex-wrap gap-2">
              {CANVA_CAROUSELS.map((t) => (
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

            {/* Guide personnalisation en 3 étapes pratiques */}
            <div
              className="rounded-[10px] px-4 py-4"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="mb-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Personnaliser en 3 clics
              </p>
              <div className="flex flex-col gap-3">
                {/* Étape 1 — Textes */}
                <div className="flex items-start gap-3">
                  <span
                    className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    1
                  </span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                      Textes
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      Clique sur chaque zone de texte dans Canva → colle les titres et textes
                      générés ci-dessus, slide par slide.
                    </p>
                  </div>
                </div>
                {/* Étape 2 — Couleurs */}
                <div className="flex items-start gap-3">
                  <span
                    className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    2
                  </span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                      Couleurs
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      Clique sur un élément coloré → icône palette en haut → entre le code hex de
                      ta couleur de marque. Applique à tous les éléments pour une charte cohérente.
                    </p>
                  </div>
                </div>
                {/* Étape 3 — Photos */}
                <div className="flex items-start gap-3">
                  <span
                    className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    3
                  </span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                      Photos
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      Clique sur le visuel placeholder → supprime → clique &ldquo;Importer&rdquo; ou
                      glisse ta photo directement. Format idéal : 1080 × 1080 px (carré) ou
                      1080 × 1350 px (portrait).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Séparateur */}
            <div
              className="my-5"
              style={{ borderTop: "1px solid var(--border)" }}
            />

            {/* Posts simples */}
            <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
              🖼️ Créer un post simple avec Canva
            </p>
            <p className="mb-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Pour varier ton feed : une image, un message fort, publié en 5 minutes.
            </p>
            <div className="flex flex-wrap gap-2">
              {CANVA_POSTS.map((t) => (
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
