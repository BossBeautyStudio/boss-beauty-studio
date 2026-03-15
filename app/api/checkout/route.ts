// ============================================================
// app/api/checkout/route.ts
//
// GET /api/checkout
// Crée une Stripe Checkout Session et redirige vers Stripe.
//
// Comportement :
//   - Si l'utilisateur est connecté : injecte son email + userId
//     comme client_reference_id et metadata pour l'activation webhook.
//   - Si l'utilisateur n'est pas connecté : Stripe collecte l'email
//     pendant le paiement. Le webhook crée une pending_activation.
//   - En cas d'erreur Stripe : redirige vers / avec ?error=checkout.
//
// Variables d'environnement requises :
//   STRIPE_SECRET_KEY   — clé secrète Stripe
//   STRIPE_PRICE_ID     — ID du prix 29€/mois
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripeRequest, type StripeCheckoutSession } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;

  // ── Vérifications de configuration ──────────────────────────
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[checkout] STRIPE_SECRET_KEY non défini");
    return NextResponse.redirect(`${origin}/?error=config`);
  }
  if (!process.env.STRIPE_PRICE_ID) {
    console.error("[checkout] STRIPE_PRICE_ID non défini");
    return NextResponse.redirect(`${origin}/?error=config`);
  }

  // ── Récupération optionnelle de l'utilisateur connecté ──────
  let userId: string | undefined;
  let userEmail: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;
      userEmail = user.email ?? undefined;
    }
  } catch {
    // Non-bloquant — le paiement peut se faire sans session active
  }

  // ── Création de la Checkout Session ─────────────────────────
  try {
    // Paramètres de base
    const params: Record<string, string> = {
      mode: "subscription",
      "line_items[0][price]": process.env.STRIPE_PRICE_ID,
      "line_items[0][quantity]": "1",
      success_url: `${origin}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      allow_promotion_codes: "true",
    };

    // Paramètres conditionnels si utilisateur connecté
    if (userEmail) {
      params.customer_email = userEmail;
    }
    if (userId) {
      params.client_reference_id = userId;
      params["metadata[user_id]"] = userId;
    }

    const session = await stripeRequest<StripeCheckoutSession>(
      "POST",
      "/checkout/sessions",
      params
    );

    if (!session.id) {
      throw new Error("Session Stripe créée sans ID");
    }

    // Stripe retourne l'URL dans session.url (non typé ici — cast sûr)
    const sessionUrl = (session as unknown as { url: string | null }).url;
    if (!sessionUrl) {
      throw new Error("URL Stripe Checkout manquante dans la réponse");
    }

    console.log(
      `[checkout] Session créée — id=${session.id} userId=${userId ?? "anonymous"}`
    );

    return NextResponse.redirect(sessionUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[checkout] Erreur création session Stripe:", message);
    return NextResponse.redirect(`${origin}/?error=checkout`);
  }
}
