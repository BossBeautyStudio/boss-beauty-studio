// ============================================================
// app/page.tsx — Landing page Boss Beauty Studio V1
//
// Sections :
//   Nav · Hero · Problème · Solution · Résultat · Démo ·
//   Produit · Avis clients · Pricing · FAQ · CTA final · Footer
// ============================================================

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import LandingDemoInteractive from "@/components/landing/LandingDemoInteractive";

// Toutes les CTAs landing pointent vers l'accès gratuit.
// Stripe est déclenché depuis le paywall dans le dashboard, pas ici.
const FREE_ENTRY_URL = "/login";

// ── Avis clients ───────────────────────────────────────────

const AVIS = [
  {
    image: "/images/avis-1.jpg",
    nom: "Laura M.",
    metier: "Technicienne extensions cils · Lyon",
    texte:
      "Je passais 2h le dimanche à préparer ma semaine Instagram. Maintenant ça me prend 10 minutes. Et mes posts sont bien meilleurs.",
    etoiles: 5,
  },
  {
    image: "/images/avis-2.jpg",
    nom: "Inès B.",
    metier: "Prothésiste ongulaire · Bordeaux",
    texte:
      "Ce qui m'a convaincue c'est que le contenu parle vraiment de mon métier. C'est pas du contenu générique sorti de ChatGPT.",
    etoiles: 5,
  },
  {
    image: "/images/avis-3.jpg",
    nom: "Sofia K.",
    metier: "Esthéticienne · Paris",
    texte:
      "J'avais peur que ce soit compliqué. J'ai généré mon premier planning en moins d'une minute. Je recommande à toutes mes collègues.",
    etoiles: 5,
  },
  {
    image: "/images/avis-4.jpg",
    nom: "Camille R.",
    metier: "Coloriste & coiffeuse · Nantes",
    texte:
      "En 3 semaines j'ai doublé mes demandes de RDV via Instagram. Le contenu est vraiment ciblé pour la beauté, ça se voit tout de suite.",
    etoiles: 5,
  },
];

// ── Features pricing ───────────────────────────────────────

const FEATURES_PRICING = [
  "Planning Instagram — 7 posts par semaine",
  "Carrousel Instagram avec guide Canva",
  "Réponse DM — 3 variantes par message",
  "Accroches Instagram — 10 accroches percutantes",
  "Historique de toutes tes générations",
  "Contenu 100 % adapté à ta spécialité",
];

// ── FAQ ────────────────────────────────────────────────────

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
      "En quelques secondes. Tu saisis ta spécialité, tu cliques sur 'Générer', et tu obtiens un planning de 7 posts pour la semaine — thèmes, format (post, carrousel, reel) et idée de contenu — prêts à développer.",
  },
  {
    question: "Puis-je annuler à tout moment ?",
    reponse:
      "Oui, sans justification et sans délai de préavis, en un clic depuis ton espace personnel. L'accès reste actif jusqu'à la fin de la période déjà payée.",
  },
];

