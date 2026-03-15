// ============================================================
// app/page.tsx — Landing page Boss Beauty Studio V1
//
// Composant serveur. 11 sections :
//   Nav · Hero · Douleur · Solution · Modules · Étapes ·
//   Démo (client) · Témoignages · Objection · Pricing ·
//   FAQ · CTA final · Footer
// ============================================================

import Link from "next/link";
import LandingDemo from "@/components/landing/LandingDemo";

const CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL ?? "/login";

// ── Données statiques ──────────────────────────────────────

const MODULES = [
  {
    icon: "📅",
    label: "Planning Instagram",
    badge: "30 posts · ~15 sec",
    description:
      "Un mois entier de contenu : caption, hashtags, idée Story et idée Reel pour chaque post. Tu remplis ton agenda éditorial en une génération.",
    mockup: [
      "Jour 1 — Lancement du mois",
      "Caption · Hashtags · #beauté",
      "📱 Story · 🎬 Reel inclus",
    ],
  },
  {
    icon: "🖼️",
    label: "Carrousel Instagram",
    badge: "Canva inclus · ~15 sec",
    description:
      "Le format qui génère 3× plus de sauvegardes. Slides, caption et hashtags prêts, avec guide Canva intégré.",
    mockup: [
      "Slide 1 — Titre accrocheur",
      "Slide 2 — Erreur n°1 + solution",
      "Caption + Hashtags + CTA",
    ],
  },
  {
    icon: "💬",
    label: "Réponse DM",
    badge: "3 variantes · ~10 sec",
    description:
      "Courte, standard ou premium — 3 réponses rédigées à ta place pour transformer chaque message client en rendez-vous.",
    mockup: [
      "Courte : \"Oui, j'ai des dispo…\"",
      "Standard : \"Bonjour ! Il me reste…\"",
      "Premium : \"Super contente d'avoir…\"",
    ],
  },
  {
    icon: "⚡",
    label: "Hooks Instagram",
    badge: "10 accroches · ~10 sec",
    description:
      "10 premières phrases percutantes pour stopper le scroll. Chaque hook expliqué, avec idée Reel associée.",
    mockup: [
      "1. \"Tu fais encore cette erreur…\"",
      "2. \"3 choses que je dis à mes…\"",
      "3. \"Arrête de dépenser en crèmes…\"",
    ],
  },
];

const ETAPES = [
  {
    numero: "1",
    titre: "Tu indiques ta spécialité",
    texte:
      "Cils, ongles, coiffure, soins visage, massage… Le contenu s'adapte automatiquement à ton univers, ton vocabulaire, ton type de clientèle.",
  },
  {
    numero: "2",
    titre: "Tu génères en un clic",
    texte:
      "En 10 à 15 secondes, ton contenu complet est prêt : caption, hashtags, idées Story et Reel, hooks percutants. Rien à configurer.",
  },
  {
    numero: "3",
    titre: "Tu copies et tu publies",
    texte:
      "Tout est prêt à copier-coller directement dans Instagram. Tu n'as plus qu'à poster — et à travailler en cabine.",
  },
];

const TEMOIGNAGES = [
  {
    texte:
      "Je passais 2h le dimanche à préparer ma semaine Instagram. Maintenant ça me prend 10 minutes. Et mes posts sont bien meilleurs.",
    nom: "Laura",
    metier: "Technicienne en extensions de cils · Lyon",
  },
  {
    texte:
      "Ce qui m'a convaincue c'est que le contenu parle vraiment de mon métier. C'est pas du contenu générique sorti de ChatGPT.",
    nom: "Inès",
    metier: "Prothésiste ongulaire · Bordeaux",
  },
  {
    texte:
      "J'avais peur que ce soit compliqué. J'ai généré mon premier planning en moins d'une minute. Je recommande à toutes mes collègues.",
    nom: "Sofia",
    metier: "Esthéticienne · Paris",
  },
];

