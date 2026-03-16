// ============================================================
// app/api/generate/planning/route.ts
//
// POST /api/generate/planning
// Génère un planning de contenu Instagram 30 jours via Claude.
//
// Flow :
//   1. Authentification     — 401 si absent
//   2. Validation du body   — 400 si champs requis manquants, vides ou invalides
//   3. assertQuota          — 403 SubscriptionInactiveError si abonnement inactif
//                          — 403 QuotaExceededError si plafond atteint
//   4. Génération           — données mock si MOCK_GENERATION=true, sinon Claude
//   5. incrementQuota       — incrémente quota_used après succès
//   6. saveGeneration       — best-effort, fire-and-forget (void)
//   7. Réponse JSON         — { data, quota }
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  assertQuota,
  incrementQuota,
  checkFreeQuota,
  incrementFreeQuota,
  QuotaExceededError,
  SubscriptionInactiveError,
  FREE_LIMIT,
} from "@/lib/quota";
import { saveGeneration } from "@/lib/db";
import { callClaudeJSON } from "@/lib/claude";
import {
  buildPlanningPrompt,
  type PlanningParams,
  type PlanningOutput,
} from "@/lib/prompts";
import { isMockMode, getMockPlanning, MOCK_TOKENS_USED } from "@/lib/mock";

export const dynamic = "force-dynamic";

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

  const userId = user.id;

  // 2. Validation du body
  let params: PlanningParams;

  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && Number(contentLength) > 5000) {
      return NextResponse.json(
        { error: "Body trop volumineux." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { specialite, objectif, tonStyle, dateDebut, ville } = body;

    if (
      typeof specialite !== "string" ||
      specialite.trim().length === 0 ||
      typeof objectif !== "string" ||
      objectif.trim().length === 0 ||
      typeof tonStyle !== "string" ||
      tonStyle.trim().length === 0 ||
      typeof dateDebut !== "string" ||
      dateDebut.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: "Champs requis manquants ou vides.",
          required: ["specialite", "objectif", "tonStyle", "dateDebut"],
        },
        { status: 400 }
      );
    }

    params = {
      specialite: specialite.trim(),
      objectif: objectif.trim(),
      tonStyle: tonStyle.trim(),
      dateDebut: dateDebut.trim(),
      ville:
        typeof ville === "string" && ville.trim().length > 0
          ? ville.trim()
          : undefined,
    };
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide." },
      { status: 400 }
    );
  }

  // 3. Vérification abonnement + quota
  let quotaStatus;
  let isFreeGeneration = false;
  let freeRemainingAfter = 0;

  try {
    quotaStatus = await assertQuota(userId);
  } catch (err) {
    if (err instanceof SubscriptionInactiveError) {
      // Vérifier le quota gratuit
      let freeStatus;
      try {
        freeStatus = await checkFreeQuota(userId);
      } catch {
        return NextResponse.json(
          { error: "Erreur lors de la vérification du quota gratuit." },
          { status: 500 }
        );
      }
      if (!freeStatus.allowed) {
        return NextResponse.json(
          {
            error: "Tu as utilisé tes 3 générations gratuites.",
            paywallRequired: true,
            freeLimit: FREE_LIMIT,
          },
          { status: 402 }
        );
      }
      isFreeGeneration = true;
      freeRemainingAfter = freeStatus.freeRemaining - 1;
    } else if (err instanceof QuotaExceededError) {
      return NextResponse.json(
        {
          error: err.message,
          quota: {
            used: err.used,
            limit: err.limit,
            remaining: 0,
          },
        },
        { status: 403 }
      );
    } else {
      console.error("[planning] assertQuota unexpected error:", err);
      return NextResponse.json(
        { error: "Erreur lors de la vérification du quota." },
        { status: 500 }
      );
    }
  }

  // 4. Génération — mock ou Claude (toujours mock pour les générations gratuites)
  let data: PlanningOutput;
  let tokensUsed: number;

  if (isMockMode() || isFreeGeneration) {
    // Mode test ou génération gratuite : données fictives, aucun crédit Anthropic consommé
    await new Promise((r) => setTimeout(r, 800));
    data = getMockPlanning();
    tokensUsed = MOCK_TOKENS_USED;
  } else {
    try {
      const result = await callClaudeJSON<PlanningOutput>(
        buildPlanningPrompt(params)
      );
      data = result.data;
      tokensUsed = result.tokens;
    } catch (err) {
      console.error("[planning] callClaudeJSON error:", err);
      return NextResponse.json(
        {
          error:
            "Erreur lors de la génération du contenu. Réessaie dans quelques instants.",
        },
        { status: 500 }
      );
    }
  }

  // 5. Incrément quota (abonné) ou quota gratuit
  if (isFreeGeneration) {
    try {
      await incrementFreeQuota(userId);
    } catch (err) {
      console.error("[planning] incrementFreeQuota error:", err);
    }
  } else if (quotaStatus) {
    try {
      await incrementQuota(userId);
    } catch (err) {
      console.error("[planning] incrementQuota error:", err);
    }
  }

  // 6. Sauvegarde historique — best-effort, fire-and-forget
  void saveGeneration({
    userId,
    type: "planning",
    inputs: params as unknown as Record<string, unknown>,
    output: data,
    tokensUsed,
  });

  // 7. Réponse
  if (isFreeGeneration) {
    return NextResponse.json({
      data,
      isFree: true,
      freeRemaining: Math.max(0, freeRemainingAfter),
    });
  }

  return NextResponse.json({
    data,
    quota: {
      used: quotaStatus!.used + 1,
      limit: quotaStatus!.limit,
      remaining: Math.max(0, quotaStatus!.remaining - 1),
      resetAt: quotaStatus!.resetAt,
    },
  });
}
