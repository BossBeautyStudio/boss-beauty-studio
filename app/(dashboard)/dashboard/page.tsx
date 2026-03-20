// ============================================================
// app/(dashboard)/dashboard/page.tsx
//
// Page d'accueil du dashboard — vue générale personnalisée.
// Sections :
//   1. Header : bonjour + date + badge quota
//   2. Stats : générations totales · contenus sauvegardés · modules disponibles
//   3. Accès rapide : 5 raccourcis modules
//   4. Dernières créations sauvegardées (3 max)
//   5. Conseil du jour (rotatif selon le jour de la semaine)
// ============================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkQuota, FREE_LIMIT } from "@/lib/quota";
import { PostHogInstallTest } from "@/components/dashboard/PostHogInstallTest";

// ── Conseil du jour ───────────────────────────────────────────────────────────

const CONSEILS = [
  {
    emoji: "📸",
    titre: "La règle des 3 formats",
    texte:
      "Alterne chaque semaine : 1 post éducatif, 1 avant/après, 1 coulisse. Tes abonnées restent engagées et tu varies les plaisirs.",
  },
  {
    emoji: "⏰",
    titre: "Le meilleur moment pour publier",
    texte:
      "Pour les salons beauty, les créneaux les plus performants sont 11h–13h et 19h–21h. Planifie tes posts à ces horaires pour maximiser la portée.",
  },
  {
    emoji: "💬",
    titre: "L'accroche qui stoppe le scroll",
    texte:
      'Commence toujours ton post par une question ou une affirmation forte. "Tu fais encore cette erreur avec tes ongles ?" performe toujours mieux qu\'une description.',
  },
  {
    emoji: "🎯",
    titre: "Hashtags : qualité > quantité",
    texte:
      "5 à 10 hashtags ultra-ciblés (ex : #ongleriebordeaux) convertissent mieux que 30 hashtags génériques. Pense local et niche.",
  },
  {
    emoji: "✨",
    titre: "Le pouvoir des Stories",
    texte:
      "Une Story \"coulisse\" (ton espace de travail, un résultat en cours) génère 3x plus de réponses qu'un post classique. Montre les coulisses !",
  },
  {
    emoji: "📊",
    titre: "Analyse tes tops posts",
    texte:
      "Une fois par mois, regarde tes 3 posts les plus sauvegardés. Ils révèlent exactement ce que ton audience veut voir. Répète cette recette.",
  },
  {
    emoji: "🤝",
    titre: "Réponds en moins de 1h",
    texte:
      'Instagram favorise les comptes qui répondent vite. Un DM répondu dans l\'heure augmente les chances de réservation de 60%. Utilise le module "Réponse DM" !',
  },
];

// ── Labels modules ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  post: "Post Instagram",
  carousel: "Carrousel",
  hooks: "Accroches",
  dm: "Réponse DM",
  planning: "Idées semaine",
  story: "Stories",
  reel: "Script Reel",
};

const TYPE_ICONS: Record<string, string> = {
  post: "📝",
  carousel: "🖼️",
  hooks: "⚡",
  dm: "💬",
  planning: "📅",
  story: "📱",
  reel: "🎬",
};

const MODULE_HREFS: Record<string, string> = {
  post: "/dashboard/post",
  carousel: "/dashboard/carousel",
  hooks: "/dashboard/hooks",
  dm: "/dashboard/dm",
  planning: "/dashboard/planning",
  story: "/dashboard/story-reel",
  reel: "/dashboard/story-reel",
};

