"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

// ── Structure ─────────────────────────────────────────────────────────────────
// Deux types d'items : séparateur de section ou lien de navigation.

type NavSection = { section: string };
type NavLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
};
type NavItem = NavSection | NavLink;

function isSection(item: NavItem): item is NavSection {
  return "section" in item;
}

// ── Items ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  // ── Créer ────────────────────────────────────────────────────────────────
  { section: "Créer" },
  {
    label: "Post Instagram",
    href: "/dashboard/post",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    ),
  },
  {
    label: "Carrousel",
    href: "/dashboard/carousel",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="14" height="12" rx="2" />
        <path d="M22 8v8" />
        <path d="M19 10v4" />
      </svg>
    ),
  },
  {
    label: "Story & Reel",
    href: "/dashboard/story-reel",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="3" />
        <path d="M10 9.5V7m4 2.5V7M10 14.5V17m4-2.5V17" />
      </svg>
    ),
  },
  {
    label: "Accroches",
    href: "/dashboard/hooks",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    label: "Réponse DM",
    href: "/dashboard/dm",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },

  // ── Organiser ────────────────────────────────────────────────────────────
  { section: "Organiser" },
  {
    label: "Idées de la semaine",
    href: "/dashboard/planning",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    label: "Mon calendrier",
    href: "/dashboard/calendar",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <circle cx="8" cy="15" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
        <circle cx="16" cy="15" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },

  // ── Mon espace ───────────────────────────────────────────────────────────
  { section: "Mon espace" },
  {
    label: "Mes créations",
    href: "/dashboard/library",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Mon profil",
    href: "/dashboard/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

// ── Composant ─────────────────────────────────────────────────────────────────

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">

      {/* Bouton Accueil */}
      <Link
        href="/dashboard"
        className={[
          "mb-3 flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold transition-colors",
          pathname === "/dashboard"
            ? "bg-[#111111] text-white"
            : "text-[#333333] hover:bg-[#E8E3DF] hover:text-[#111111]",
        ].join(" ")}
        style={{
          border: pathname === "/dashboard" ? "none" : "1px solid var(--border)",
        }}
      >
        <span className="shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            <path d="M9 22V12h6v10" />
          </svg>
        </span>
        Accueil
      </Link>

      {/* Navigation principale */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map((item, idx) => {
          if (isSection(item)) {
            return (
              <p
                key={`section-${idx}`}
                className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#BBBBBB" }}
              >
                {item.section}
              </p>
            );
          }

          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#111111] text-white"
                  : "text-[#555555] hover:bg-[#E8E3DF] hover:text-[#111111]",
              ].join(" ")}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* Séparateur + Déconnexion */}
        <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <LogoutButton />
        </div>
      </nav>

    </div>
  );
}
