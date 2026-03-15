// ============================================================
// app/api/cron/reset-quotas/route.ts
//
// GET /api/cron/reset-quotas
//
// ⚠️ Vercel Cron appelle cette route en GET (pas POST).
// Source : https://vercel.com/docs/cron-jobs/manage-cron-jobs
//
// Sécurité :
//   - Authorization: Bearer <CRON_SECRET>
//   - L'appelant (Vercel Cron, cron-job.org, curl…) doit passer
//     ce header explicitement. Ne pas supposer d'injection automatique.
//   - CRON_SECRET est une variable d'environnement à définir manuellement.
//
// Exemple vercel.json :
// {
//   "crons": [{
//     "path": "/api/cron/reset-quotas",
//     "schedule": "0 2 1 * *"
//   }]
// }
//
// Exemple appel externe (cron-job.org, curl) :
//   GET https://ton-domaine.com/api/cron/reset-quotas
//   Authorization: Bearer <CRON_SECRET>
//
// Logique de reset :
//   - WHERE subscription_status = 'active'
//         AND quota_reset_at <= NOW()
//   - Pour chaque ligne :
//       quota_used     = 0
//       quota_reset_at = quota_reset_at + 1 mois
//     (avancé depuis la date de reset prévue — pas depuis NOW() —
//      pour préserver le cycle de facturation exact)
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ── Authentification ──────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/reset-quotas] CRON_SECRET non défini");
    return false;
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;

  // Format attendu : "Bearer <secret>"
  const spaceIndex = authHeader.indexOf(" ");
  if (spaceIndex === -1) return false;
  const scheme = authHeader.slice(0, spaceIndex);
  const token = authHeader.slice(spaceIndex + 1);

  if (scheme !== "Bearer" || !token) return false;

  // Comparaison en temps constant pour éviter les timing attacks
  if (secret.length !== token.length) return false;
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);
  const tokenBytes = encoder.encode(token);
  let mismatch = 0;
  for (let i = 0; i < secretBytes.length; i++) {
    mismatch |= secretBytes[i] ^ tokenBytes[i];
  }
  return mismatch === 0;
}

// ── Avancer d'un mois (préserve le jour exact) ────────────────
// Ex : 2025-01-31 → 2025-02-28 (dernier jour de fév, pas dépassement)
// Ex : 2025-01-15 → 2025-02-15

function addOneMonth(isoDate: string): string {
  const d = new Date(isoDate);
  const expectedMonth = (d.getUTCMonth() + 1) % 12;
  d.setUTCMonth(d.getUTCMonth() + 1);

  // Si le mois a débordé (ex : 31 jan → 3 mars), reculer au dernier jour du mois cible
  if (d.getUTCMonth() !== expectedMonth) {
    d.setUTCDate(0); // dernier jour du mois précédent (= mois cible)
  }

  return d.toISOString();
}

// ── Handler GET ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // 1. Authentification
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // 2. Récupérer les comptes actifs dont le reset est dû
  const { data: usersToReset, error: selectError } = await supabase
    .from("users")
    .select("id, quota_reset_at, quota_used")
    .eq("subscription_status", "active")
    .lte("quota_reset_at", now);

  if (selectError) {
    console.error("[cron/reset-quotas] Erreur select:", selectError.message);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des comptes." },
      { status: 500 }
    );
  }

  if (!usersToReset || usersToReset.length === 0) {
    console.log("[cron/reset-quotas] Aucun compte à réinitialiser.");
    return NextResponse.json({ reset: 0, errors: 0, total: 0, runAt: now });
  }

  console.log(`[cron/reset-quotas] ${usersToReset.length} compte(s) à réinitialiser.`);

  // 3. Réinitialiser chaque compte
  let successCount = 0;
  let errorCount = 0;

  for (const user of usersToReset) {
    const nextResetAt = addOneMonth(user.quota_reset_at as string);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        quota_used: 0,
        quota_reset_at: nextResetAt,
      })
      .eq("id", user.id)
      // Garde : ne toucher que les comptes encore actifs au moment de l'UPDATE
      // (protection contre une annulation survenue entre le SELECT et l'UPDATE)
      .eq("subscription_status", "active");

    if (updateError) {
      console.error(
        `[cron/reset-quotas] Erreur reset id=${user.id}:`,
        updateError.message
      );
      errorCount++;
    } else {
      console.log(
        `[cron/reset-quotas] ✅ Reset — id=${user.id} ` +
        `quota_used: ${user.quota_used as number}→0 ` +
        `quota_reset_at: ${user.quota_reset_at as string}→${nextResetAt}`
      );
      successCount++;
    }
  }

  const summary = {
    reset: successCount,
    errors: errorCount,
    total: usersToReset.length,
    runAt: now,
  };

  console.log("[cron/reset-quotas] Terminé :", summary);

  // Retourner 500 si toutes les mises à jour ont échoué
  if (errorCount > 0 && successCount === 0) {
    return NextResponse.json(
      { error: "Toutes les mises à jour ont échoué.", ...summary },
      { status: 500 }
    );
  }

  return NextResponse.json(summary);
}
