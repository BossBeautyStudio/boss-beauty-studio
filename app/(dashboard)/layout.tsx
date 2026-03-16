// ============================================================
// app/(dashboard)/layout.tsx
//
// Layout principal du dashboard Boss Beauty Studio.
// Structure : sidebar fixe à gauche + contenu scrollable à droite.
//
// Sidebar : surface blanche, 240px, shadow latérale subtile
// Contenu : fond --bg crème chaud, max-w-3xl centré
// ============================================================

import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkQuota } from "@/lib/quota";
import { SidebarNav } from "@/components/sidebar-nav";
import { FeedbackButton } from "@/components/dashboard/FeedbackButton";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth — redirige vers /login si non connecté
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Quota — lecture silencieuse, ne bloque pas le layout si erreur
  let quota = null;
  try {
    quota = await checkQuota(user.id);
  } catch {
    // Non critique pour le layout
  }

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(circle at 20% 10%, rgba(181,122,140,0.12), transparent 35%), var(--bg)",
      }}
    >

      {/* ── Sidebar (masquée sur mobile, visible sur desktop) ── */}
      <aside
        className="hidden md:flex w-[240px] shrink-0 flex-col"
        style={{
          background: "linear-gradient(180deg, var(--surface) 0%, #FCFAF8 100%)",
          boxShadow: "1px 0 0 var(--border), 4px 0 20px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Image
            src="/logo.png"
            alt="Boss Beauty Studio"
            width={150}
            height={40}
            priority
            className="object-contain"
          />
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4">
          <SidebarNav />
        </div>

        {/* Quota + Profil */}
        <div
          className="px-4 py-5"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Quota bar */}
          {quota && (
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Générations
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {quota.used} / {quota.limit}
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: "var(--surface-alt)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (quota.used / quota.limit) * 100)}%`,
                    backgroundColor:
                      quota.used >= quota.limit
                        ? "#cc4444"
                        : quota.used >= quota.limit * 0.8
                        ? "#b87333"
                        : "var(--accent)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Email utilisateur */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <p
              className="truncate text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              {user.email}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Zone droite : header mobile + contenu principal ──── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header mobile avec hamburger (masqué sur desktop) */}
        <MobileNav userEmail={user.email ?? ""} />

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>

      {/* ── Feedback button (fixed bottom-right) ────────────── */}
      <FeedbackButton userEmail={user.email ?? ""} />

    </div>
  );
}
