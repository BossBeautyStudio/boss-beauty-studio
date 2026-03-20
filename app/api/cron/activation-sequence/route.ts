// ============================================================
// app/api/cron/activation-sequence/route.ts
//
// GET /api/cron/activation-sequence
//
// Exécuté chaque jour à 9h00 via Vercel Cron.
// Envoie la séquence email d'activation aux utilisatrices
// non abonnées selon l'ancienneté de leur compte :
//
//   Step 1 — J+1  : "Voici ce que tu peux créer"  (découverte)
//   Step 2 — J+3  : "Elles publient, pas toi"       (social proof)
//   Step 3 — J+7  : "29€/mois — une seule cliente rembourse tout" (conversion)
//
// Sécurité : Authorization: Bearer <CRON_SECRET>
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  sendEmail,
  buildActivationEmail1,
  buildActivationEmail2,
  buildActivationEmail3,
} from "@/lib/email";

export const dynamic = "force-dynamic";

// ── Auth ──────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  if (!token || token.length !== secret.length) return false;
  const enc = new TextEncoder();
  const a = enc.encode(secret);
  const b = enc.encode(token);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ── Seuils en heures ─────────────────────────────────────────

const STEPS: Array<{ step: 1 | 2 | 3; minHours: number; maxHours: number }> = [
  { step: 1, minHours: 20,  maxHours: 48  }, // J+1 : entre 20h et 48h après inscription
  { step: 2, minHours: 68,  maxHours: 96  }, // J+3 : entre 68h et 96h
  { step: 3, minHours: 164, maxHours: 192 }, // J+7 : entre 164h et 192h
];

// ── Handler ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const supabase = createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://bossbeautystudio.site";
  const now = new Date();

  let totalSent = 0;
  let totalSkipped = 0;

  // ── Pour chaque step de la séquence ──────────────────────

  for (const { step, minHours, maxHours } of STEPS) {
    const minDate = new Date(now.getTime() - maxHours * 3_600_000).toISOString();
    const maxDate = new Date(now.getTime() - minHours * 3_600_000).toISOString();

    // 1. Trouver les utilisatrices inscrites dans la fenêtre de temps
    //    et qui ne sont pas encore abonnées
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("id, email, created_at")
      .neq("subscription_status", "active")
      .gte("created_at", minDate)
      .lte("created_at", maxDate);

    if (usersErr) {
      console.error(`[activation-seq] Step ${step} — erreur lecture users:`, usersErr.message);
      continue;
    }
    if (!users || users.length === 0) {
      console.log(`[activation-seq] Step ${step} — aucune utilisatrice dans la fenêtre.`);
      continue;
    }

    const userIds = users.map((u: { id: string }) => u.id);

    // 2. Exclure celles qui ont déjà reçu cet email
    const { data: alreadySent } = await supabase
      .from("activation_emails_sent")
      .select("user_id")
      .eq("step", step)
      .in("user_id", userIds);

    const sentIds = new Set((alreadySent ?? []).map((r: { user_id: string }) => r.user_id));
    const toSend = users.filter((u: { id: string }) => !sentIds.has(u.id));

    if (toSend.length === 0) {
      console.log(`[activation-seq] Step ${step} — déjà envoyé à toutes.`);
      continue;
    }

    // 3. Récupérer les spécialités (step 1 uniquement — personnalisation)
    let specialiteById: Map<string, string | null> = new Map();
    if (step === 1) {
      const { data: profiles } = await supabase
        .from("brand_profiles")
        .select("user_id, specialite")
        .in("user_id", toSend.map((u: { id: string }) => u.id));
      for (const p of profiles ?? []) {
        specialiteById.set(
          (p as { user_id: string; specialite: string | null }).user_id,
          (p as { user_id: string; specialite: string | null }).specialite,
        );
      }
    }

    // 4. Envoyer les emails
    for (const user of toSend) {
      const email = user.email as string;
      if (!email) { totalSkipped++; continue; }

      let subject: string;
      let html: string;

      if (step === 1) {
        const spec = specialiteById.get(user.id as string);
        subject = "✨ Voici ce que tu peux créer en 10 secondes";
        html = buildActivationEmail1(appUrl, spec);
      } else if (step === 2) {
        subject = "📱 Pendant ce temps, elles publient...";
        html = buildActivationEmail2(appUrl);
      } else {
        subject = "🌸 Une seule cliente rembourse tout";
        html = buildActivationEmail3(appUrl);
      }

      const ok = await sendEmail({ to: email, subject, html });

      if (ok) {
        // 5. Marquer comme envoyé (upsert pour éviter les doublons en cas de retry)
        await supabase
          .from("activation_emails_sent")
          .upsert({ user_id: user.id, step }, { onConflict: "user_id,step" });

        console.log(`[activation-seq] ✅ Step ${step} envoyé à ${email}`);
        totalSent++;
      } else {
        console.error(`[activation-seq] ❌ Step ${step} échec pour ${email}`);
        totalSkipped++;
      }
    }
  }

  const summary = { sent: totalSent, skipped: totalSkipped, runAt: now.toISOString() };
  console.log("[activation-seq] Terminé :", summary);
  return NextResponse.json(summary);
}
