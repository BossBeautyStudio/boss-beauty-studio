// ============================================================
// app/programme-partenaire/page.tsx
//
// Page dédiée au programme partenaire Boss Beauty Studio.
// Accessible depuis le bloc "Programme partenaire" sur la landing.
// Serveur Component — aucune interaction nécessaire.
// ============================================================

import Link from "next/link";
import Image from "next/image";

const PARTNER_EMAIL = "hello@bossbeautystudio.site";

const AVANTAGES = [
  {
    icon: "💰",
    titre: "30 % récurrent",
    texte:
      "Tu touches 30 % du montant de chaque abonnement souscrit via ton lien — chaque mois, tant que la cliente reste abonnée.",
  },
  {
    icon: "🎁",
    titre: "Accès gratuit à l'outil",
    texte:
      "Dès ton acceptation, tu reçois un accès complet à Boss Beauty Studio — pour tester, utiliser, et présenter l'outil à ta communauté en toute authenticité.",
  },
  {
    icon: "📲",
    titre: "2 vidéos UGC au démarrage",
    texte:
      "On te demande seulement 2 vidéos UGC (unboxing, test en conditions réelles…) au départ. Aucune obligation de publier à une fréquence fixe ensuite.",
  },
  {
    icon: "🤝",
    titre: "Partenariat à long terme",
    texte:
      "On privilégie les partenariats durables avec des créatrices qui utilisent vraiment l'outil. Pas de volume imposé, juste de l'authenticité.",
  },
];

const CIBLES = [
  "Lash artists & technicienne extensions",
  "Prothésistes ongulaires",
  "Esthéticiennes & soins du visage",
  "Coiffeuses & coloristes",
  "Maquilleuses professionnelles",
  "Formatrices beauté & coachs",
  "Créatrices de contenu beauté",
];

