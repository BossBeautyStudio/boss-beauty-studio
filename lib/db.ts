// ============================================================
// lib/db.ts — Persistance des générations
//
// Repose sur la table public.generations (migration 003) :
//   user_id      UUID    — référence public.users
//   type         TEXT    — 'planning' | 'carousel' | 'dm'
//   inputs       JSONB   — paramètres du formulaire envoyés à Claude
//   output       JSONB   — réponse structurée de Claude
//   tokens_used  INTEGER — total input + output tokens
//   created_at   TIMESTAMPTZ DEFAULT NOW()
//
// saveGeneration est best-effort : si l'écriture échoue, l'erreur
// est loggée mais jamais propagée. La génération utilisateur
// reste valide même si l'historique n'est pas enregistré.
//
// Exports :
//   GenerationType    — union type des 3 modules
//   SaveGenerationParams — type des paramètres de saveGeneration
//   saveGeneration    — insère une ligne dans generations (best-effort)
// ============================================================

import { createServiceClient } from "./supabase/server";

// ── Types ─────────────────────────────────────────────────────────────────────

export type GenerationType = "planning" | "carousel" | "dm" | "hooks";

export interface SaveGenerationParams {
  userId: string;
  type: GenerationType;
  inputs: Record<string, unknown>;  // paramètres du formulaire (PlanningParams, etc.)
  output: unknown;                  // output structuré de Claude (PlanningOutput, CarouselOutput, DMOutput)
  tokensUsed: number;
}

// ── saveGeneration ────────────────────────────────────────────────────────────

/**
 * Insère une génération dans public.generations.
 *
 * Best-effort : les erreurs Supabase sont loggées mais jamais levées.
 * À appeler après incrementQuota, sans await bloquant si désiré.
 *
 * @example
 * // Dans un Route Handler, après incrementQuota :
 * void saveGeneration({ userId, type: "planning", inputs, output, tokensUsed });
 */
export async function saveGeneration(
  params: SaveGenerationParams
): Promise<void> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase.from("generations").insert({
      user_id:     params.userId,
      type:        params.type,
      inputs:      params.inputs,
      output:      params.output,
      tokens_used: params.tokensUsed,
      created_at:  new Date().toISOString(),
    });

    if (error) {
      console.error("[db] saveGeneration failed:", error.message);
    }
  } catch (err) {
    console.error("[db] saveGeneration unexpected error:", err);
  }
}
