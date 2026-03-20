// ============================================================
// app/api/webhooks/stripe/route.ts
//
// POST /api/webhooks/stripe
// Reçoit et traite les événements Stripe.
//
// Sécurité :
//   - Vérification signature HMAC-SHA256 (header Stripe-Signature)
//   - Secret stocké dans STRIPE_WEBHOOK_SECRET (env)
//   - Tous les accès DB via service_role (bypass RLS)
//
// Événements gérés :
//   checkout.session.completed     → activation abonnement
//   customer.subscription.updated  → mise à jour statut
//   customer.subscription.deleted  → annulation
//
// Idempotence :
//   - checkout.session.completed : skip si stripe_subscription_id
//     déjà présent ET subscription_status = 'active'
//   - subscription.updated : skip si statut DB = statut calculé
//   - subscription.deleted : skip si subscription_status = 'cancelled'
//   - pending_activations : upsert ON CONFLICT(email)
//
// Emails :
//   - Normalisés en lowercase + trim avant tout matching.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MONTHLY_LIMIT } from "@/lib/quota";
import { convertReferral } from "@/lib/referral";
import {
  verifyStripeWebhook,
  mapStripeSubscriptionStatus,
  stripeRequest,
  type StripeCheckoutSession,
  type StripeSubscription,
  type StripeEvent,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";

// ── Helper : activer un utilisateur ───────────────────────────────────────────

interface ActivateParams {
  userId: string | null;
  email: string | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodEnd: number | null;
}

async function activateUser(
  supabase: ReturnType<typeof createServiceClient>,
  params: ActivateParams
): Promise<{ activated: boolean; skipped?: string }> {
  const { userId, email, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd } =
    params;

  const normalizedEmail = email?.toLowerCase().trim() ?? null;

  // ── Chercher l'utilisateur (par ID d'abord, puis par email) ─
  let existingUser: { id: string; stripe_subscription_id: string | null; subscription_status: string } | null = null;

  if (userId) {
    const { data, error } = await supabase
      .from("users")
      .select("id, stripe_subscription_id, subscription_status")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(`[webhook/stripe] Lookup by id: ${error.message}`);
    existingUser = data;
  }

  // Fallback email si userId introuvable ou absent
  if (!existingUser && normalizedEmail) {
    const { data, error } = await supabase
      .from("users")
      .select("id, stripe_subscription_id, subscription_status")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) throw new Error(`[webhook/stripe] Lookup by email: ${error.message}`);
    existingUser = data;
  }

  // ── Utilisateur introuvable → pending_activation ─────────────
  if (!existingUser) {
    if (!normalizedEmail) {
      console.warn("[webhook/stripe] Pas d'identifiant — activation ignorée");
      return { activated: false, skipped: "no_identifier" };
    }

    // upsert idempotent via UNIQUE(email)
    const { error } = await supabase
      .from("pending_activations")
      .upsert(
        {
          email: normalizedEmail,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          subscription_current_period_end: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null,
        },
        { onConflict: "email" }
      );

    if (error) {
      throw new Error(`[webhook/stripe] pending_activations upsert: ${error.message}`);
    }

    console.log(`[webhook/stripe] ⏳ Pending activation — email=${normalizedEmail}`);
    return { activated: false, skipped: "user_not_found_pending_created" };
  }

  // ── Idempotence : déjà actif avec cette subscription ─────────
  if (
    existingUser.stripe_subscription_id === stripeSubscriptionId &&
    existingUser.subscription_status === "active"
  ) {
    console.log(`[webhook/stripe] ⏭️  Déjà activé — id=${existingUser.id}`);
    return { activated: false, skipped: "already_active" };
  }

  // ── Activation ───────────────────────────────────────────────
  const updateData: Record<string, unknown> = {
    subscription_status: "active",
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    quota_monthly: MONTHLY_LIMIT,
  };

  if (currentPeriodEnd) {
    updateData.subscription_current_period_end = new Date(
      currentPeriodEnd * 1000
    ).toISOString();
  }

  const { error: updateError } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", existingUser.id);

  if (updateError) {
    throw new Error(`[webhook/stripe] Activation update: ${updateError.message}`);
  }

  console.log(
    `[webhook/stripe] ✅ Activé — id=${existingUser.id} sub=${stripeSubscriptionId}`
  );
  return { activated: true };
}

