// ============================================================
// app/api/cron/send-reminders/route.ts
//
// GET /api/cron/send-reminders
//
// Exécuté chaque jour à 8h00 (Europe/Paris) via Vercel Cron.
// Cherche toutes les entrées calendrier au statut "planifie"
// dont la date = DEMAIN, et envoie un email de rappel à
// l'utilisatrice si elle a activé les rappels dans son profil.
//
// Sécurité : Authorization: Bearer <CRON_SECRET>
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, buildReminderEmail, type ReminderEntry } from "@/lib/email";

export const dynamic = "force-dynamic";

// ── Auth ──────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token || token.length !== secret.length) return false;

  const enc = new TextEncoder();
  const a = enc.encode(secret);
  const b = enc.encode(token);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ── Date demain en YYYY-MM-DD (UTC) ───────────────────────────

function tomorrowISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function tomorrowLabel(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });
}

// ── Handler ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const supabase = createServiceClient();
  const tomorrow = tomorrowISO();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://bossbeautystudio.site";

  // 1. Récupérer toutes les entrées planifiées pour demain
  const { data: entries, error: entriesError } = await supabase
    .from("calendar_entries")
    .select("user_id, title, module, note")
    .eq("date", tomorrow)
    .eq("status", "planifie");

  if (entriesError) {
    console.error("[send-reminders] Erreur lecture calendar_entries:", entriesError.message);
    return NextResponse.json({ error: entriesError.message }, { status: 500 });
  }

  if (!entries || entries.length === 0) {
    console.log("[send-reminders] Aucune entrée planifiée pour demain.");
    return NextResponse.json({ sent: 0, skipped: 0, total: 0, date: tomorrow });
  }

  // 2. Grouper les entrées par user_id
  const byUser = new Map<string, ReminderEntry[]>();
  for (const entry of entries) {
    const uid = entry.user_id as string;
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid)!.push({
      title:  entry.title  as string,
      module: entry.module as string,
      note:   entry.note   as string | null,
    });
  }

  const userIds = [...byUser.keys()];

  // 3. Récupérer les profils de marque (reminders_enabled)
  const { data: profiles } = await supabase
    .from("brand_profiles")
    .select("user_id, reminders_enabled")
    .in("user_id", userIds);

  const reminderEnabled = new Map<string, boolean>();
  for (const p of profiles ?? []) {
    reminderEnabled.set(p.user_id as string, (p.reminders_enabled as boolean) !== false);
  }

  // 4. Récupérer les emails via auth.users (service client uniquement)
  const { data: authUsers } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  const emailByUserId = new Map<string, string>();
  for (const u of authUsers?.users ?? []) {
    if (u.email) emailByUserId.set(u.id, u.email);
  }

  // 5. Envoyer un email par utilisatrice
  let sent = 0;
  let skipped = 0;

  const label = tomorrowLabel();

  for (const [userId, userEntries] of byUser) {
    // Rappels désactivés ?
    const enabled = reminderEnabled.get(userId) !== false; // défaut true si pas de profil
    if (!enabled) {
      console.log(`[send-reminders] rappels désactivés pour user=${userId}`);
      skipped++;
      continue;
    }

    const email = emailByUserId.get(userId);
    if (!email) {
      console.warn(`[send-reminders] email introuvable pour user=${userId}`);
      skipped++;
      continue;
    }

    const calendarUrl = `${appUrl}/dashboard/calendar`;
    const html = buildReminderEmail(userEntries, label, calendarUrl);

    const ok = await sendEmail({
      to:      email,
      subject: `📅 Rappel — tu publies demain (${label})`,
      html,
    });

    if (ok) {
      console.log(`[send-reminders] ✅ email envoyé à ${email} (${userEntries.length} entrée(s))`);
      sent++;
    } else {
      console.error(`[send-reminders] ❌ échec envoi à ${email}`);
      skipped++;
    }
  }

  const summary = { sent, skipped, total: byUser.size, date: tomorrow };
  console.log("[send-reminders] Terminé :", summary);
  return NextResponse.json(summary);
}
