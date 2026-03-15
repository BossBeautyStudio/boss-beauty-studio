// ============================================================
// app/(dashboard)/dashboard/page.tsx
//
// Page d'accueil du dashboard — 4 cartes modules.
// ============================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkQuota } from "@/lib/quota";

const MODULES = [
  {
    href: "/dashboard/post",
    title: "Post Instagram",
    description:
      "Choisis un type de contenu (attirer des clientes, avant/après, conseil, promo…) et génère un post complet en 10 secondes.",
    badge: "7 types · ~10 sec",
    cta: "Créer un post",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    ),
  },
  {
    href: "/dashboard/planning",
    title: "Planning Instagram",
    description:
      "30 posts clé-en-main — caption, hashtags, Story et Reel — pour ne plus jamais manquer d'inspiration.",
    badge: "30 posts · ~15 sec",
    cta: "Générer mon planning",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/dashboard/carousel",
    title: "Carrousel Instagram",
    description:
      "Un carrousel pédagogique complet, slide par slide, prêt à publier. Le format qui génère le plus de sauvegardes.",
    badge: "Canva inclus · ~15 sec",
    cta: "Créer un carrousel",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="6" width="14" height="12" rx="2" />
        <path d="M22 8v8" />
        <path d="M19 10v4" />
      </svg>
    ),
  },
  {
    href: "/dashboard/dm",
    title: "Réponse DM",
    description:
      "3 réponses rédigées à ta place — courte, standard ou premium — pour convertir chaque message en rendez-vous.",
    badge: "3 variantes · ~10 sec",
    cta: "Rédiger une réponse",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/hooks",
    title: "Hooks Instagram",
    description:
      "10 accroches percutantes pour stopper le scroll dès la première phrase. Le levier le plus sous-estimé d'Instagram.",
    badge: "10 accroches · ~10 sec",
    cta: "Générer des hooks",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Prénom ou fallback sur la partie locale de l'email
  const displayName =
    user.user_metadata?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "toi";

  // Quota — lecture silencieuse
  let quota = null;
  try {
    quota = await checkQuota(user.id);
  } catch {
    // Non critique
  }

  return (
    <div className="fade-in">

      {/* ── En-tête ─────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="mb-1 flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              Bonjour, {displayName} 👋
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Que veux-tu créer aujourd&apos;hui ?
            </p>
          </div>

          {/* Compteur quota */}
          {quota && (
            <div
              className="shrink-0 rounded-xl px-4 py-3 text-right"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                minWidth: "148px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <p
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Générations restantes
              </p>
              <p
                className="mt-0.5 text-xl font-semibold tabular-nums"
                style={{ color: "var(--text)" }}
              >
                {quota.remaining}
                <span
                  className="ml-1 text-sm font-normal"
                  style={{ color: "var(--text-muted)" }}
                >
                  / {quota.limit}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Séparateur décoratif */}
        <div
          className="mt-6 h-px w-full"
          style={{ backgroundColor: "var(--border)" }}
        />
      </div>

      {/* ── Grille de modules ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {MODULES.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="card card-link flex flex-col"
            style={{ gap: "1.5rem" }}
          >
            {/* Icône — couleur accent */}
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "var(--surface-alt)",
                color: "var(--accent)",
              }}
            >
              {mod.icon}
            </div>

            {/* Texte */}
            <div className="flex flex-1 flex-col gap-2">
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text)" }}
              >
                {mod.title}
              </h2>
              <p
                className="flex-1 text-sm leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {mod.description}
              </p>
              {/* Badge de valeur */}
              <span
                className="mt-1 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: "var(--surface-alt)",
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                }}
              >
                {mod.badge}
              </span>
            </div>

            {/* CTA inline */}
            <div
              className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: "var(--accent)" }}
            >
              {mod.cta}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
