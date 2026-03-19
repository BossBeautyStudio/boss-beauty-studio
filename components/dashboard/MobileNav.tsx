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

const NAV_ITEMS = [
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
    label: "Planning",
    href: "/dashboard/planning",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
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
    label: "Réponse DM",
    href: "/dashboard/dm",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Accroches Instagram",
    href: "/dashboard/hooks",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
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
    label: "Paramètres",
    href: "/dashboard/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    label: "Historique",
    href: "/dashboard/history",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
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
              <div className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
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

            {/* Email utilisateur en bas */}
            <div
              className="px-4 py-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2.5">
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