// ── Composant principal ────────────────────────────────────

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Supabase redirige parfois le code PKCE vers le Site URL (/) au lieu de /auth/callback.
  // On intercepte ici et on redirige proprement avant même d'afficher la landing page.
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : null;
  if (code) {
    redirect(`/auth/callback?code=${code}`);
  }
  return (
    <div className="pb-[72px] lg:pb-0" style={{ backgroundColor: "var(--bg)", minHeight: "100dvh" }}>

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
          <Image
            src="/logo.png"
            alt="Boss Beauty Studio"
            width={120}
            height={32}
            priority
            style={{ objectFit: "contain" }}
          />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="btn btn-ghost"
              style={{ fontSize: "0.875rem", padding: "0.45rem 1rem" }}
            >
              Se connecter
            </Link>
            <a
              href={FREE_ENTRY_URL}
              className="btn btn-primary"
              style={{ fontSize: "0.875rem", padding: "0.45rem 1rem" }}
            >
              Essayer gratuitement
            </a>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          1 — HERO
          Ratio desktop : 58% texte / 42% image
          Preuve sociale renforcée sous le CTA
      ══════════════════════════════════════════════════════ */}
      <section
        className="fade-in"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="mx-auto flex flex-col items-stretch lg:flex-row"
          style={{ maxWidth: "1080px", minHeight: "540px" }}
        >
          {/* ── Colonne texte (58%) ── */}
          <div
            className="flex flex-col justify-center px-6 py-10 lg:py-20 lg:pr-16"
            style={{ flex: "0 0 58%" }}
          >
            {/* Badge niche */}
            <div
              className="mb-5 inline-flex w-fit self-center items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold lg:self-start"
              style={{
                backgroundColor: "var(--surface-alt)",
                border: "1px solid var(--border)",
                color: "var(--accent)",
              }}
            >
              ✦ Pensé pour les professionnelles beauté indépendantes
            </div>

            {/* H1 */}
            <h1
              className="mb-4 text-center text-3xl font-semibold leading-tight sm:text-4xl lg:text-left lg:text-5xl"
              style={{ color: "var(--text)" }}
            >
              Transforme ton Instagram
              <br />
              <span style={{ color: "var(--accent)" }}>
                en machine à clientes
              </span>
            </h1>

            <p
              className="mb-7 mx-auto max-w-[420px] text-center text-base leading-relaxed lg:mx-0 lg:text-left lg:text-lg"
              style={{ color: "var(--text-muted)" }}
            >
              Boss Beauty Studio génère tes posts Instagram et t&apos;aide
              à attirer des clientes automatiquement.
            </p>

            {/* CTA principal */}
            <div>
              <a
                href={FREE_ENTRY_URL}
                className="btn btn-primary w-full sm:w-auto"
                style={{ fontSize: "1rem", padding: "0.8rem 1.75rem", display: "flex", justifyContent: "center" }}
              >
                Essayer gratuitement →
              </a>
            </div>

            {/* Réassurance 3 points sous le bouton */}
            <div
              className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 lg:justify-start"
            >
              {[
                "✓ 2 générations gratuites",
                "✓ Aucune compétence requise",
                "✓ Sans carte bancaire",
              ].map((item) => (
                <span
                  key={item}
                  className="text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item}
                </span>
              ))}
            </div>

            {/* Preuve sociale — séparateur + ligne niche */}
            <div
              className="mt-6 flex items-center justify-center gap-3 pt-6 lg:justify-start"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {/* Avatars simulés */}
              <div className="flex -space-x-2">
                {["L", "I", "S", "C"].map((initial, i) => (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-2"
                    style={{
                      backgroundColor: `hsl(${330 + i * 15}deg 35% 65%)`,
                      outline: "2px solid var(--bg)",
                    }}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <p
                className="text-xs leading-snug"
                style={{ color: "var(--text-muted)", maxWidth: "260px" }}
              >
                <span
                  className="font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  Lash artists, esthéticiennes, ongleries —
                </span>{" "}
                utilisent Boss Beauty Studio pour remplir leur agenda.
              </p>
            </div>
          </div>

          {/* ── Colonne image (42%) ── */}
          <div
            className="relative w-full h-[240px] md:h-[420px] lg:h-auto overflow-hidden rounded-xl lg:rounded-none lg:flex-none lg:w-[42%]"
          >
            <Image
              src="/images/hero-estheticienne.jpg"
              alt="Esthéticienne professionnelle"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 42vw"
              className="object-cover object-center"
            />
            {/* Fondu gauche sur desktop */}
            <div
              className="absolute inset-y-0 left-0 hidden lg:block"
              style={{
                width: "90px",
                background: "linear-gradient(to right, var(--bg), transparent)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2 — PROBLÈME
          Zoom réduit — objectPosition plus bas pour montrer
          épaules et contexte
      ══════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="mx-auto flex flex-col items-stretch lg:flex-row-reverse"
          style={{ maxWidth: "1080px", minHeight: "440px" }}
        >
          {/* ── Colonne texte (55%) ── */}
          <div
            className="flex flex-col justify-center px-6 py-10 lg:py-20 lg:pl-16"
            style={{ flex: "0 0 55%" }}
          >
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              Le problème
            </p>
            <h2
              className="mb-5 text-2xl font-semibold leading-snug sm:text-3xl"
              style={{ color: "var(--text)" }}
            >
              Tu postes sur Instagram…
              <br />
              <span style={{ color: "var(--accent)" }}>
                mais personne ne réserve.
              </span>
            </h2>
            <p
              className="max-w-[400px] text-base leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Beaucoup d&apos;esthéticiennes passent des heures à créer du
              contenu sans obtenir de clientes. Tu publies dans le vide, sans
              stratégie, sans système — et ton agenda reste vide pendant que
              d&apos;autres remplissent le leur.
            </p>
          </div>

          {/* ── Colonne image (45%) — zoom réduit ── */}
          <div
            className="relative w-full h-[240px] md:h-[420px] lg:h-auto overflow-hidden rounded-xl lg:rounded-none lg:flex-none lg:w-[45%]"
          >
            <Image
              src="/images/probleme-estheticienne.jpg"
              alt="Esthéticienne face au problème de contenu Instagram"
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover object-center"
            />
            <div
              className="absolute inset-y-0 right-0 hidden lg:block"
              style={{
                width: "90px",
                background:
                  "linear-gradient(to left, var(--surface), transparent)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3 — SOLUTION
      ══════════════════════════════════════════════════════ */}
      <section style={{ borderBottom: "1px solid var(--border)" }}>
        <div
          className="mx-auto flex flex-col items-stretch lg:flex-row"
          style={{ maxWidth: "1080px", minHeight: "440px" }}
        >
          {/* ── Colonne texte (55%) ── */}
          <div
            className="flex flex-col justify-center px-6 py-10 lg:py-20 lg:pr-16"
            style={{ flex: "0 0 55%" }}
          >
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              La solution
            </p>
            <h2
              className="mb-5 text-2xl font-semibold leading-snug sm:text-3xl"
              style={{ color: "var(--text)" }}
            >
              Chaque post peut
              <br />
              <span style={{ color: "var(--accent)" }}>
                attirer des clientes
              </span>
            </h2>
            <p
              className="max-w-[400px] text-base leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Boss Beauty Studio génère des idées de contenu, des textes de
              posts et des accroches optimisés pour attirer des clientes.
              Tu indiques ta spécialité, tu génères en un clic — le contenu
              est adapté à ton univers, prêt à publier immédiatement.
            </p>
          </div>

          {/* ── Colonne image (45%) ── */}
          <div
            className="relative w-full h-[240px] md:h-[420px] lg:h-auto overflow-hidden rounded-xl lg:rounded-none lg:flex-none lg:w-[45%]"
          >
            <Image
              src="/images/solution-estheticienne.jpg"
              alt="Esthéticienne satisfaite avec son contenu généré"
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover object-center"
            />
            <div
              className="absolute inset-y-0 left-0 hidden lg:block"
              style={{
                width: "90px",
                background: "linear-gradient(to right, var(--bg), transparent)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          4 — RÉSULTAT
      ══════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="mx-auto flex flex-col items-stretch lg:flex-row-reverse"
          style={{ maxWidth: "1080px", minHeight: "440px" }}
        >
          {/* ── Colonne texte + DM (55%) ── */}
          <div
            className="flex flex-col justify-center px-6 py-10 lg:py-20 lg:pl-16"
            style={{ flex: "0 0 55%" }}
          >
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              Le résultat
            </p>
            <h2
              className="mb-7 text-2xl font-semibold leading-snug sm:text-3xl"
              style={{ color: "var(--text)" }}
            >
              Imagine recevoir
              <br />
              <span style={{ color: "var(--accent)" }}>
                ce type de message
              </span>
            </h2>

            {/* Bulles DM */}
            <div className="flex flex-col gap-3" style={{ maxWidth: "380px" }}>
              {[
                { msg: "Bonjour vous avez une disponibilité cette semaine ?", heure: "09:14", initiale: "L" },
                { msg: "Je voudrais réserver pour un lash lift.", heure: "11:32", initiale: "I" },
                { msg: "Votre dernier post m'a convaincue ! C'est possible samedi ?", heure: "14:05", initiale: "S" },
              ].map((dm, i) => (
                <div key={i} className="flex items-end gap-2.5">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--accent)", opacity: 0.75 }}
                  >
                    {dm.initiale}
                  </div>
                  <div
                    className="rounded-[16px] rounded-bl-[4px] px-4 py-2.5"
                    style={{
                      backgroundColor: "var(--bg)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <p
                      className="text-sm leading-snug"
                      style={{ color: "var(--text)" }}
                    >
                      {dm.msg}
                    </p>
                    <p
                      className="mt-1 text-right text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {dm.heure}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Colonne image (45%) ── */}
          <div
            className="relative w-full h-[240px] md:h-[420px] lg:h-auto overflow-hidden rounded-xl lg:rounded-none lg:flex-none lg:w-[45%]"
          >
            <Image
              src="/images/notification-client.jpg"
              alt="Notification de réservation cliente"
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover object-center"
            />
            <div
              className="absolute inset-y-0 right-0 hidden lg:block"
              style={{
                width: "90px",
                background: "linear-gradient(to left, var(--surface), transparent)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA INTERMÉDIAIRE — mobile uniquement (après Résultat)
      ══════════════════════════════════════════════════════ */}
      <div
        className="px-5 py-7 lg:hidden"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <a
          href={FREE_ENTRY_URL}
          className="btn btn-primary"
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            fontSize: "1rem",
            padding: "0.8rem 1.5rem",
          }}
        >
          Essayer gratuitement →
        </a>
        <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          2 générations gratuites · Sans carte bancaire
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          5 — DÉMO INTERACTIVE (Feature 4 / V1.2)
          Composant client — génère un post en temps réel
          via /api/generate/demo (public, mock data)
      ══════════════════════════════════════════════════════ */}
      <LandingDemoInteractive />

      {/* ══════════════════════════════════════════════════════
          6 — PRODUIT (dashboard)
      ══════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="mx-auto flex flex-col items-stretch lg:flex-row"
          style={{ maxWidth: "1080px", minHeight: "440px" }}
        >
          {/* ── Colonne texte (42%) ── */}
          <div
            className="flex flex-col justify-center px-6 py-10 lg:py-20 lg:pr-14"
            style={{ flex: "0 0 42%" }}
          >
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              L&apos;outil
            </p>
            <h2
              className="mb-6 text-2xl font-semibold leading-snug sm:text-3xl"
              style={{ color: "var(--text)" }}
            >
              Tout est généré dans ton
              <br />
              <span style={{ color: "var(--accent)" }}>
                espace Boss Beauty Studio
              </span>
            </h2>

            <ul className="flex flex-col gap-3">
              {[
                { icon: "📅", label: "Idées de posts" },
                { icon: "✍️", label: "Textes de posts" },
                { icon: "⚡", label: "Accroches Instagram" },
                { icon: "💬", label: "Réponses DM" },
              ].map((f) => (
                <li key={f.label} className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-base"
                    style={{ backgroundColor: "var(--surface-alt)" }}
                  >
                    {f.icon}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>

            <a
              href={FREE_ENTRY_URL}
              className="btn btn-primary mt-8 w-full sm:w-fit"
              style={{ fontSize: "0.9375rem", padding: "0.75rem 1.5rem", display: "flex", justifyContent: "center" }}
            >
              Essayer gratuitement →
            </a>
          </div>

          {/* ── Colonne image dashboard (58%) ── */}
          <div
            className="relative w-full h-[240px] md:h-[420px] lg:h-auto overflow-hidden rounded-xl lg:rounded-none lg:flex-none lg:w-[58%]"
          >
            <Image
              src="/images/dashboard-saas.jpg"
              alt="Dashboard Boss Beauty Studio"
              fill
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-contain object-center md:object-cover"
            />
            <div
              className="absolute inset-y-0 left-0 hidden lg:block"
              style={{
                width: "90px",
                background: "linear-gradient(to right, var(--surface), transparent)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          7 — AVIS CLIENTS
      ══════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-12 sm:py-20"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "1080px" }}>
          <p
            className="mb-2 text-center text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Avis clients
          </p>
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
            Des pros de la beauté indépendantes, comme toi.
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AVIS.map((avis, i) => (
              <div
                key={avis.nom}
                className={`flex flex-col overflow-hidden rounded-[18px]${i >= 2 ? " hidden sm:flex" : ""}`}
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Photo */}
                <div
                  className={`relative w-full overflow-hidden ${i < 2 ? "h-[200px]" : "h-[160px]"} sm:h-[200px]`}
                >
                  <Image
                    src={avis.image}
                    alt={`Avis de ${avis.nom}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-top"
                  />
                </div>

                {/* Contenu */}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  {/* Étoiles */}
                  <div
                    className="flex gap-0.5 text-sm"
                    aria-label={`${avis.etoiles} étoiles sur 5`}
                    style={{ color: "#F59E0B" }}
                  >
                    {"★".repeat(avis.etoiles)}
                  </div>

                  {/* Texte */}
                  <p
                    className="flex-1 text-sm leading-relaxed"
                    style={{ color: "var(--text)" }}
                  >
                    &ldquo;{avis.texte}&rdquo;
                  </p>

                  {/* Identité */}
                  <div
                    className="pt-3"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {avis.nom}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {avis.metier}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          8 — PRICING
      ══════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-14 sm:py-20"
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

            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {["✓ Sans engagement", "✓ Accès immédiat", "✓ Compatible Canva gratuit"].map(
                (r) => (
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
                )
              )}
            </div>

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
              href={FREE_ENTRY_URL}
              className="btn btn-primary"
              style={{
                width: "100%",
                fontSize: "1rem",
                padding: "0.8rem 1.5rem",
                display: "flex",
              }}
            >
              Commencer — 2 essais gratuits →
            </a>

            <p
              className="mt-3 text-center text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Sans carte bancaire · Puis 29€/mois · Annulation en 1 clic
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          9 — FAQ
      ══════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-14 sm:py-20"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
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
          10 — PROGRAMME PARTENAIRE
      ══════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-14 sm:py-20"
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="mx-auto flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-16"
          style={{ maxWidth: "900px" }}
        >
          {/* Texte */}
          <div className="flex-1 text-center lg:text-left">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: "var(--surface-alt)",
                border: "1px solid var(--border)",
                color: "var(--accent)",
              }}
            >
              ✦ Programme partenaire
            </div>

            <h2
              className="mb-3 text-2xl font-semibold leading-snug sm:text-3xl"
              style={{ color: "var(--text)" }}
            >
              Gagne{" "}
              <span style={{ color: "var(--accent)" }}>30 % récurrent</span>{" "}
              en recommandant Boss Beauty Studio
            </h2>

            <p
              className="mb-6 text-sm leading-relaxed"
              style={{ color: "var(--text-muted)", maxWidth: "420px", margin: "0 auto 1.5rem" }}
            >
              Tu es lash artist, formatrice, esthéticienne ou créatrice beauté ?
              Partage l&apos;outil à ta communauté et touche une commission mensuelle
              récurrente — sans contrainte de volume.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/programme-partenaire"
                className="btn btn-primary"
                style={{ fontSize: "0.9375rem", padding: "0.7rem 1.5rem" }}
              >
                Devenir partenaire →
              </Link>
              <Link
                href="/programme-partenaire"
                className="text-sm font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Voir les détails
              </Link>
            </div>
          </div>

          {/* Carte chiffre */}
          <div
            className="w-full shrink-0 rounded-[20px] px-8 py-7 text-center lg:w-[240px]"
            style={{
              backgroundColor: "var(--bg)",
              border: "2px solid var(--accent)",
              boxShadow: "0 8px 32px rgba(181,122,140,0.12)",
            }}
          >
            <p
              className="text-5xl font-semibold"
              style={{ color: "var(--accent)" }}
            >
              30 %
            </p>
            <p
              className="mt-1 text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              de commission récurrente
            </p>
            <div
              className="my-4 h-px w-full"
              style={{ backgroundColor: "var(--border)" }}
            />
            <div className="flex flex-col gap-1.5 text-left text-xs" style={{ color: "var(--text-muted)" }}>
              <span>✓ Accès gratuit à l&apos;outil</span>
              <span>✓ Partenariat durable</span>
              <span>✓ 2 vidéos UGC au départ</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          11 — CTA FINAL
      ══════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-16 sm:py-24 text-center"
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "560px" }}>
          <h2
            className="mb-4 text-2xl sm:text-3xl font-semibold leading-snug"
            style={{ color: "var(--text)" }}
          >
            Ton prochain post est à 15 secondes.
          </h2>
          <p
            className="mb-7 text-base leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Rejoins les professionnelles de la beauté qui publient sans effort
            et remplissent leur agenda.
          </p>
          <a
            href={FREE_ENTRY_URL}
            className="btn btn-primary w-full sm:w-auto"
            style={{ fontSize: "1.0625rem", padding: "0.85rem 2rem", display: "flex", justifyContent: "center" }}
          >
            Essayer gratuitement →
          </a>
          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            2 générations gratuites · Sans carte bancaire · Accès immédiat
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STICKY BAR — mobile uniquement (lg:hidden)
          Toujours visible en bas de l'écran
      ══════════════════════════════════════════════════════ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 lg:hidden"
        style={{
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.10)",
        }}
      >
        <a
          href={FREE_ENTRY_URL}
          className="btn btn-primary"
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "1rem",
            padding: "0.75rem 1.5rem",
          }}
        >
          Essayer gratuitement →
        </a>
      </div>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer style={{ backgroundColor: "var(--surface)" }}>
        <div
          className="mx-auto flex flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row"
          style={{ maxWidth: "1080px" }}
        >
          <Image
            src="/logo.png"
            alt="Boss Beauty Studio"
            width={100}
            height={27}
            style={{ objectFit: "contain" }}
          />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © 2025 Boss Beauty Studio · Tous droits réservés
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/programme-partenaire"
              className="text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              Programme partenaire
            </Link>
            <Link
              href="/login"
              className="text-xs font-medium"
              style={{ color: "var(--accent)" }}
            >
              Se connecter →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
