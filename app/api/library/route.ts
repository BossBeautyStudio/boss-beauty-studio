// ============================================================
// app/api/library/route.ts
//
// GET    /api/library        → liste les contenus sauvegardés
// POST   /api/library        → sauvegarde un contenu
// DELETE /api/library?id=… → supprime un contenu sauvegardé
//
// Toutes les routes requièrent une session active.
// La RLS Supabase garantit l'isolation par utilisateur.
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ── GET ───────────────────────────────────────────────────────────────────────
// Retourne tous les contenus sauvegardés de l'utilisatrice, du plus récent au plus ancien.

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("saved_contents")
      .select("id, module, title, content, params, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[library] GET error:", error.message);
      return NextResponse.json(
        { error: "Erreur lors de la récupération de la bibliothèque." },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    console.error("[library] GET unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la bibliothèque." },
      { status: 500 }
    );
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────
// Sauvegarde un contenu. Body attendu : { module, title, content, params? }

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let body: {
    module: string;
    title: string;
    content: Record<string, unknown>;
    params?: Record<string, unknown>;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { module: mod, title, content, params } = body;

  // Validation basique
  if (
    typeof mod !== "string" ||
    !["post", "carousel", "hooks", "dm"].includes(mod)
  ) {
    return NextResponse.json(
      { error: "Module invalide. Valeurs acceptées : post, carousel, hooks, dm." },
      { status: 400 }
    );
  }

  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json(
      { error: "Titre requis." },
      { status: 400 }
    );
  }

  if (!content || typeof content !== "object") {
    return NextResponse.json(
      { error: "Contenu requis." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("saved_contents")
      .insert({
        user_id:    user.id,
        module:     mod,
        title:      title.trim().slice(0, 200),
        content,
        params:     params ?? null,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("[library] POST insert error:", error.message);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde." },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("[library] POST unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde." },
      { status: 500 }
    );
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
// Supprime un contenu sauvegardé. Query param : ?id=<uuid>

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Paramètre id requis." }, { status: 400 });
  }

  // UUID format check (basique)
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Format d'id invalide." }, { status: 400 });
  }

  try {
    // La RLS garantit qu'on ne supprime que ses propres contenus
    const { error } = await supabase
      .from("saved_contents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[library] DELETE error:", error.message);
      return NextResponse.json(
        { error: "Erreur lors de la suppression." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[library] DELETE unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression." },
      { status: 500 }
    );
  }
}