// ── Handler principal ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[webhook/stripe] STRIPE_WEBHOOK_SECRET non défini");
    return NextResponse.json({ error: "Configuration manquante." }, { status: 500 });
  }

  // 1. Lire le body brut
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Body illisible." }, { status: 400 });
  }

  // 2. Vérifier la signature et parser l'événement
  let event: StripeEvent;
  try {
    event = await verifyStripeWebhook(
      rawBody,
      req.headers.get("stripe-signature"),
      secret
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur signature";
    console.warn(`[webhook/stripe] ${msg}`);
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  console.log(`[webhook/stripe] event=${event.type} id=${event.id}`);

  const supabase = createServiceClient();

  try {
    switch (event.type) {

      // ── Nouveau paiement Stripe ───────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as unknown as StripeCheckoutSession;

        // On ne gère que le mode subscription
        if (session.mode !== "subscription") break;

        const stripeCustomerId =
          typeof session.customer === "string" ? session.customer : null;
        const stripeSubscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;
        const email = session.customer_details?.email ?? null;
        const userId = session.client_reference_id ?? null;

        if (!stripeCustomerId || !stripeSubscriptionId) {
          console.warn("[webhook/stripe] customer ou subscription absent de la session");
          break;
        }

        // Récupérer current_period_end depuis la subscription
        let currentPeriodEnd: number | null = null;
        try {
          const sub = await stripeRequest<StripeSubscription>(
            "GET",
            `/subscriptions/${stripeSubscriptionId}`
          );
          currentPeriodEnd = sub.current_period_end;
        } catch {
          // Non-bloquant — on active quand même sans la date
        }

        const activation = await activateUser(supabase, {
          userId,
          email,
          stripeCustomerId,
          stripeSubscriptionId,
          currentPeriodEnd,
        });

        // ── Convertir le referral si l'activation a réussi ───
        if (activation.activated && userId) {
          try {
            await convertReferral(userId);
          } catch (refErr) {
            // Non-bloquant — on ne fait pas échouer le webhook pour ça
            console.error("[webhook/stripe] convertReferral:", refErr);
          }
        }
        break;
      }

      // ── Mise à jour abonnement ────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as unknown as StripeSubscription;
        const newStatus = mapStripeSubscriptionStatus(sub.status);
        const stripeCustomerId =
          typeof sub.customer === "string" ? sub.customer : (sub.customer as unknown as { id: string }).id;

        const { data: user, error: lookupError } = await supabase
          .from("users")
          .select("id, subscription_status")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle();

        if (lookupError) {
          throw new Error(`[webhook/stripe] subscription.updated lookup: ${lookupError.message}`);
        }

        if (!user) {
          console.warn(
            `[webhook/stripe] subscription.updated — aucun user pour sub_id=${sub.id}`
          );
          break;
        }

        // Idempotence : statut inchangé → skip
        if (user.subscription_status === newStatus) break;

        const { error: updateError } = await supabase
          .from("users")
          .update({
            subscription_status: newStatus,
            stripe_customer_id: stripeCustomerId,
            subscription_current_period_end: new Date(
              sub.current_period_end * 1000
            ).toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          throw new Error(`[webhook/stripe] subscription.updated update: ${updateError.message}`);
        }

        console.log(
          `[webhook/stripe] 🔄 Statut mis à jour — id=${user.id} status=${newStatus}`
        );
        break;
      }

      // ── Annulation abonnement ─────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as unknown as StripeSubscription;

        const { data: user, error: lookupError } = await supabase
          .from("users")
          .select("id, subscription_status")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle();

        if (lookupError) {
          throw new Error(`[webhook/stripe] subscription.deleted lookup: ${lookupError.message}`);
        }

        if (!user) {
          console.warn(
            `[webhook/stripe] subscription.deleted — aucun user pour sub_id=${sub.id}`
          );
          break;
        }

        // Idempotence
        if (user.subscription_status === "cancelled") break;

        const { error: updateError } = await supabase
          .from("users")
          .update({ subscription_status: "cancelled" })
          .eq("id", user.id);

        if (updateError) {
          throw new Error(`[webhook/stripe] subscription.deleted update: ${updateError.message}`);
        }

        console.log(`[webhook/stripe] ❌ Abonnement annulé — id=${user.id}`);
        break;
      }

      default:
        // Événement non géré — retourner 200 pour éviter les rejeux
        console.log(`[webhook/stripe] Événement non géré : ${event.type}`);
    }

    // Toujours retourner 200 pour les cas nominaux
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur interne";
    console.error("[webhook/stripe] Erreur:", message);
    // 500 → Stripe retentera l'événement
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
