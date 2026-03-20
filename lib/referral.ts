// ============================================================
// lib/referral.ts
//
// Helpers programme de parrainage Boss Beauty Studio
//
// Flux complet :
//   1. Utilisatrice connectée → getOrCreateReferralCode(userId)
//      → génère un code unique et l'insère dans `referrals`
//   2. Nouvelle utilisatrice clique /login?ref=CODE
//      → stocké en cookie côté client (voir auth/callback)
//   3. Après inscription → claimReferral(code, newUserId)
//      → met à jour referee_id + status = 'registered'
//   4. Stripe webhook checkout.session.completed
//      → convertReferral(refereeId)
//      → status = 'converted' + referral_credit_months += 1
// ============================================================

import { createServiceClient } from "@/lib/supabase/server";

// ── Génération de code ─────────────────────────────────────────────────────────
// Code alphanumérique 8 caractères, majuscules + chiffres
// Suffisamment court pour être partageable, assez unique pour éviter collisions

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I pour éviter confusion
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── getOrCreateReferralCode ────────────────────────────────────────────────────
// Retourne le code existant ou en crée un nouveau.
// Appelé par GET /api/referral pour afficher le lien dans le dashboard.

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const supabase = createServiceClient();

  // Chercher un code existant
  const { data: existing } = await supabase
    .from("referrals")
    .select("code")
    .eq("referrer_id", userId)
    .maybeSingle();

  if (existing?.code) return existing.code;

  // Générer un code unique (retry si collision)
  let code = generateCode();
  let attempts = 0;

  while (attempts < 5) {
    const { error } = await supabase.from("referrals").insert({
      referrer_id: userId,
      code,
      status: "pending",
    });

    if (!error) return code;

    // Collision UNIQUE(code) → réessayer avec un nouveau code
    if (error.code === "23505") {
      code = generateCode();
      attempts++;
    } else {
      throw new Error(`[referral] Création code: ${error.message}`);
    }
  }

  throw new Error("[referral] Impossible de générer un code unique après 5 tentatives");
}

// ── claimReferral ──────────────────────────────────────────────────────────────
// Appelé dans auth/callback après qu'une nouvelle utilisatrice s'inscrit
// avec un code ?ref= dans les cookies.
// Met à jour le referral existant avec le referee_id et passe en 'registered'.

export async function claimReferral(
  code: string,
  refereeId: string
): Promise<void> {
  const supabase = createServiceClient();

  // Vérifier que le code existe et est en 'pending'
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("code", code)
    .maybeSingle();

  if (!referral) {
    console.warn(`[referral] Code introuvable: ${code}`);
    return;
  }

  // Empêcher l'auto-parrainage
  if (referral.referrer_id === refereeId) {
    console.warn(`[referral] Auto-parrainage détecté — ignoré`);
    return;
  }

  // Déjà utilisé
  if (referral.status !== "pending") {
    console.warn(`[referral] Code ${code} déjà utilisé (status=${referral.status})`);
    return;
  }

  const { error } = await supabase
    .from("referrals")
    .update({
      referee_id: refereeId,
      status: "registered",
    })
    .eq("id", referral.id);

  if (error) {
    console.error(`[referral] claimReferral update: ${error.message}`);
  } else {
    console.log(`[referral] ✅ Référence enregistrée — code=${code} referee=${refereeId}`);
  }
}

// ── convertReferral ────────────────────────────────────────────────────────────
// Appelé par le webhook Stripe quand une utilisatrice parrainée souscrit.
// Passe le referral en 'converted' et crédite 1 mois gratuit à la marraine.

export async function convertReferral(refereeId: string): Promise<void> {
  const supabase = createServiceClient();

  // Chercher un referral 'registered' pour ce referee
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, referrer_id, rewarded, status")
    .eq("referee_id", refereeId)
    .eq("status", "registered")
    .maybeSingle();

  if (!referral) {
    // Pas de parrainage enregistré pour cet utilisateur — normal
    return;
  }

  if (referral.rewarded) {
    console.log(`[referral] Déjà récompensé — referral_id=${referral.id}`);
    return;
  }

  // 1. Marquer comme converti
  const { error: updateError } = await supabase
    .from("referrals")
    .update({
      status: "converted",
      rewarded: true,
      converted_at: new Date().toISOString(),
    })
    .eq("id", referral.id);

  if (updateError) {
    console.error(`[referral] convertReferral update: ${updateError.message}`);
    return;
  }

  // 2. Créditer 1 mois gratuit à la marraine via brand_profiles
  const { error: creditError } = await supabase.rpc(
    "increment_referral_credit",
    { p_user_id: referral.referrer_id }
  );

  if (creditError) {
    // Fallback : lecture + incrément manuel si la RPC n'existe pas encore
    console.warn(`[referral] RPC indispo, fallback manuel: ${creditError.message}`);
    const { data: existing } = await supabase
      .from("brand_profiles")
      .select("referral_credit_months")
      .eq("user_id", referral.referrer_id)
      .maybeSingle();

    const current: number = (existing as { referral_credit_months: number } | null)?.referral_credit_months ?? 0;

    await supabase
      .from("brand_profiles")
      .update({ referral_credit_months: current + 1 })
      .eq("user_id", referral.referrer_id);
  }

  console.log(
    `[referral] 🎁 Récompense accordée — referrer=${referral.referrer_id} +1 mois`
  );
}

// ── getReferralStats ───────────────────────────────────────────────────────────
// Utilisé par la page /dashboard/parrainage pour afficher les stats.

export interface ReferralStats {
  code: string;
  registered: number;   // parrainées inscrites
  converted: number;    // parrainées abonnées
  creditMonths: number; // mois gratuits disponibles
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const supabase = createServiceClient();

  const [referralRes, creditRes] = await Promise.all([
    supabase
      .from("referrals")
      .select("code, status")
      .eq("referrer_id", userId),
    supabase
      .from("brand_profiles")
      .select("referral_credit_months")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const referrals = referralRes.data ?? [];
  const code = referrals[0]?.code ?? await getOrCreateReferralCode(userId);

  return {
    code,
    registered: referrals.filter((r: { status: string }) => r.status === "registered" || r.status === "converted").length,
    converted: referrals.filter((r: { status: string }) => r.status === "converted").length,
    creditMonths: creditRes.data?.referral_credit_months ?? 0,
  };
}