const FAQ_ITEMS = [
  {
    question: "Le contenu est-il vraiment personnalisé à ma spécialité ?",
    reponse:
      "Oui. Tu indiques ta spécialité (cils, ongles, coiffure, soins visage…) et tout le contenu — vocabulaire, types de posts, CTAs — est adapté à ton univers. Le planning d'une lash tech et celui d'une coloriste sont complètement différents.",
  },
  {
    question: "Est-ce que je dois avoir des compétences techniques ?",
    reponse:
      "Aucune. Si tu sais envoyer un message WhatsApp, tu sais utiliser Boss Beauty Studio. Tu saisis ta spécialité, tu cliques, tu copies. C'est tout.",
  },
  {
    question: "Quelle est la différence avec ChatGPT ?",
    reponse:
      "ChatGPT est un outil généraliste : il génère du contenu pour tout le monde, sans contexte ni spécialisation. Boss Beauty Studio est entraîné uniquement sur la niche beauté Instagram. Le résultat est directement utilisable — pas besoin de reformuler ou de corriger.",
  },
  {
    question: "Combien de temps faut-il pour générer un planning ?",
    reponse:
      "Entre 10 et 15 secondes. Tu saisis ta spécialité, tu cliques sur 'Générer', et tu obtiens 30 posts complets — caption, hashtags, idée Story et Reel — prêts à copier-coller.",
  },
  {
    question: "Puis-je annuler à tout moment ?",
    reponse:
      "Oui, sans justification et sans délai de préavis, en un clic depuis ton espace personnel. L'accès reste actif jusqu'à la fin de la période déjà payée.",
  },
];

const FEATURES_PRICING = [
  "Planning Instagram — 30 posts complets",
  "Carrousel Instagram avec guide Canva",
  "Réponse DM — 3 variantes par message",
  "Hooks Instagram — 10 accroches percutantes",
  "Historique de toutes tes générations",
  "Contenu 100 % adapté à ta spécialité",
];

