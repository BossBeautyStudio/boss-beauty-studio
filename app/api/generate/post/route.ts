// ============================================================
// app/api/generate/post/route.ts
//
// POST /api/generate/post
// Génère un post Instagram unique selon le type demandé.
//
// Flow abonnés actifs :
//   1. Auth → 401
//   2. Validation body → 400
//   3. assertQuota → 403 si inactif ou quota épuisé
//   4. Génération (mock ou Claude)
//   5. incrementQuota
//   6. saveGeneration (fire-and-forget)
//   7. Réponse { data, quota }
//
// Flow utilisateurs sans abonnement (SubscriptionInactiveError) :
//   3b. checkFreeQuota → 402 { paywallRequired: true } si FREE_LIMIT atteint
//   4b. Génération MOCK uniquement
//   5b. incrementFreeQuota
//   7b. Réponse { data, isFree: true, freeRemaining: N }
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  assertQuota,
  checkFreeQuota,
  incrementQuota,
  incrementFreeQuota,
  QuotaExceededError,
  SubscriptionInactiveError,
  FREE_LIMIT,
} from "@/lib/quota";
import { saveGeneration } from "@/lib/db";
import { callClaudeJSON } from "@/lib/claude";
import { buildPostPrompt, type PostParams, type PostOutput } from "@/lib/prompts";
import { isMockMode, getMockPost, MOCK_TOKENS_USED } from "@/lib/mock";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Authentification
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const userId = user.id;

  // 2. Validation du body
  let params: PostParams;

  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && Number(contentLength) > 5000) {
      return NextResponse.json({ error: "Body trop volumineux." }, { status: 400 });
    }

    const body = await req.json();
    const { typePost, specialite, tonStyle, contexte } = body;

    if (
      typeof typePost !== "string" || typePost.trim().length === 0 ||
      typeof specialite !== "string" || specialite.trim().length === 0 ||
      typeof tonStyle !== "string" || tonStyle.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Champs requis manquants.", required: ["typePost", "specialite", "tonStyle"] },
        { status: 400 }
      );
    }

    params = {
      typePost: typePost.trim(),
      specialite: specialite.trim(),
      tonStyle: tonStyle.trim(),
      contexte: typeof contexte === "string" && contexte.trim().length > 0
        ? contexte.trim()
        : undefined,
    };
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  // 3. Vérification quota — abonné ou essai gratuit
  let isFreeGeneration = false;
  let freeRemainingAfter = 0;
  let quotaStatus: Awaited<ReturnType<typeof assertQuota>> | null = null;

  try {
    quotaStatus = await assertQuota(userId);
  } catch (err) {
    if (err instanceof SubscriptionInactiveError) {
      // Essai gratuit : vérifier le free quota
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
      freeRemainingAfter = freeStatus.freeRemaining - 1; // après cette génération
    } else if (err instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: err.message, quota: { used: err.used, limit: err.limit, remaining: 0 } },
        { status: 403 }
      );
    } else {
      console.error("[post] assertQuota unexpected error:", err);
      return NextResponse.json(
        { error: "Erreur lors de la vérification du quota." },
        { status: 500 }
      );
    }
  }

  // 4. Génération
  let data: PostOutput;
  let tokensUsed: number;

  if (isMockMode() || isFreeGeneration) {
    // Mode mock ou essai gratuit → données fictives, aucun crédit Anthropic
    await new Promise((r) => setTimeout(r, 600));
    data = getMockPost(params.typePost);
    tokensUsed = MOCK_TOKENS_USED;
  } else {
    try {
      const result = await callClaudeJSON<PostOutput>(buildPostPrompt(params));
      data = result.data;
      tokensUsed = result.tokens;
    } catch (err) {
      console.error("[post] callClaudeJSON error:", err);
      return NextResponse.json(
        { error: "Erreur lors de la génération. Réessaie dans quelques instants." },
        { status: 500 }
      );
    }
  }

  // 5. Incrément quota
  if (isFreeGeneration) {
    void incrementFreeQuota(userId).catch((err) =>
      console.error("[post] incrementFreeQuota error:", err)
    );
  } else {
    try {
      await incrementQuota(userId);
    } catch (err) {
      console.error("[post] incrementQuota error:", err);
    }
  }

  // 6. Sauvegarde — best-effort
  // Log de diagnostic : confirme que saveGeneration est bien atteint
  // et que le type envoyé est exactement "post" (pas "posts", pas undefined)
  console.log("[post] reaching saveGeneration — type: post, userId:", userId, "isFree:", isFreeGeneration);

  void saveGeneration({
    userId,
    type: "post",
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
      freeLimit: FREE_LIMIT,
    });
  }

  return NextResponse.json({
    data,
    isFree: false,
    quota: {
      used: quotaStatus!.used + 1,
      limit: quotaStatus!.limit,
      remaining: Math.max(0, quotaStatus!.remaining - 1),
      resetAt: quotaStatus!.resetAt,
    },
  });
}
