"use client";

// ============================================================
// components/dashboard/MobileNav.tsx
//
// Navigation mobile du dashboard.
// Visible UNIQUEMENT sous 768px (md:hidden / block md:hidden).
//
// Contenu :
//   — Barre de header fixe avec logo + bouton hamburger
//   — Drawer slide-in depuis la gauche avec :
//       · Logo
//       · Items de navigation (fermeture auto au clic)
//       · Email utilisateur en bas
//   — Overlay semi-transparent pour fermer en cliquant dehors
//
// Desktop inchangé : ce composant est rendu display:none au-dessus
// de 768px grâce aux classes Tailwind md:hidden sur chaque élément.
// ============================================================

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

// ── Structure ─────────────────────────────────────────────────────────────────

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
  {
    label: "Parrainage",
    href: "/dashboard/parrainage",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

interface MobileNavProps {
  userEmail: string;
}

export function MobileNav({ userEmail }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Fermer le drawer à chaque changement de route
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Bloquer le scroll du body quand le drawer est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* ── Barre de header mobile (masquée sur desktop) ──────── */}
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 shrink-0"
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        {/* Logo */}
        <Link href="/dashboard">
          <Image
            src="/logo.png"
            alt="Boss Beauty Studio"
            width={120}
            height={32}
            priority
            className="object-contain"
          />
        </Link>

        {/* Bouton hamburger */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
          style={{
            backgroundColor: "var(--surface-alt)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          aria-label="Ouvrir le menu"
          aria-expanded={isOpen}
        >
          {/* Hamburger icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* ── Drawer + overlay (masqués sur desktop) ────────────── */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay semi-transparent */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panneau de navigation */}
          <div
            className="relative flex w-72 max-w-[85vw] flex-col"
            style={{
              background: "linear-gradient(180deg, var(--surface) 0%, #FCFAF8 100%)",
              boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
            }}
          >
            {/* En-tête du drawer */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <Image
                src="/logo.png"
                alt="Boss Beauty Studio"
                width={130}
                height={35}
                className="object-contain"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                style={{
                  backgroundColor: "var(--surface-alt)",
                  color: "var(--text-muted)",
                }}
                aria-label="Fermer le menu"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Items de navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {/* Bouton Accueil */}
              <Link
                href="/dashboard"
                className={[
                  "mb-3 flex items-center gap-3 rounded-[12px] px-3 py-3 text-sm font-semibold transition-colors",
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

              <div className="flex flex-col gap-0.5">
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

                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "flex items-center gap-3 rounded-[12px] px-3 py-3 text-sm font-medium transition-colors",
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
              </div>
            </nav>

            {/* Pied du drawer : email + déconnexion */}
            <div
              className="px-4 py-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {/* Email */}
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {userEmail?.[0]?.toUpperCase() ?? "?"}
                </div>
                <p
                  className="truncate text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  {userEmail}
                </p>
              </div>
              {/* Déconnexion */}
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
