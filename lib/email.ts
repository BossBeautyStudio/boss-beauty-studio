// ============================================================
// lib/email.ts — Envoi d'emails via l'API Resend (fetch natif)
//
// Pas de dépendance npm — appel HTTP direct à https://api.resend.com
// Variable requise : RESEND_API_KEY
// Variable requise : RESEND_FROM (ex: "Boss Beauty Studio <rappels@bossbeautystudio.com>")
// ============================================================

const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envoie un email via Resend.
 * Retourne true si succès, false sinon.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from   = process.env.RESEND_FROM ?? "Boss Beauty Studio <rappels@bossbeautystudio.site>";

  if (!apiKey) {
    console.error("[email] RESEND_API_KEY manquant");
    return false;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] Resend error ${res.status}:`, body);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] sendEmail exception:", err);
    return false;
  }
}

// ── Template rappel calendrier ─────────────────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
  post:     "📝 Post Instagram",
  carousel: "🖼️ Carrousel",
  story:    "📱 Story",
  reel:     "🎬 Reel",
  dm:       "💬 Réponse DM",
  hooks:    "⚡ Accroche",
};

export interface ReminderEntry {
  title:  string;
  module: string;
  note?:  string | null;
}

/**
 * Génère l'email HTML de rappel pour les publications du lendemain.
 */
export function buildReminderEmail(entries: ReminderEntry[], tomorrowLabel: string, calendarUrl: string): string {
  const entriesHtml = entries
    .map(
      (e) => `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #F0EBE7;">
          <p style="margin:0 0 2px; font-size:15px; font-weight:600; color:#1a1a1a;">
            ${e.title}
          </p>
          <p style="margin:0; font-size:13px; color:#888;">
            ${MODULE_LABELS[e.module] ?? e.module}
            ${e.note ? ` · <em>${e.note}</em>` : ""}
          </p>
        </td>
      </tr>`
    )
    .join("");

  const count = entries.length;
  const plural = count > 1 ? "publications prévues" : "publication prévue";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rappel publication demain</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <p style="margin:0;font-size:24px;font-weight:700;color:#B57A8C;letter-spacing:-0.5px;">
                Boss Beauty Studio
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#fff;border-radius:16px;border:1px solid #E8E3DF;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

              <!-- Emoji + titre -->
              <p style="margin:0 0 6px;font-size:32px;text-align:center;">🗓️</p>
              <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1a1a1a;text-align:center;">
                Tu publies demain !
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#888;text-align:center;">
                ${count} ${plural} · ${tomorrowLabel}
              </p>

              <!-- Liste des entrées -->
              <table width="100%" cellpadding="0" cellspacing="0">
                ${entriesHtml}
              </table>

              <!-- CTA -->
              <div style="margin-top:28px;text-align:center;">
                <a href="${calendarUrl}"
                   style="display:inline-block;background:#B57A8C;color:#fff;text-decoration:none;
                          font-size:15px;font-weight:600;padding:13px 28px;border-radius:100px;">
                  Voir mon calendrier →
                </a>
              </div>

              <p style="margin:20px 0 0;font-size:12px;color:#aaa;text-align:center;">
                Bonne publication ! ✨
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#bbb;">
                Tu reçois cet email car tu as activé les rappels dans
                <a href="${calendarUrl.replace("/calendar", "/settings")}"
                   style="color:#B57A8C;text-decoration:none;">Mon profil</a>.
                <br />
                <a href="${calendarUrl.replace("/calendar", "/settings")}"
                   style="color:#B57A8C;text-decoration:none;">Désactiver les rappels</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}
