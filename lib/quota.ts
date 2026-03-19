// ============================================================
// lib/quota.ts — Gestion des quotas de génération
//
// Repose sur les champs de la table public.users (migration 001) :
//   quota_used          INTEGER DEFAULT 0       — générations utilisées ce mois
//   quota_monthly       INTEGER DEFAULT 30      — plafond mensuel
//   quota_reset_at      TIMESTAMPTZ             — date du prochain reset
//   subscription_status TEXT                    — 'active' | 'inactive' | 'cancelled'
//
// La ligne users est garantie à l'inscription par le trigger handle_new_user.
// Le reset mensuel (quota_used = 0, quota_reset_at + 1 mois) est géré
// séparément par /api/cron/reset-quotas. Ce fichier ne touche pas au reset.
//
// Aucune nouvelle table, aucune nouvelle fonction SQL requise.
//
// Exports :
//   MONTHLY_LIMIT               — plafond par défaut (30), utilisé aussi par le cron
//   QuotaStatus                 — type de retour des fonctions de lecture
//   QuotaExceededError          — erreur métier levée si quota atteint
//   SubscriptionInactiveError   — erreur métier levée si abonnement non actif
//   checkQuota                  — lit le quota sans lever d'erreur métier
//   assertQuota                 — vérifie abonnement + quota, lève une erreur si bloqué
//   incrementQuota              — incrémente quota_used après une génération réussie
// ============================================================

import { createServiceClient } from "./supabase/server";

// ── Constante ─────────────────────────────────────────────────────────────────

/** Plafond mensuel par défaut. Réutilisé dans le cron reset-quotas. */
export const MONTHLY_LIMIT = 30;

/** Nombre de générations gratuites autorisées sans abonnement actif. */
export const FREE_LIMIT = 2;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuotaStatus {
  allowed: boolean;  // true si l'utilisateur peut encore générer
  used: number;      // valeur de quota_used en base
  limit: number;     // valeur de quota_monthly en base
  remaining: number; // limit - used (min 0)
  resetAt: string;   // ISO string de quota_reset_at (prochain reset)
}

// ── Erreurs métier ─────────────────────────────────────────────────────────────

/**
 * Levée par assertQuota quand le plafond mensuel est atteint.
 * Les Route Handlers l'attrapent pour retourner une 403 propre avec les détails.
 */
export class QuotaExceededError extends Error {
  readonly used: number;
  readonly limit: number;

  constructor(used: number, limit: number) {
    super(`Quota dépassé : ${used}/${limit} générations utilisées ce mois-ci.`);
    this.name = "QuotaExceededError";
    this.used = used;
    this.limit = limit;
  }
}

/**
 * Levée par assertQuota quand subscription_status !== 'active'.
 * Un abonnement inactif ou annulé ne peut pas déclencher de génération.
 */
export class SubscriptionInactiveError extends Error {
  constructor() {
    super(
      "Abonnement inactif. Souscris un abonnement pour accéder aux générations."
    );
    this.name = "SubscriptionInactiveError";
  }
}

// ── checkQuota ────────────────────────────────────────────────────────────────

/**
 * Lit quota_used, quota_monthly et quota_reset_at depuis public.users.
 * Retourne le statut complet sans lever d'erreur métier.
 * Ne vérifie PAS subscription_status — utiliser assertQuota pour les Route Handlers.
 *
 * La ligne users est toujours présente (trigger handle_new_user à l'inscription).
 * @throws Error si la requête Supabase échoue.
 */
export async function checkQuota(userId: string): Promise<QuotaStatus> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("users")
    .select("quota_used, quota_monthly, quota_reset_at")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`[quota] checkQuota failed: ${error.message}`);
  }

  return buildStatus(data.quota_used, data.quota_monthly, data.quota_reset_at);
}

// ── assertQuota ───────────────────────────────────────────────────────────────

/**
 * Vérifie l'abonnement et le quota en un seul round-trip Supabase.
 *
 * Ordre des vérifications :
 *   1. subscription_status !== 'active' → SubscriptionInactiveError (403)
 *   2. quota_used >= quota_monthly      → QuotaExceededError (403)
 *
 * À appeler en début de Route Handler, avant tout appel Claude.
 *
 * @throws SubscriptionInactiveError si l'abonnement n'est pas actif.
 * @throws QuotaExceededError si quota_used >= quota_monthly.
 * @throws Error si la requête Supabase échoue.
 */
export async function assertQuota(userId: string): Promise<QuotaStatus> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("users")
    .select("quota_used, quota_monthly, quota_reset_at, subscription_status")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`[quota] assertQuota failed: ${error.message}`);
  }

  if (data.subscription_status !== "active") {
    throw new SubscriptionInactiveError();
  }

  const status = buildStatus(
    data.quota_used,
    data.quota_monthly,
    data.quota_reset_at
  );

  if (!status.allowed) {
    throw new QuotaExceededError(status.used, status.limit);
  }

  return status;
}

// ── incrementQuota ────────────────────────────────────────────────────────────

/**
 * Incrémente quota_used de +1 après une génération réussie.
 * À appeler une fois que Claude a répondu avec succès.
 *
 * Lit la valeur courante puis écrit used + 1.
 * Race condition négligeable en V1 (30 génér./mois, appel Claude de 2-5 s en amont).
 *
 * @throws Error si la lecture ou la mise à jour Supabase échoue.
 */
export async function incrementQuota(userId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data, error: readError } = await supabase
    .from("users")
    .select("quota_used")
    .eq("id", userId)
    .single();

  if (readError) {
    throw new Error(`[quota] incrementQuota read failed: ${readError.message}`);
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ quota_used: data.quota_used + 1 })
    .eq("id", userId);

  if (updateError) {
    throw new Error(
      `[quota] incrementQuota update failed: ${updateError.message}`
    );
  }
}

// ── checkFreeQuota ────────────────────────────────────────────────────────────

export interface FreeQuotaStatus {
  freeUsed: number;         // free_quota_used en base
  freeLimit: number;        // = FREE_LIMIT (2)
  freeRemaining: number;    // freeLimit - freeUsed (min 0)
  allowed: boolean;         // freeUsed < freeLimit
}

/**
 * Lit free_quota_used depuis public.users.
 * @throws Error si la requête Supabase échoue.
 */
export async function checkFreeQuota(userId: string): Promise<FreeQuotaStatus> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("users")
    .select("free_quota_used")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`[quota] checkFreeQuota failed: ${error.message}`);
  }

  const freeUsed = data.free_quota_used ?? 0;
  return {
    freeUsed,
    freeLimit: FREE_LIMIT,
    freeRemaining: Math.max(0, FREE_LIMIT - freeUsed),
    allowed: freeUsed < FREE_LIMIT,
  };
}

/**
 * Incrémente free_quota_used de +1.
 * @throws Error si la mise à jour Supabase échoue.
 */
export async function incrementFreeQuota(userId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data, error: readError } = await supabase
    .from("users")
    .select("free_quota_used")
    .eq("id", userId)
    .single();

  if (readError) {
    throw new Error(`[quota] incrementFreeQuota read failed: ${readError.message}`);
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ free_quota_used: (data.free_quota_used ?? 0) + 1 })
    .eq("id", userId);

  if (updateError) {
    throw new Error(`[quota] incrementFreeQuota update failed: ${updateError.message}`);
  }
}

// ── Helper privé ──────────────────────────────────────────────────────────────

function buildStatus(
  used: number,
  limit: number,
  resetAt: string
): QuotaStatus {
  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt,
  };
}