// ── Raccourcis rapides ────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    href: "/dashboard/planning",
    label: "Idées de la semaine",
    emoji: "📅",
    desc: "7 posts générés en 5 sec",
    accent: true,
  },
  {
    href: "/dashboard/post",
    label: "Post Instagram",
    emoji: "📝",
    desc: "Prêt à publier",
    accent: false,
  },
  {
    href: "/dashboard/carousel",
    label: "Carrousel",
    emoji: "🖼️",
    desc: "Format top engagement",
    accent: false,
  },
  {
    href: "/dashboard/story-reel",
    label: "Story & Reel",
    emoji: "🎬",
    desc: "Script + Canva inclus",
    accent: false,
  },
  {
    href: "/dashboard/dm",
    label: "Réponse DM",
    emoji: "💬",
    desc: "Convertir en RDV",
    accent: false,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ── Données utilisateur ────────────────────────────────────────────────────
  let isSubscriber = false;
  let quota = null;
  let freeUsed = 0;
  let totalGenerations = 0;
  let totalSaved = 0;
  let recentSaved: Array<{
    id: string;
    module: string;
    title: string;
    created_at: string;
  }> = [];
  let brandProfile: { nom_marque?: string; specialite?: string } | null = null;

  try {
    const serviceClient = createServiceClient();

    // Données user (quota + abonnement)
    const { data: userData } = await serviceClient
      .from("users")
      .select("subscription_status, free_quota_used")
      .eq("id", user.id)
      .single();

    isSubscriber = userData?.subscription_status === "active";
    freeUsed = userData?.free_quota_used ?? 0;

    if (isSubscriber) quota = await checkQuota(user.id);

    // Nombre total de générations
    const { count: genCount } = await serviceClient
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    totalGenerations = genCount ?? 0;

    // Contenus sauvegardés (total + 3 derniers)
    const { data: savedData, count: savedCount } = await serviceClient
      .from("saved_contents")
      .select("id, module, title, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    totalSaved = savedCount ?? 0;
    recentSaved = (savedData ?? []) as typeof recentSaved;

    // Profil de marque
    const { data: bp } = await serviceClient
      .from("brand_profiles")
      .select("nom_marque, specialite")
      .eq("user_id", user.id)
      .maybeSingle();
    brandProfile = bp;
  } catch {
    // Non critique
  }

  // ── Calculs affichage ──────────────────────────────────────────────────────
  const freeRemaining = Math.max(0, FREE_LIMIT - freeUsed);

  const displayName =
    brandProfile?.nom_marque?.split(" ")[0] ??
    user.user_metadata?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "toi";

  // Conseil du jour — basé sur le jour de la semaine (0=dim … 6=sam)
  const dayIndex = new Date().getDay();
  const conseil = CONSEILS[dayIndex % CONSEILS.length];

  // Date lisible
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <div className="fade-in">

      {/* ── 1. Header ────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              {dateFormatted}
            </p>
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              Bonjour, {displayName} 👋
            </h1>
            {brandProfile?.specialite && (
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {brandProfile.specialite} · Que créons-nous aujourd&apos;hui ?
              </p>
            )}
            {!brandProfile?.specialite && (
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Que veux-tu créer aujourd&apos;hui ?
              </p>
            )}
          </div>

          {/* Badge quota */}
          {isSubscriber && quota && (
            <div
              className="shrink-0 rounded-xl px-4 py-3 text-right"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                minWidth: "148px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Générations restantes
              </p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums" style={{ color: "var(--text)" }}>
                {quota.remaining}
                <span className="ml-1 text-sm font-normal" style={{ color: "var(--text-muted)" }}>
                  / {quota.limit}
                </span>
              </p>
            </div>
          )}
          {!isSubscriber && (
            <div
              className="shrink-0 rounded-xl px-4 py-3 text-right"
              style={{
                backgroundColor: "var(--surface)",
                border: freeRemaining === 0 ? "1px solid var(--accent)" : "1px solid var(--border)",
                minWidth: "148px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Essai gratuit
              </p>
              <p
                className="mt-0.5 text-xl font-semibold tabular-nums"
                style={{ color: freeRemaining === 0 ? "var(--accent)" : "var(--text)" }}
              >
                {freeRemaining}
                <span className="ml-1 text-sm font-normal" style={{ color: "var(--text-muted)" }}>
                  / {FREE_LIMIT}
                </span>
              </p>
              {freeRemaining === 0 && (
                <p className="mt-0.5 text-[10px]" style={{ color: "var(--accent)" }}>
                  Quota épuisé
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 h-px w-full" style={{ backgroundColor: "var(--border)" }} />
      </div>

      {/* ── 2. Stats ──────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          {
            value: totalGenerations,
            label: "Générations",
            emoji: "✨",
          },
          {
            value: totalSaved,
            label: "Créations sauvegardées",
            emoji: "📌",
          },
          {
            value: 7,
            label: "Modules disponibles",
            emoji: "🛠️",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center rounded-[14px] px-3 py-4 text-center"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <span className="mb-1 text-xl">{stat.emoji}</span>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: "var(--text)" }}
            >
              {stat.value}
            </p>
            <p
              className="mt-0.5 text-[11px] leading-tight"
              style={{ color: "var(--text-muted)" }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── 3. Accès rapide ───────────────────────────────────────── */}
      <div className="mb-8">
        <h2
          className="mb-3 text-sm font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Accès rapide
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="card card-link flex items-center gap-4"
              style={{
                padding: "1rem 1.25rem",
                ...(action.accent
                  ? {
                      border: "1.5px solid var(--accent)",
                      boxShadow: "0 2px 12px rgba(181,122,140,0.13)",
                    }
                  : {}),
              }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: "var(--surface-alt)" }}
              >
                {action.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {action.label}
                  {action.accent && (
                    <span
                      className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "#fff",
                      }}
                    >
                      ✨ Recommandé
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {action.desc}
                </p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--accent)", flexShrink: 0 }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 4. Dernières créations sauvegardées ──────────────────── */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Dernières créations
          </h2>
          {totalSaved > 0 && (
            <Link
              href="/dashboard/library"
              className="text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--accent)" }}
            >
              Tout voir →
            </Link>
          )}
        </div>

        {recentSaved.length === 0 ? (
          <div
            className="rounded-[14px] px-5 py-8 text-center"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px dashed var(--border)",
            }}
          >
            <p className="text-2xl mb-2">📌</p>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Aucune création sauvegardée
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Génère un post ou un carrousel et clique sur &quot;Sauvegarder&quot; pour le retrouver ici.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentSaved.map((item) => {
              const href =
                MODULE_HREFS[item.module] ?? "/dashboard/library";
              const label =
                TYPE_LABELS[item.module] ?? item.module;
              const icon = TYPE_ICONS[item.module] ?? "📄";
              const dateLabel = new Date(item.created_at).toLocaleDateString(
                "fr-FR",
                { day: "numeric", month: "short" }
              );
              return (
                <Link
                  key={item.id}
                  href={href}
                  className="flex items-center gap-3 rounded-[12px] px-4 py-3 transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {label} · {dateLabel}
                    </p>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--text-muted)", flexShrink: 0 }}
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. Conseil du jour ────────────────────────────────────── */}
      <div
        className="rounded-[14px] px-5 py-5"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{ backgroundColor: "var(--surface-alt)" }}
          >
            {conseil.emoji}
          </div>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Conseil du jour
            </p>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
              {conseil.titre}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {conseil.texte}
            </p>
          </div>
        </div>
      </div>

      {/* PostHog */}
      <PostHogInstallTest />
    </div>
  );
}
