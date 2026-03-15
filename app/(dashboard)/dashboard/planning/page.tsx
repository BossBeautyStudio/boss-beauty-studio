"use client";

// ============================================================
// app/(dashboard)/dashboard/planning/page.tsx
//
// Module Planning Instagram — formulaire + résultat 30 posts.
// POST /api/generate/planning
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PlanningPost {
  jour: number;
  theme: string;
  caption: string;
  hashtags: string[];
  story: string;
  reel: string;
}

interface PlanningOutput {
  posts: PlanningPost[];
}

const OBJECTIF_OPTIONS = [
  "Attirer de nouvelles clientes",
  "Remplir mon agenda",
  "Fidéliser mes clientes",
  "Vendre une prestation précise",
  "Me positionner comme experte",
  "Autre…",
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

const CONSEILS_PLANNING = [
  "Publie tes posts aux heures de forte activité de ton audience : mardi, mercredi et jeudi entre 11h–13h ou 19h–21h. Utilise les idées Story pour maintenir ta présence quotidienne même les jours sans post au feed. Un planning posté régulièrement, même imparfait, vaut mieux qu'un contenu parfait publié deux fois par mois.",
  "Le contenu coulisses — une photo de ton espace, une journée type, les coulisses d'une prestation — génère souvent plus d'engagement que le contenu parfaitement soigné. Mise au moins 1 post sur 5 sur l'authenticité et la proximité avec ta communauté.",
  "Si tu bloques sur un post, publie-le quand même. L'algorithme Instagram récompense la régularité, pas la perfection. Et souvent, les posts que tu trouves 'ordinaires' sont exactement ceux que ta cible attendait de voir.",
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

export default function PlanningPage() {
  const router = useRouter();

  const [specialite, setSpecialite] = useState("");
  const [objectifSelect, setObjectifSelect] = useState(OBJECTIF_OPTIONS[0]);
  const [objectifCustom, setObjectifCustom] = useState("");
  const [tonStyle, setTonStyle] = useState(TONE_OPTIONS[0]);
  const [dateDebut, setDateDebut] = useState("");
  const [ville, setVille] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanningOutput | null>(null);

  // Conseil aléatoire sélectionné une seule fois au montage
  const [conseil] = useState<string>(
    () => CONSEILS_PLANNING[Math.floor(Math.random() * CONSEILS_PLANNING.length)]
  );

  const objectifFinal =
    objectifSelect === "Autre…" ? objectifCustom.trim() : objectifSelect;

  const ctaKeyword = getCtaKeyword(specialite);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!objectifFinal) {
      setError("Précise ton objectif principal.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialite,
          objectif: objectifFinal,
          tonStyle,
          dateDebut,
          ville: ville || undefined,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      setResult(body.data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Planning Instagram
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          30 jours de contenu prêts à publier, adaptés à ta spécialité.
        </p>
      </div>

      {/* Formulaire */}
      {!result && (
        <>
          {/* Bloc d'explication renforcé */}
          <div
            className="mb-6 rounded-[14px] px-5 py-5"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text)" }}>
              🗓️ Un mois de contenu Instagram en 5 minutes
            </p>
            <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Tu remplis 4 champs. On génère{" "}
              <span className="font-medium" style={{ color: "var(--text)" }}>30 posts complets</span>{" "}
              — caption prête à copier, hashtags adaptés, idée Story et idée Reel pour chaque jour.
              Le contenu est varié (éducatif, avant/après, coulisses, promotionnel, témoignage) et
              100 % calibré pour ta spécialité et ton objectif.
            </p>

            {/* Exemple concret */}
            <div
              className="rounded-[10px] px-4 py-3"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="mb-1.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Exemple de post généré — Onglerie · Remplir mon agenda
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                <span className="font-medium">Jour 1 ·</span>{" "}
                &ldquo;Ce que tes ongles disent de ton niveau de stress (et ce qu&apos;on peut faire pour ça) 👀
                <br />
                Beaucoup de mes clientes arrivent avec des ongles fragilisés sans savoir pourquoi.
                Résultat : une pose qui tient moins longtemps et des ongles qui se cassent.
                La vraie cause ? Le stress. Et ça se voit immédiatement...&rdquo;
              </p>
            </div>
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
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  Plus tu es précise, plus le contenu sera pertinent pour tes clientes.
                </p>
              </div>

              {/* Objectif */}
              <div className="field">
                <label className="label" htmlFor="objectifSelect">
                  Ton objectif principal *
                </label>
                <select
                  id="objectifSelect"
                  className="select"
                  value={objectifSelect}
                  onChange={(e) => {
                    setObjectifSelect(e.target.value);
                    setError(null);
                  }}
                  disabled={loading}
                >
                  {OBJECTIF_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                {objectifSelect === "Autre…" && (
                  <input
                    className="input mt-2"
                    type="text"
                    placeholder="Précise ton objectif…"
                    value={objectifCustom}
                    onChange={(e) => setObjectifCustom(e.target.value)}
                    required
                    disabled={loading}
                  />
                )}
              </div>

              {/* Ton style */}
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

              {/* Date de début */}
              <div className="field">
                <label className="label" htmlFor="dateDebut">
                  Date de début *
                </label>
                <input
                  id="dateDebut"
                  className="input"
                  type="text"
                  placeholder="Ex : lundi 7 avril 2025, 15 mai 2025…"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  Utilisé pour numéroter les jours — pas pour publier automatiquement.
                </p>
              </div>

              {/* Ville */}
              <div className="field">
                <label className="label" htmlFor="ville">
                  Ville{" "}
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optionnel — pour contextualiser)</span>
                </label>
                <input
                  id="ville"
                  className="input"
                  type="text"
                  placeholder="Ex : Paris 11e, Lyon, Bordeaux…"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
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
                {loading ? "On prépare ton mois… ✨" : "Générer mon planning →"}
              </button>

              {!loading && (
                <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  Génération en ~15 secondes · 30 posts prêts à copier-coller
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
              Ton planning — 30 jours
            </h2>
            <button
              className="btn btn-secondary"
              onClick={() => setResult(null)}
            >
              Recommencer à zéro
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {result.posts.map((post) => (
              <div key={post.jour} className="card">
                {/* En-tête post */}
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    {post.jour}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {post.theme}
                  </span>
                </div>

                {/* Caption */}
                <p
                  className="mb-3 text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: "var(--text)" }}
                >
                  {post.caption}
                </p>

                {/* Hashtags */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {post.hashtags.map((tag) => (
                    <span key={tag} className="badge">{tag}</span>
                  ))}
                </div>

                {/* Story & Reel — blocs distincts et colorés */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {/* Story */}
                  <div
                    className="rounded-[10px] px-3 py-2.5"
                    style={{
                      backgroundColor: "var(--surface-alt)",
                      borderLeft: "3px solid #6b9fd4",
                    }}
                  >
                    <p
                      className="mb-1 text-xs font-semibold"
                      style={{ color: "#6b9fd4" }}
                    >
                      📸 Story du jour
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                      {post.story}
                    </p>
                  </div>
                  {/* Reel */}
                  <div
                    className="rounded-[10px] px-3 py-2.5"
                    style={{
                      backgroundColor: "var(--surface-alt)",
                      borderLeft: "3px solid #9b7fd4",
                    }}
                  >
                    <p
                      className="mb-1 text-xs font-semibold"
                      style={{ color: "#9b7fd4" }}
                    >
                      🎬 Idée Reel
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                      {post.reel}
                    </p>
                  </div>
                </div>
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
        </div>
      )}
    </div>
  );
}