export default function ProgrammePartenairePage() {
  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100dvh" }}>

      {/* ── Nav simple ───────────────────────────────────────── */}
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
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Boss Beauty Studio"
              width={120}
              height={32}
              priority
              style={{ objectFit: "contain" }}
            />
          </Link>
          <Link
            href="/login"
            className="btn btn-primary"
            style={{ fontSize: "0.875rem", padding: "0.45rem 1rem" }}
          >
            Accéder à l&apos;outil
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="px-5 py-14 sm:py-20 text-center"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "640px" }}>
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: "var(--surface-alt)",
              border: "1px solid var(--border)",
              color: "var(--accent)",
            }}
          >
            ✦ Programme partenaire
          </div>

          <h1
            className="mb-4 text-3xl font-semibold leading-snug sm:text-4xl"
            style={{ color: "var(--text)" }}
          >
            Gagne{" "}
            <span style={{ color: "var(--accent)" }}>30 % récurrent</span>
            <br />
            en recommandant Boss Beauty Studio
          </h1>

          <p
            className="mb-8 text-base leading-relaxed"
            style={{ color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto 2rem" }}
          >
            Tu es créatrice beauté, formatrice ou tu as une communauté dans
            la niche beauté ? Recommande Boss Beauty Studio et touche une
            commission tous les mois.
          </p>

          <a
            href={`mailto:${PARTNER_EMAIL}?subject=Candidature%20programme%20partenaire&body=Bonjour%2C%0A%0AJe%20souhaite%20postuler%20au%20programme%20partenaire%20Boss%20Beauty%20Studio.%0A%0AMon%20profil%20%3A%0A-%20Sp%C3%A9cialit%C3%A9%20%3A%20%0A-%20R%C3%A9seaux%20%3A%20%0A-%20Taille%20communaut%C3%A9%20%3A%20%0A%0ACordialement`}
            className="btn btn-primary"
            style={{ fontSize: "1rem", padding: "0.8rem 2rem" }}
          >
            Devenir partenaire →
          </a>

          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            Réponse sous 48h · Accès gratuit à l&apos;outil dès l&apos;acceptation
          </p>
        </div>
      </section>

      {/* ── À qui s'adresse ce programme ─────────────────────── */}
      <section
        className="px-5 py-14 sm:py-16"
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "720px" }}>
          <h2
            className="mb-2 text-center text-xl font-semibold sm:text-2xl"
            style={{ color: "var(--text)" }}
          >
            À qui s&apos;adresse ce programme ?
          </h2>
          <p
            className="mb-8 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            On cherche des créatrices authentiques qui parlent déjà à des
            professionnelles de la beauté.
          </p>

          <div className="flex flex-wrap justify-center gap-2.5">
            {CIBLES.map((cible) => (
              <span
                key={cible}
                className="rounded-full px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                {cible}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Avantages ────────────────────────────────────────── */}
      <section
        className="px-5 py-14 sm:py-16"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "720px" }}>
          <h2
            className="mb-2 text-center text-xl font-semibold sm:text-2xl"
            style={{ color: "var(--text)" }}
          >
            Ce que tu obtiens
          </h2>
          <p
            className="mb-10 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Un partenariat simple, transparent, sans contrainte de volume.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {AVANTAGES.map((av) => (
              <div
                key={av.titre}
                className="rounded-[16px] p-5"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div className="mb-3 text-2xl">{av.icon}</div>
                <p
                  className="mb-1.5 text-sm font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {av.titre}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {av.texte}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ────────────────────────────────── */}
      <section
        className="px-5 py-14 sm:py-16"
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "560px" }}>
          <h2
            className="mb-10 text-center text-xl font-semibold sm:text-2xl"
            style={{ color: "var(--text)" }}
          >
            Comment ça marche ?
          </h2>

          <div className="flex flex-col gap-6">
            {[
              {
                num: "01",
                titre: "Tu postules",
                texte: "Envoie-nous un email avec ton profil, ta spécialité et tes réseaux. On revient vers toi sous 48h.",
              },
              {
                num: "02",
                titre: "On t'accepte et tu reçois ton accès",
                texte: "Dès validation, tu obtiens un accès complet à Boss Beauty Studio et ton lien partenaire personnalisé.",
              },
              {
                num: "03",
                titre: "Tu crées 2 vidéos UGC",
                texte: "Un unboxing, un test en conditions réelles. C'est tout ce qu'on demande au départ. Spontané, authentique.",
              },
              {
                num: "04",
                titre: "Tu partages, tu touches tes commissions",
                texte: "Chaque abonnement souscrit via ton lien te rapporte 30 % par mois, automatiquement.",
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {step.num}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text)" }}>
                    {step.titre}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {step.texte}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────── */}
      <section className="px-5 py-14 sm:py-20 text-center">
        <div className="mx-auto" style={{ maxWidth: "480px" }}>
          <h2
            className="mb-4 text-xl font-semibold sm:text-2xl"
            style={{ color: "var(--text)" }}
          >
            Prête à rejoindre le programme ?
          </h2>
          <p
            className="mb-7 text-sm leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Envoie-nous un email avec ton profil et quelques mots sur ta
            communauté. On revient vers toi sous 48h.
          </p>

          <a
            href={`mailto:${PARTNER_EMAIL}?subject=Candidature%20programme%20partenaire&body=Bonjour%2C%0A%0AJe%20souhaite%20postuler%20au%20programme%20partenaire%20Boss%20Beauty%20Studio.%0A%0AMon%20profil%20%3A%0A-%20Sp%C3%A9cialit%C3%A9%20%3A%20%0A-%20R%C3%A9seaux%20%3A%20%0A-%20Taille%20communaut%C3%A9%20%3A%20%0A%0ACordialement`}
            className="btn btn-primary"
            style={{ fontSize: "1rem", padding: "0.8rem 2rem" }}
          >
            Postuler au programme →
          </a>

          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            {PARTNER_EMAIL}
          </p>
        </div>
      </section>

      {/* ── Footer minimal ───────────────────────────────────── */}
      <footer style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)" }}>
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
          <Link
            href="/"
            className="text-xs font-medium"
            style={{ color: "var(--accent)" }}
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </footer>

    </div>
  );
}
