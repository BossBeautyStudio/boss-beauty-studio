// ============================================================
// app/api/generations/route.ts
//
// GET /api/generations
// Retourne les 20 dernières générations de l'utilisateur connecté.
//
// Utilise createClient (cookie auth + anon key) : la RLS
// generations_select_own filtre automatiquement par auth.uid().
// Pas besoin du service client ici.
//
// Flow :
//   1. Authentification — 401 si absent
//   2. Requête Supabase — 20 dernières générations, ordre DESC
//   3. Réponse JSON — { generations }
// ============================================================

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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

  // 2. Récupération des générations
  // RLS generations_select_own garantit que seules les lignes
  // où user_id = auth.uid() sont retournées — pas de filtre .eq() nécessaire.
  try {
    const { data: generations, error } = await supabase
      .from("generations")
      .select("id, type, inputs, output, tokens_used, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[generations] query error:", error.message);
      return NextResponse.json(
        { error: "Erreur lors de la récupération de l'historique." },
        { status: 500 }
      );
    }

    return NextResponse.json({ generations });
  } catch (err) {
    console.error("[generations] unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique." },
      { status: 500 }
    );
  }
}
