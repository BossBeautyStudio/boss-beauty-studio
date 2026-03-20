// ============================================================
// app/api/calendar/route.ts
//
// GET    ?year=2026&month=3  → entrées du mois pour l'utilisatrice
// POST   { date, title, module, status?, note? } → crée une entrée
// PATCH  ?id=uuid  body { status?, title?, date?, note? } → met à jour
// DELETE ?id=uuid → supprime
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  // Calculer les bornes du mois (YYYY-MM-01 → YYYY-MM-last)
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to   = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("calendar_entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: {
    date: string;
    title: string;
    module: string;
    status?: string;
    note?: string;
    saved_content_id?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  if (!body.date || !body.title || !body.module) {
    return NextResponse.json({ error: "date, title et module sont requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("calendar_entries")
    .insert({
      user_id:          user.id,
      date:             body.date,
      title:            body.title,
      module:           body.module,
      status:           body.status ?? "idee",
      note:             body.note ?? null,
      saved_content_id: body.saved_content_id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  let body: Partial<{
    status: string;
    title: string;
    date: string;
    note: string;
  }>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("calendar_entries")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id) // RLS + double check
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const { error } = await supabase
    .from("calendar_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
