// ============================================================
// app/api/referral/route.ts
//
// GET /api/referral
//   → Retourne le code de parrainage et les stats de l'utilisatrice
//   → Crée le code si inexistant
//
// Sécurité : auth Supabase requise
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReferralStats } from "@/lib/referral";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }

  try {
    const stats = await getReferralStats(user.id);
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("[api/referral] GET:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
