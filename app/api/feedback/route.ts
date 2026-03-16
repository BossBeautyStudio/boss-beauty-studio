// ============================================================
// app/api/feedback/route.ts
//
// POST /api/feedback
// Reçoit un message de l'utilisateur connecté et l'envoie
// par email à bossbeautystudio.fr@gmail.com via Resend.
//
// Variables d'environnement requises :
//   RESEND_API_KEY   — clé API Resend (https://resend.com)
//   RESEND_FROM      — adresse expéditeur vérifiée dans Resend
//                      (ex: "Boss Beauty Studio <noreply@bossbeautystudio.site>")
//
// Body attendu : { message: string }  — max 1000 caractères
// Réponses :
//   200  { success: true }
//   400  { error: "..." }   — message vide ou trop long
//   401  { error: "..." }   — non authentifié
//   500  { error: "..." }   — erreur Resend
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_CHARS = 1000;
const FEEDBACK_TO = "bossbeautystudio.fr@gmail.com";
const RESEND_SEND_URL = "https://api.resend.com/emails";

export async function POST(req: Request) {
  // ── 1. Auth ──────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // ── 2. Validation du body ────────────────────────────────
  let body: { message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json(
      { error: "Le message est vide." },
      { status: 400 }
    );
  }

  if (message.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Le message dépasse ${MAX_CHARS} caractères.` },
      { status: 400 }
    );
  }

  // ── 3. Envoi email via Resend REST API ───────────────────
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress =
    process.env.RESEND_FROM ?? "Boss Beauty Studio <noreply@bossbeautystudio.site>";

  if (!apiKey) {
    console.error("[feedback] RESEND_API_KEY manquant");
    return NextResponse.json(
      { error: "Configuration email manquante." },
      { status: 500 }
    );
  }

  const now = new Date().toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
    timeStyle: "short",
  });

  const emailBody = {
    from: fromAddress,
    to: [FEEDBACK_TO],
    subject: "Boss Beauty Studio — Feedback utilisateur",
    text: [
      "Nouveau feedback reçu via Boss Beauty Studio.",
      "",
      `Utilisateur : ${user.email}`,
      `Date        : ${now}`,
      "",
      "--- Message ---",
      message,
      "---------------",
    ].join("\n"),
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 4px;font-size:18px;color:#1a1a1a;">
          💬 Nouveau feedback
        </h2>
        <p style="margin:0 0 20px;font-size:13px;color:#888;">
          Boss Beauty Studio · ${now}
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:8px 12px;background:#f5f5f5;border-radius:6px 0 0 6px;
                       font-size:12px;font-weight:600;color:#555;width:100px;">
              Utilisateur
            </td>
            <td style="padding:8px 12px;background:#fafafa;border-radius:0 6px 6px 0;
                       font-size:13px;color:#1a1a1a;">
              ${user.email}
            </td>
          </tr>
        </table>

        <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:10px;
                    padding:16px;font-size:14px;line-height:1.6;color:#333;
                    white-space:pre-wrap;">
${message}
        </div>

        <p style="margin-top:20px;font-size:11px;color:#bbb;">
          Envoyé automatiquement depuis Boss Beauty Studio
        </p>
      </div>
    `,
  };

  try {
    const resendRes = await fetch(RESEND_SEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
    });

    if (!resendRes.ok) {
      const err = await resendRes.json().catch(() => ({}));
      console.error("[feedback] Resend error:", err);
      return NextResponse.json(
        { error: "Échec de l'envoi de l'email." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[feedback] fetch Resend failed:", err);
    return NextResponse.json(
      { error: "Impossible de joindre le service email." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
