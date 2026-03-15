// ============================================================
// app/api/generate/demo/route.ts
//
// POST /api/generate/demo — endpoint public (sans auth)
// Utilisé par la démo interactive de la landing page.
// Retourne TOUJOURS des données mock (aucun crédit Anthropic).
// Rate-limit naturel : délai simulé de 800 ms.
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getMockPost } from "@/lib/mock";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let typePost: string;
  let specialite: string;

  try {
    const body = await req.json();
    typePost = typeof body.typePost === "string" ? body.typePost.trim() : "attirer";
    specialite = typeof body.specialite === "string" ? body.specialite.trim() : "esthéticienne";
  } catch {
    typePost = "attirer";
    specialite = "esthéticienne";
  }

  // Délai simulé pour l'effet de génération
  await new Promise((r) => setTimeout(r, 800));

  const data = getMockPost(typePost);

  return NextResponse.json({ data });
}
