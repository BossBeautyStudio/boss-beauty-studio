"use client";

// ============================================================
// components/landing/LandingDemo.tsx
//
// Section Démo — composant client (tabs interactifs).
// Affiche un post complet du planning pour 3 spécialités.
// ============================================================

import { useState } from "react";

type Specialite = "cils" | "ongles" | "coiffure";

interface PostDemo {
  specialiteLabel: string;
  theme: string;
  caption: string;
  hashtags: string[];
  story: string;
  reel: string;
}

const DEMO_DATA: Record<Specialite, PostDemo> = {
  cils: {
    specialiteLabel: "Extensions de cils",
    theme: "Avant / Après — Extensions de cils",
    caption: `Le résultat parle de lui-même 😍

À gauche : arrivée. À droite : départ.
Même regard. 45 minutes de pose.
Des cils qui changent tout.

Tu veux toi aussi ce résultat ?
Envoie-moi "CILS" en DM 📩`,
    hashtags: [
      "#extensionscils",
      "#cilsperfaits",
      "#lashtech",
      "#avantaprès",
      "#cilsnaturels",
      "#yeux",
      "#beauté",
      "#lashartist",
    ],
    story: "Reveal progressif en mode glissière — \"Avant → Après en swipe\"",
    reel: "Transition before/after avec effet split-screen + musique tendance",
  },
  ongles: {
    specialiteLabel: "Prothésie ongulaire",
    theme: "Avant / Après — Ongles gel",
    caption: `De l'usure à l'éclat. Résultat en 1h30 ✨

Avant : ongles fragilisés, sans éclat.
Après : gel parfait, tenue 3 semaines garantie.

Tu veux ce résultat ?
Envoie-moi "ONGLES" en DM 💅`,
    hashtags: [
      "#onglesgel",
      "#prothèseongulaire",
      "#nailtech",
      "#avantaprès",
      "#onglesfemme",
      "#nailart",
      "#beauté",
      "#manucure",
    ],
    story: "Timelapse de la pose d'ongles gel en 30 secondes",
    reel: "Before/after avec zoom sur la texture et l'éclat final",
  },
  coiffure: {
    specialiteLabel: "Coiffure / Balayage",
    theme: "Avant / Après — Balayage",
    caption: `Ce balayage a pris 2h. Ce sourire est resté toute la semaine 🌿

Avant : couleur terne, cheveux sans vie.
Après : balayage naturel, brillance maximale.

Tu veux ce résultat ?
Envoie-moi "COULEUR" en DM 💇‍♀️`,
    hashtags: [
      "#balayage",
      "#coiffure",
      "#coloriste",
      "#avantaprès",
      "#cheveuxparfaits",
      "#haircolor",
      "#beauté",
      "#hairstyle",
    ],
    story: "Slider avant/après : de l'terne au brillant en swipe",
    reel: "Transformation cheveux : before/after en 20 secondes avec révélation finale",
  },
};

const TABS: { key: Specialite; label: string }[] = [
  { key: "cils", label: "Extensions cils" },
  { key: "ongles", label: "Ongles gel" },
  { key: "coiffure", label: "Coiffure" },
];

interface Props {
  checkoutUrl: string;
}

export default function LandingDemo({ checkoutUrl }: Props) {
  const [active, setActive] = useState<Specialite>("cils");
  const post = DEMO_DATA[active];

  return (
    <section
      id="demo"
      className="px-5 py-20"
      style={{
        backgroundColor: "var(--surface)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "760px" }}>

        {/* ── En-tête ─────────────────────────────────────────── */}
        <p
          className="mb-2 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          Démo
        </p>
        <h2
          className="mb-2 text-center text-2xl font-semibold"
          style={{ color: "var(--text)" }}
        >
          Voilà exactement ce que ça génère.
        </h2>
        <p
          className="mb-8 text-center text-sm leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Spécialité saisie :{" "}
          <span className="font-medium" style={{ color: "var(--text)" }}>
            {post.specialiteLabel}
          </span>
          {" · "}Temps de génération : 12 secondes.
        </p>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className="mb-6 flex justify-center gap-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className="rounded-full px-4 py-1.5 text-sm font-medium"
              style={{
                transition: "background-color 150ms ease, color 150ms ease",
                ...(active === tab.key
                  ? {
                      backgroundColor: "var(--accent)",
                      color: "#fff",
                      border: "1px solid var(--accent)",
                    }
                  : {
                      backgroundColor: "var(--bg)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Post card ────────────────────────────────────────── */}
        <div
          className="overflow-hidden rounded-[16px]"
          style={{
            border: "1px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          {/* Barre de titre */}
          <div
            className="flex flex-wrap items-center gap-3 px-5 py-3"
            style={{
              backgroundColor: "var(--surface-alt)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              Post 8 — Planning Instagram
            </span>
            <span
              className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: "var(--surface)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {post.theme}
            </span>
          </div>

          {/* Corps du post */}
          <div
            className="flex flex-col gap-5 p-5"
            style={{ backgroundColor: "var(--surface)" }}
          >
            {/* Caption */}
            <div>
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Caption
              </p>
              <p
                className="whitespace-pre-line text-sm leading-relaxed"
                style={{ color: "var(--text)" }}
              >
                {post.caption}
              </p>
            </div>

            {/* Hashtags */}
            <div>
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Hashtags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((h) => (
                  <span
                    key={h}
                    className="rounded-full px-2.5 py-0.5 text-xs"
                    style={{
                      backgroundColor: "var(--surface-alt)",
                      color: "var(--accent)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Story */}
            <div
              className="rounded-[10px] px-4 py-3"
              style={{
                backgroundColor: "var(--surface-alt)",
                borderLeft: "3px solid #6b9fd4",
              }}
            >
              <p
                className="mb-1 text-xs font-semibold"
                style={{ color: "#6b9fd4" }}
              >
                📱 Idée Story
              </p>
              <p className="text-sm" style={{ color: "var(--text)" }}>
                {post.story}
              </p>
            </div>

            {/* Reel */}
            <div
              className="rounded-[10px] px-4 py-3"
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
              <p className="text-sm" style={{ color: "var(--text)" }}>
                {post.reel}
              </p>
            </div>
          </div>
        </div>

        {/* ── Réassurance + CTA ───────────────────────────────── */}
        <p
          className="mt-4 text-center text-xs leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Ce post est généré à partir de ta spécialité. Pas un template.
          Pas du générique. Du contenu ancré dans ton univers.
        </p>
        <div className="mt-5 text-center">
          <a
            href={checkoutUrl}
            className="btn btn-primary"
            style={{ fontSize: "0.9375rem", padding: "0.7rem 1.75rem" }}
          >
            Voir ce que ça génère pour moi →
          </a>
        </div>
      </div>
    </section>
  );
}