// ── Composant principal ────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100dvh" }}>

      {/* ══════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════ */}
      <nav
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="mx-auto flex items-center justify-between px-5 py-3"
          style={{ maxWidth: "1080px" }}
        >
          <span
            className="text-base font-semibold"
            style={{ color: "var(--text)" }}
          >
            ✨ Boss Beauty Studio
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="btn btn-ghost"
              style={{ fontSize: "0.875rem", padding: "0.45rem 1rem" }}
            >
              Se connecter
            </Link>
            <a
              href="#demo"
              className="btn btn-primary"
              style={{ fontSize: "0.875rem", padding: "0.45rem 1rem" }}
            >
              Voir la démo
            </a>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          1 — HERO
      ══════════════════════════════════════════════════════ */}
      <section className="fade-in px-5 pb-16 pt-20 text-center">
        <div className="mx-auto" style={{ maxWidth: "720px" }}>

          {/* Badge */}
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
              color: "var(--accent)",
            }}
          >
            ⚡ Fait pour les pros de la beauté indépendantes
          </div>

          {/* H1 */}
          <h1
            className="mb-5 text-4xl font-semibold leading-tight sm:text-5xl"
            style={{ color: "var(--text)" }}
          >
            30 posts Instagram générés
            <br />
            <span style={{ color: "var(--accent)" }}>en 15 secondes.</span>
          </h1>

          {/* Sous-titre */}
          <p
            className="mx-auto mb-8 max-w-lg text-lg leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Tu indiques ta spécialité. Boss Beauty Studio crée ton planning
            complet : captions, hashtags, idées Story et Reel. Adapté à ton
            métier. Prêt à publier. Immédiatement.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={CHECKOUT_URL}
              className="btn btn-primary"
              style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}
            >
              Générer mon planning gratuitement →
            </a>
            <a
              href="#demo"
              className="btn btn-secondary"
              style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}
            >
              Voir un exemple →
            </a>
          </div>

          {/* Micro-texte */}
          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            Aucune carte bancaire requise pour l&apos;essai · Résultats en 15
            secondes
          </p>

          {/* Preuve sociale */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span aria-hidden="true">⭐️</span>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Déjà utilisé par des lash artists, esthéticiennes et ongleries en France
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2 — DOULEUR
      ══════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-20"
        style={{
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "760px" }}>
          <h2
            className="mb-8 text-center text-2xl font-semibold leading-snug"
            style={{ color: "var(--text)" }}
          >
            Tu passes plus de temps à réfléchir à quoi poster
            <br className="hidden sm:block" />
            qu&apos;à travailler en cabine ?
          </h2>

          <div className="flex flex-col gap-4">
            {[
              {
                icon: "😮‍💨",
                texte:
                  "Le dimanche soir, tu ouvres Instagram. La page est vide. Tu ne sais pas quoi écrire. Tu passes 45 minutes à chercher, tu publies quelque chose de moyen — ou tu ne publies rien.",
              },
              {
                icon: "😶",
                texte:
                  "Pendant ce temps, d'autres professionnelles de ta ville postent tous les jours — des captions engageantes, des Reels qui cartonnent, des avant/après qui remplissent leur agenda.",
              },
              {
                icon: "💡",
                texte:
                  "Ce n'est pas qu'elles ont plus de talent. Elles ont juste un système. Boss Beauty Studio est ce système — pensé exclusivement pour la niche beauté.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-[14px] px-5 py-4"
                style={{
                  backgroundColor: "var(--bg)",
                  border: "1px solid var(--border)",
                }}
              >
                <span className="mt-0.5 shrink-0 text-xl">{item.icon}</span>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.texte}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3 — SOLUTION
      ══════════════════════════════════════════════════════ */}
      <section className="px-5 py-20 text-center">
        <div className="mx-auto" style={{ maxWidth: "640px" }}>
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            La solution
          </p>
          <h2
            className="mb-5 text-2xl font-semibold leading-snug"
            style={{ color: "var(--text)" }}
          >
            Boss Beauty Studio génère ton contenu à ta place
            <br className="hidden sm:block" />— en quelques secondes.
          </h2>
          <p
            className="mb-6 text-base leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Tu saisis ta spécialité (extensions cils, ongles gel, balayage,
            soins visage…). L&apos;outil crée immédiatement un contenu complet,
            personnalisé à ton univers. Pas du contenu générique. Du contenu
            qui parle à tes clientes.
          </p>
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            ✦ Conçu exclusivement pour les professionnelles de la beauté
            indépendantes.
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          4 — LES 4 MODULES
      ══════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-20"
        style={{
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "1080px" }}>
          <h2
            className="mb-2 text-center text-2xl font-semibold"
            style={{ color: "var(--text)" }}
          >
            Tout ce dont tu as besoin pour publier sans te fatiguer.
          </h2>
          <p
            className="mb-10 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Chaque outil est calibré pour générer des clientes, pas juste des
            likes.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((mod) => (
              <div
                key={mod.label}
                className="flex flex-col gap-3 rounded-[16px] px-5 py-5"
                style={{
                  backgroundColor: "var(--bg)",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Icône */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[12px] text-xl"
                  style={{ backgroundColor: "var(--surface-alt)" }}
                >
                  {mod.icon}
                </div>

                {/* Titre + badge */}
                <div>
                  <p
                    className="mb-1 text-sm font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {mod.label}
                  </p>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--surface-alt)",
                      color: "var(--accent)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {mod.badge}
                  </span>
                </div>

                {/* Description */}
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {mod.description}
                </p>

                {/* Mini mockup produit */}
                <div
                  className="mt-1 rounded-[10px] px-3 py-2.5"
                  style={{
                    backgroundColor: "var(--surface-alt)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {mod.mockup.map((line, i) => (
                    <p
                      key={i}
                      className="truncate text-[11px] leading-5"
                      style={{
                        color: i === 0 ? "var(--text)" : "var(--text-muted)",
                        fontWeight: i === 0 ? 500 : 400,
                      }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          5 — 3 ÉTAPES
      ══════════════════════════════════════════════════════ */}
      <section className="px-5 py-20">
        <div className="mx-auto" style={{ maxWidth: "640px" }}>
          <h2
            className="mb-2 text-center text-2xl font-semibold"
            style={{ color: "var(--text)" }}
          >
            Prête en moins d&apos;une minute.
          </h2>
          <p
            className="mb-10 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Simple comme envoyer un message.
          </p>

          <div className="flex flex-col gap-4">
            {ETAPES.map((etape) => (
              <div
                key={etape.numero}
                className="flex items-start gap-5 rounded-[16px] px-6 py-5"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {etape.numero}
                </span>
                <div>
                  <p
                    className="mb-1 text-sm font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {etape.titre}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {etape.texte}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6 — DÉMO (composant client)
      ══════════════════════════════════════════════════════ */}
      <LandingDemo checkoutUrl={CHECKOUT_URL} />

      {/* ══════════════════════════════════════════════════════
          7 — TÉMOIGNAGES
      ══════════════════════════════════════════════════════ */}
      <section className="px-5 py-20">
        <div className="mx-auto" style={{ maxWidth: "1080px" }}>
          <h2
            className="mb-2 text-center text-2xl font-semibold"
            style={{ color: "var(--text)" }}
          >
            Ce que disent les professionnelles qui l&apos;utilisent.
          </h2>
          <p
            className="mb-10 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Des professionnelles de la beauté indépendantes, comme toi.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TEMOIGNAGES.map((t) => (
              <div key={t.nom} className="card flex flex-col gap-4">
                {/* Guillemets décoratifs */}
                <span
                  className="text-3xl leading-none"
                  style={{ color: "var(--accent)", opacity: 0.4 }}
                >
                  &ldquo;
                </span>
                <p
                  className="-mt-2 flex-1 text-sm leading-relaxed"
                  style={{ color: "var(--text)" }}
                >
                  {t.texte}
                </p>
                <div
                  className="pt-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {t.nom}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {t.metier}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          8 — OBJECTION "pas ChatGPT"
      ══════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-16"
        style={{
          backgroundColor: "var(--surface-alt)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto text-center" style={{ maxWidth: "620px" }}>
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Pourquoi pas ChatGPT ?
          </p>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--text)" }}
          >
            Boss Beauty Studio n&apos;est pas ChatGPT avec un habillage.
            C&apos;est un outil construit uniquement pour les professionnelles
            de la beauté indépendantes — avec des prompts entraînés sur la
            niche beauté Instagram. Le contenu est ancré dans ta spécialité,
            calibré pour l&apos;algorithme, et prêt à l&apos;emploi.{" "}
            <span className="font-medium" style={{ color: "var(--text)" }}>
              Pas de configuration. Pas de prompt à écrire. Pas de résultat
              générique.
            </span>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          9 — PRICING
      ══════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-20"
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "480px" }}>
          <h2
            className="mb-2 text-center text-2xl font-semibold"
            style={{ color: "var(--text)" }}
          >
            Un accès simple. Un tarif clair.
          </h2>
          <p
            className="mb-8 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Tout est inclus. Pas de surprise.
          </p>

          <div
            className="rounded-[20px] px-8 py-8"
            style={{
              backgroundColor: "var(--bg)",
              border: "2px solid var(--accent)",
              boxShadow: "0 8px 32px rgba(181,122,140,0.14)",
            }}
          >
            {/* Prix */}
            <div className="mb-5 text-center">
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                Accès complet
              </p>
              <div className="mt-3 flex items-end justify-center gap-1">
                <span
                  className="text-5xl font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  29€
                </span>
                <span
                  className="mb-1.5 text-base"
                  style={{ color: "var(--text-muted)" }}
                >
                  /mois
                </span>
              </div>
              <p
                className="mt-2 text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                Une seule nouvelle cliente rentabilise l&apos;abonnement.
              </p>
            </div>

            {/* Micro-réassurances */}
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {[
                "✓ Sans engagement",
                "✓ Accès immédiat",
                "✓ Compatible Canva gratuit",
              ].map((r) => (
                <span
                  key={r}
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  {r}
                </span>
              ))}
            </div>

            {/* Features */}
            <ul className="mb-7 flex flex-col gap-2.5">
              {FEATURES_PRICING.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2.5 text-sm"
                  style={{ color: "var(--text)" }}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href={CHECKOUT_URL}
              className="btn btn-primary"
              style={{
                width: "100%",
                fontSize: "1rem",
                padding: "0.8rem 1.5rem",
                display: "flex",
              }}
            >
              Commencer pour 29€/mois →
            </a>

            <p
              className="mt-3 text-center text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Paiement sécurisé · Annulation en 1 clic
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          10 — FAQ
      ══════════════════════════════════════════════════════ */}
      <section className="px-5 py-20">
        <div className="mx-auto" style={{ maxWidth: "640px" }}>
          <h2
            className="mb-2 text-center text-2xl font-semibold"
            style={{ color: "var(--text)" }}
          >
            Questions fréquentes
          </h2>
          <p
            className="mb-10 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Tout ce que tu veux savoir avant de commencer.
          </p>

          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={i}
                className="group rounded-[14px]"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                }}
              >
                <summary
                  className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  <span>{item.question}</span>
                  {/* Chevron — rotation via CSS open state */}
                  <span
                    className="shrink-0 text-base transition-transform duration-200 group-open:rotate-45"
                    style={{ color: "var(--accent)" }}
                  >
                    +
                  </span>
                </summary>
                <div
                  className="px-5 pb-4 pt-1 text-sm leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.reponse}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          11 — CTA FINAL
      ══════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-24 text-center"
        style={{
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "560px" }}>
          <h2
            className="mb-4 text-3xl font-semibold leading-snug"
            style={{ color: "var(--text)" }}
          >
            Ton prochain post est à 15 secondes.
          </h2>
          <p
            className="mb-8 text-base leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Rejoins les professionnelles de la beauté qui publient sans effort
            et remplissent leur agenda.
          </p>
          <a
            href={CHECKOUT_URL}
            className="btn btn-primary"
            style={{ fontSize: "1.0625rem", padding: "0.85rem 2rem" }}
          >
            Commencer pour 29€/mois →
          </a>
          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            Aucune carte bancaire requise pour l&apos;essai · Accès immédiat
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer style={{ backgroundColor: "var(--surface)" }}>
        <div
          className="mx-auto flex flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row"
          style={{ maxWidth: "1080px" }}
        >
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            ✨ Boss Beauty Studio
          </span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © 2025 Boss Beauty Studio · Tous droits réservés
          </p>
          <Link
            href="/login"
            className="text-xs font-medium"
            style={{ color: "var(--accent)" }}
          >
            Se connecter →
          </Link>
        </div>
      </footer>
    </div>
  );
}
