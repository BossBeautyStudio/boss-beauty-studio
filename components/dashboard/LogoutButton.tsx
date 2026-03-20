"use client";

// ============================================================
// components/dashboard/LogoutButton.tsx
//
// Bouton de déconnexion — appelle supabase.auth.signOut()
// puis redirige vers /login.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-colors"
      style={{
        color: loading ? "#BBBBBB" : "#CC4444",
        background: "transparent",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFF0F0";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
      }}
    >
      {/* Icône logout */}
      <span className="shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </span>
      {loading ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
