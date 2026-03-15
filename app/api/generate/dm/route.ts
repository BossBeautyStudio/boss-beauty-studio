// ============================================================
// app/api/generate/dm/route.ts
//
// POST /api/generate/dm
// Génère 3 variantes de réponse DM Instagram via Claude.
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
  QuotaExceededError,
  SubscriptionInactiveError,
} from "@/lib/quota";
import { saveGeneration } from "@/lib/db";
import { callClaudeJSON } from "@/lib/claude";
import {
  buildDMPrompt,
  type DMParams,
  type DMOutput,
} from "@/lib/prompts";
import { isMockMode, getMockDM, MOCK_TOKENS_USED } from "@/lib/mock";

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
  let params: DMParams;

  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && Number(contentLength) > 5000) {
      return NextResponse.json(
        { error: "Body trop volumineux." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { messageClient, specialite, contexte } = body;

    if (
      typeof messageClient !== "string" ||
      messageClient.trim().length === 0 ||
      typeof specialite !== "string" ||
      specialite.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: "Champs requis manquants ou vides.",
          required: ["messageClient", "specialite"],
        },
        { status: 400 }
      );
    }

    if (messageClient.length > 2000) {
      return NextResponse.json(
        { error: "Message trop long." },
        { status: 400 }
      );
    }

    params = {
      messageClient: messageClient.trim(),
      specialite: specialite.trim(),
      contexte:
        typeof contexte === "string" && contexte.trim().length > 0
          ? contexte.trim()
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

  try {
    quotaStatus = await assertQuota(userId);
  } catch (err) {
    if (err instanceof SubscriptionInactiveError) {
      return NextResponse.json(
        { error: err.message },
        { status: 403 }
      );
    }
    if (err instanceof QuotaExceededError) {
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
    }
    console.error("[dm] assertQuota unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la vérification du quota." },
      { status: 500 }
    );
  }

  // 4. Génération — mock ou Claude
  let data: DMOutput;
  let tokensUsed: number;

  if (isMockMode()) {
    // Mode test : données fictives, aucun crédit Anthropic consommé
    // Délai simulé pour que le loader UI reste visible (réaliste)
    await new Promise((r) => setTimeout(r, 800));
    data = getMockDM();
    tokensUsed = MOCK_TOKENS_USED;
  } else {
    try {
      const result = await callClaudeJSON<DMOutput>(buildDMPrompt(params));
      data = result.data;
      tokensUsed = result.tokens;
    } catch (err) {
      console.error("[dm] callClaudeJSON error:", err);
      return NextResponse.json(
        {
          error:
            "Erreur lors de la génération du contenu. Réessaie dans quelques instants.",
        },
        { status: 500 }
      );
    }
  }

  // 5. Incrément quota
  try {
    await incrementQuota(userId);
  } catch (err) {
    console.error("[dm] incrementQuota error:", err);
  }

  // 6. Sauvegarde historique — best-effort, fire-and-forget
  void saveGeneration({
    userId,
    type: "dm",
    inputs: params as unknown as Record<string, unknown>,
    output: data,
    tokensUsed,
  });

  // 7. Réponse
  return NextResponse.json({
    data,
    quota: {
      used: quotaStatus.used + 1,
      limit: quotaStatus.limit,
      remaining: Math.max(0, quotaStatus.remaining - 1),
      resetAt: quotaStatus.resetAt,
    },
  });
}
