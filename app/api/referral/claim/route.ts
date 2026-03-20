// ============================================================
// app/api/referral/claim/route.ts
//
// POST /api/referral/claim
// Body : { code: string }
//
// Appelé depuis auth/callback après qu'une nouvelle utilisatrice
// s'inscrit avec un code de parrainage en cookie.
//
// Enregistre le lien referrer → referee dans la table referrals.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimReferral } from "@/lib/referral";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const { code } = body;
  if (!code || typeof code !== "string" || !/^[A-Z0-9]{6,12}$/.test(code)) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }

  try {
    await claimReferral(code, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("[api/referral/claim] POST:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
