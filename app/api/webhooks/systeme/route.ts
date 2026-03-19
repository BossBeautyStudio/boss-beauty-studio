// ============================================================
// app/api/webhooks/systeme/route.ts
//
// POST /api/webhooks/systeme
// Reçoit le webhook paiement de Systeme.io.
//
// Sécurité :
//   - Vérification signature HMAC-SHA256 (header X-Systeme-Signature)
//   - Secret stocké dans SYSTEME_WEBHOOK_SECRET (env)
//   - La route bypass le middleware Next.js auth (webhook public)
//
// Payload attendu (Systeme.io order.completed) :
// {
//   event: "order.completed",
//   data: {
//     contact: { email, first_name, last_name },
//     order:   { id, ... }
//   }
// }
//
// Actions :
//   1. Vérifier la signature → 401 si invalide
//   2. Parser le payload → 400 si malformé
//   3. Lookup user par email (index idx_users_email)
//   4. Activer : subscription_status = 'active', quota_monthly = 30
//   5. Sauvegarder systeme_order_id si présent
//   6. Retourner 200 (Systeme.io rejoue si ≠ 2xx)
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MONTHLY_LIMIT } from "@/lib/quota";

export const dynamic = "force-dynamic";

// ── Vérification signature HMAC-SHA256 ────────────────────────

async function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;

  // Format attendu : "sha256=<hex>"
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

  // Comparaison en temps constant pour éviter les timing attacks
  if (computedHex.length !== receivedHex.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computedHex.length; i++) {
    mismatch |= computedHex.charCodeAt(i) ^ receivedHex.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Types payload ─────────────────────────────────────────────

interface SystemeContact {
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface SystemeOrder {
  id?: string;
}

interface SystemePayload {
  event?: string;
  data?: {
    contact?: SystemeContact;
    order?: SystemeOrder;
  };
}

// ── Handler ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.SYSTEME_WEBHOOK_SECRET;

  // Sécurité : le secret DOIT être configuré en production
  if (!secret) {
    console.error("[webhook/systeme] SYSTEME_WEBHOOK_SECRET non défini");
    return NextResponse.json(
      { error: "Configuration serveur manquante." },
      { status: 500 }
    );
  }

  // 1. Lire le body brut (nécessaire pour vérifier la signature)
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
    console.warn("[webhook/systeme] Signature invalide — requête rejetée");
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  // 3. Parser le payload
  let payload: SystemePayload;
  try {
    payload = JSON.parse(rawBody) as SystemePayload;
  } catch {
    return NextResponse.json({ error: "Payload JSON invalide." }, { status: 400 });
  }

  // 4. Extraire les données nécessaires
  const email = payload.data?.contact?.email;
  const orderId = payload.data?.order?.id;
  const event = payload.event ?? "unknown";

  if (!email || typeof email !== "string") {
    console.warn("[webhook/systeme] email manquant dans le payload", { event });
    // Retourner 200 pour éviter les rejeux Systeme.io sur payloads non gérés
    return NextResponse.json({ received: true, skipped: "no_email" });
  }

  console.log(`[webhook/systeme] event=${event} email=${email} orderId=${orderId ?? "n/a"}`);

  // 5. Lookup + activation utilisateur
  const supabase = createServiceClient();

  const { data: existingUser, error: lookupError } = await supabase
    .from("users")
    .select("id, subscription_status")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("[webhook/systeme] Erreur lookup user:", lookupError.message);
    return NextResponse.json(
      { error: "Erreur base de données." },
      { status: 500 }
    );
  }

  if (!existingUser) {
    // L'utilisateur n'a pas encore créé son compte — log et retour 200.
    // Systeme.io ne rejouera pas (on retourne 200).
    // La mise à jour du statut devra être gérée côté onboarding.
    console.warn(
      `[webhook/systeme] Aucun utilisateur trouvé pour email=${email}. ` +
      `Compte non encore créé ou email différent.`
    );
    return NextResponse.json({ received: true, skipped: "user_not_found" });
  }

  // 6. Activer le compte
  const updatePayload: Record<string, unknown> = {
    subscription_status: "active",
    quota_monthly: MONTHLY_LIMIT,
  };

  if (typeof orderId === "string" && orderId.length > 0) {
    updatePayload.systeme_order_id = orderId;
  }

  const { error: updateError } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", existingUser.id);

  if (updateError) {
    console.error("[webhook/systeme] Erreur activation:", updateError.message);
    // Retourner 500 pour que Systeme.io rejoue le webhook
    return NextResponse.json(
      { error: "Erreur lors de l'activation." },
      { status: 500 }
    );
  }

  console.log(
    `[webhook/systeme] ✅ Utilisateur activé — id=${existingUser.id} email=${email} ` +
    `ancien_statut=${existingUser.subscription_status}`
  );

  return NextResponse.json({ received: true, activated: true });
}
