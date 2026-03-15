// ============================================================
// app/api/user/quota/route.ts
//
// GET /api/user/quota
// Retourne l'état du quota de génération de l'utilisateur connecté.
//
// Flow :
//   1. Authentification — 401 si absent
//   2. checkQuota(userId) — lit quota_used, quota_monthly, quota_reset_at
//   3. Réponse JSON — { quota }
// ============================================================

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { checkQuota } from "@/lib/quota";

export const dynamic = "force-dynamic";

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET() {
  // 1. Authentification
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Non authentifié." },
      { status: 401 }
    );
  }

  // 2. Lecture quota
  try {
    const quota = await checkQuota(user.id);

    return NextResponse.json({ quota });
  } catch (err) {
    console.error("[user/quota] checkQuota error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du quota." },
      { status: 500 }
    );
  }
}
