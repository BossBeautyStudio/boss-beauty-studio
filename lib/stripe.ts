// ============================================================
// lib/stripe.ts — Utilitaires Stripe sans SDK
//
// Implémenté avec fetch natif + Web Crypto API.
// Aucune dépendance npm supplémentaire.
//
// Exports :
//   stripeRequest(method, path, params?)  — appel REST Stripe
//   verifyStripeWebhook(rawBody, header, secret) — vérifie + parse event
//   Types minimaux pour les objets Stripe utilisés
// ============================================================

// ── Types minimaux ─────────────────────────────────────────────────────────────

export interface StripeCheckoutSession {
  id: string;
  mode: "payment" | "subscription" | "setup";
  customer: string | null;
  subscription: string | null;
  client_reference_id: string | null;
  customer_details: {
    email: string | null;
  } | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
}

export interface StripeSubscription {
  id: string;
  status:
    | "active"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "past_due"
    | "paused"
    | "trialing"
    | "unpaid";
  customer: string;
  current_period_end: number; // Unix timestamp
}

export interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

// ── Appel API Stripe ───────────────────────────────────────────────────────────

const STRIPE_API_BASE = "https://api.stripe.com/v1";

/**
 * Effectue un appel à l'API REST Stripe.
 * Utilise l'authentification Basic avec STRIPE_SECRET_KEY.
 * Les paramètres sont encodés en application/x-www-form-urlencoded.
 *
 * @throws Error si la réponse HTTP n'est pas 2xx.
 */
export async function stripeRequest<T = Record<string, unknown>>(
  method: "GET" | "POST",
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("[stripe] STRIPE_SECRET_KEY non défini");
  }

  const url = `${STRIPE_API_BASE}${path}`;
  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  const options: RequestInit = {
    method,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  if (method === "POST" && params) {
    options.body = new URLSearchParams(params).toString();
  } else if (method === "GET" && params) {
    const qs = new URLSearchParams(params).toString();
    return stripeRequest<T>("GET", `${path}?${qs}`);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[stripe] API ${method} ${path} → ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Vérification signature webhook ────────────────────────────────────────────

/**
 * Vérifie la signature du webhook Stripe et retourne l'événement parsé.
 *
 * Algorithme Stripe :
 *   1. Extraire timestamp (t=) et signature (v1=) du header Stripe-Signature
 *   2. Calculer HMAC-SHA256 de "{timestamp}.{rawBody}" avec le webhook secret
 *   3. Comparer en temps constant avec la signature reçue
 *   4. Vérifier que le timestamp n'est pas trop ancien (5 min tolerance)
 *
 * @throws Error si la signature est invalide ou le payload mal formé.
 */
export async function verifyStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<StripeEvent> {
  if (!signatureHeader) {
    throw new Error("Header Stripe-Signature manquant");
  }

  // Parser le header : "t=1234,v1=abc123,v1=def456"
  // On collecte TOUTES les valeurs v1= (Stripe peut en envoyer plusieurs)
  let timestamp: string | undefined;
  const receivedSigs: string[] = [];

  for (const part of signatureHeader.split(",")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (key === "t") timestamp = val;
    else if (key === "v1") receivedSigs.push(val);
  }

  if (!timestamp || receivedSigs.length === 0) {
    throw new Error("Header Stripe-Signature malformé (t ou v1 manquant)");
  }

  // Vérification tolérance timestamp (5 minutes)
  const TOLERANCE_SECONDS = 300;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > TOLERANCE_SECONDS) {
    throw new Error(
      `Webhook timestamp trop ancien ou futur (delta=${Math.abs(now - parseInt(timestamp, 10))}s)`
    );
  }

  // Calculer HMAC-SHA256 de "{timestamp}.{rawBody}"
  const encoder = new TextEncoder();
  const signedPayload = `${timestamp}.${rawBody}`;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(signedPayload)
  );

  const computedSig = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Vérifier si AU MOINS UNE des signatures v1 correspond (comparaison temps constant)
  const isValid = receivedSigs.some((receivedSig) => {
    if (computedSig.length !== receivedSig.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computedSig.length; i++) {
      mismatch |= computedSig.charCodeAt(i) ^ receivedSig.charCodeAt(i);
    }
    return mismatch === 0;
  });

  if (!isValid) {
    throw new Error("Signature Stripe invalide");
  }

  // Parser l'événement
  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    throw new Error("Payload Stripe JSON invalide");
  }

  return event;
}

// ── Helpers métier ─────────────────────────────────────────────────────────────

/**
 * Mappe le statut Stripe d'un abonnement vers notre SubscriptionStatus.
 */
export function mapStripeSubscriptionStatus(
  stripeStatus: StripeSubscription["status"]
): "active" | "inactive" | "cancelled" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "canceled":
      return "cancelled";
    case "past_due":
    case "unpaid":
    case "paused":
    case "incomplete":
    case "incomplete_expired":
      return "inactive";
  }
}
