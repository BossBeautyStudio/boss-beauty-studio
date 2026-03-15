// ============================================================
// app/api/webhooks/systeme-cancel/route.ts
//
// POST /api/webhooks/systeme-cancel
// Reçoit le webhook annulation/remboursement de Systeme.io.
//
// Sécurité :
//   - Vérification signature HMAC-SHA256 (header X-Systeme-Signature)
//   - Même secret que le webhook paiement : SYSTEME_WEBHOOK_SECRET
//
// Payload attendu (Systeme.io subscription.cancelled / order.refunded) :
// {
//   event: "subscription.cancelled",
//   data: {
//     contact: { email, first_name, last_name },
//     order:   { id, ... }
//   }
// }
//
// Actions :
//   1. Vérifier la signature → 401 si invalide
//   2. Parser le payload → 400 si malformé
//   3. Lookup user par email
//   4. Mettre subscription_status = 'cancelled'
//   5. Retourner 200
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ── Vérification signature HMAC-SHA256 ────────────────────────
// (identique au webhook paiement — même secret, même algorithme)

async function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;

  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) return false;
  const receivedHex = signatureHeader.slice(prefix.length);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody)
  );
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computedHex.length !== receivedHex.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computedHex.length; i++) {
    mismatch |= computedHex.charCodeAt(i) ^ receivedHex.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Types payload ─────────────────────────────────────────────

interface SystemePayload {
  event?: string;
  data?: {
    contact?: {
      email?: string;
    };
    order?: {
      id?: string;
    };
  };
}

// ── Handler ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.SYSTEME_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[webhook/systeme-cancel] SYSTEME_WEBHOOK_SECRET non défini");
    return NextResponse.json(
      { error: "Configuration serveur manquante." },
      { status: 500 }
    );
  }

  // 1. Lire le body brut
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Body illisible." }, { status: 400 });
  }

  // 2. Vérifier la signature
  const signatureHeader = req.headers.get("x-systeme-signature");
  const isValid = await verifySignature(rawBody, signatureHeader, secret);

  if (!isValid) {
    console.warn("[webhook/systeme-cancel] Signature invalide — requête rejetée");
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  // 3. Parser le payload
  let payload: SystemePayload;
  try {
    payload = JSON.parse(rawBody) as SystemePayload;
  } catch {
    return NextResponse.json({ error: "Payload JSON invalide." }, { status: 400 });
  }

  // 4. Extraire les données
  const email = payload.data?.contact?.email;
  const event = payload.event ?? "unknown";

  if (!email || typeof email !== "string") {
    console.warn("[webhook/systeme-cancel] email manquant dans le payload", { event });
    return NextResponse.json({ received: true, skipped: "no_email" });
  }

  console.log(`[webhook/systeme-cancel] event=${event} email=${email}`);

  // 5. Lookup utilisateur
  const supabase = createServiceClient();

  const { data: existingUser, error: lookupError } = await supabase
    .from("users")
    .select("id, subscription_status")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("[webhook/systeme-cancel] Erreur lookup user:", lookupError.message);
    return NextResponse.json(
      { error: "Erreur base de données." },
      { status: 500 }
    );
  }

  if (!existingUser) {
    console.warn(`[webhook/systeme-cancel] Aucun utilisateur trouvé pour email=${email}`);
    return NextResponse.json({ received: true, skipped: "user_not_found" });
  }

  // Idempotence : si déjà annulé, ne pas re-écrire inutilement
  if (existingUser.subscription_status === "cancelled") {
    console.log(`[webhook/systeme-cancel] Déjà annulé — id=${existingUser.id}`);
    return NextResponse.json({ received: true, skipped: "already_cancelled" });
  }

  // 6. Annuler le compte
  const { error: updateError } = await supabase
    .from("users")
    .update({ subscription_status: "cancelled" })
    .eq("id", existingUser.id);

  if (updateError) {
    console.error("[webhook/systeme-cancel] Erreur annulation:", updateError.message);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation." },
      { status: 500 }
    );
  }

  console.log(
    `[webhook/systeme-cancel] ✅ Compte annulé — id=${existingUser.id} email=${email} ` +
    `ancien_statut=${existingUser.subscription_status}`
  );

  return NextResponse.json({ received: true, cancelled: true });
}
