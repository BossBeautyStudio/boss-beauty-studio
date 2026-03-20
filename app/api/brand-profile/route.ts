// ============================================================
// app/api/brand-profile/route.ts
//
// GET  → retourne le profil de marque de l'utilisatrice connectée
// POST → crée ou met à jour le profil (upsert sur user_id)
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: {
    nom_marque?: string;
    specialite?: string;
    ton_style?: string;
    public_cible?: string;
    hashtags_favoris?: string;
    instagram_handle?: string;
    ville?: string;
    services?: string;
    prix_moyen?: string;
    reminders_enabled?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("brand_profiles")
    .upsert(
      {
        user_id:            user.id,
        nom_marque:         body.nom_marque         ?? null,
        specialite:         body.specialite         ?? null,
        ton_style:          body.ton_style          ?? null,
        public_cible:       body.public_cible       ?? null,
        hashtags_favoris:   body.hashtags_favoris   ?? null,
        instagram_handle:   body.instagram_handle   ?? null,
        ville:              body.ville              ?? null,
        services:           body.services           ?? null,
        prix_moyen:         body.prix_moyen         ?? null,
        ...(body.reminders_enabled !== undefined && {
          reminders_enabled: body.reminders_enabled,
        }),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
