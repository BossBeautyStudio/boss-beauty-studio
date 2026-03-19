// ============================================================
// app/api/user/quota/route.ts
//
// GET /api/user/quota
// Retourne l'état du quota de génération de l'utilisateur connecté.
//
// Flow :
//   1. Authentification — 401 si absent
//   2. Lecture subscription_status, quota_used, quota_monthly,
//      quota_reset_at, free_quota_used depuis public.users
//   3. Réponse JSON :
//      - Abonné actif  → { isSubscriber: true, quota }
//      - Non-abonné    → { isSubscriber: false, freeRemaining, freeLimit }
// ============================================================

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { FREE_LIMIT, MONTHLY_LIMIT } from "@/lib/quota";

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

  // 2. Lecture des données utilisateur
  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from("users")
      .select("subscription_status, quota_used, quota_monthly, quota_reset_at, free_quota_used")
      .eq("id", user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const isSubscriber = data.subscription_status === "active";

    if (isSubscriber) {
      const used = data.quota_used ?? 0;
      const limit = data.quota_monthly ?? MONTHLY_LIMIT;
      return NextResponse.json({
        isSubscriber: true,
        quota: {
          allowed: used < limit,
          used,
          limit,
          remaining: Math.max(0, limit - used),
          resetAt: data.quota_reset_at,
        },
      });
    } else {
      const freeUsed = data.free_quota_used ?? 0;
      return NextResponse.json({
        isSubscriber: false,
        freeUsed,
        freeLimit: FREE_LIMIT,
        freeRemaining: Math.max(0, FREE_LIMIT - freeUsed),
      });
    }
  } catch (err) {
    console.error("[user/quota] error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du quota." },
      { status: 500 }
    );
  }
}
