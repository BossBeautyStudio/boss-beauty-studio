// ============================================================
// app/api/generate/story-reel/route.ts
//
// POST /api/generate/story-reel
// Génère une séquence de Stories OU un script Reel Instagram.
//
// Body : { mode: "story"|"reel", specialite, sujet, tonStyle }
//
// Flow identique aux autres modules :
//   1. Auth → 401
//   2. Validation body → 400
//   3. assertQuota → 402/403
//   4. Génération (mock ou Claude)
//   5. incrementQuota
//   6. saveGeneration (fire-and-forget)
//   7. Réponse { data, ... }
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
import {
  buildStoryReelPrompt,
  type StoryReelParams,
  type StoryReelOutput,
} from "@/lib/prompts";
import { isMockMode, getMockStory, getMockReel, MOCK_TOKENS_USED } from "@/lib/mock";

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
  let params: StoryReelParams;

  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && Number(contentLength) > 5000) {
      return NextResponse.json({ error: "Body trop volumineux." }, { status: 400 });
    }

    const body = await req.json();
    const { mode, specialite, sujet, tonStyle } = body;

    if (
      (mode !== "story" && mode !== "reel") ||
      typeof specialite !== "string" || specialite.trim().length === 0 ||
      typeof sujet !== "string" || sujet.trim().length === 0 ||
      typeof tonStyle !== "string" || tonStyle.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: "Champs requis manquants.",
          required: ["mode (story|reel)", "specialite", "sujet", "tonStyle"],
        },
        { status: 400 }
      );
    }

    params = {
      mode,
      specialite: specialite.trim(),
      sujet: sujet.trim(),
      tonStyle: tonStyle.trim(),
    };
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  // 3. Vérification quota
  let isFreeGeneration = false;
  let freeRemainingAfter = 0;
  let quotaStatus: Awaited<ReturnType<typeof assertQuota>> | null = null;

  try {
    quotaStatus = await assertQuota(userId);
  } catch (err) {
    if (err instanceof SubscriptionInactiveError) {
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
            error: "Tu as utilisé tes 2 générations gratuites.",
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
        { error: err.message, quota: { used: err.used, limit: err.limit, remaining: 0 } },
        { status: 403 }
      );
    } else {
      console.error("[story-reel] assertQuota unexpected error:", err);
      return NextResponse.json(
        { error: "Erreur lors de la vérification du quota." },
        { status: 500 }
      );
    }
  }

  // 4. Génération
  let data: StoryReelOutput;
  let tokensUsed: number;

  if (isMockMode() || isFreeGeneration) {
    await new Promise((r) => setTimeout(r, 600));
    data = params.mode === "story" ? getMockStory() : getMockReel();
    tokensUsed = MOCK_TOKENS_USED;
  } else {
    try {
      const result = await callClaudeJSON<StoryReelOutput>(buildStoryReelPrompt(params));
      data = result.data;
      tokensUsed = result.tokens;
    } catch (err) {
      console.error("[story-reel] callClaudeJSON error:", err);
      return NextResponse.json(
        { error: "Erreur lors de la génération. Réessaie dans quelques instants." },
        { status: 500 }
      );
    }
  }

  // 5. Incrément quota
  if (isFreeGeneration) {
    void incrementFreeQuota(userId).catch((err) =>
      console.error("[story-reel] incrementFreeQuota error:", err)
    );
  } else {
    try {
      await incrementQuota(userId);
    } catch (err) {
      console.error("[story-reel] incrementQuota error:", err);
    }
  }

  // 6. Sauvegarde — best-effort
  void saveGeneration({
    userId,
    type: params.mode === "story" ? "story" : "reel",
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
