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

// ── Helpers partagés ──────────────────────────────────────────────────────────

function emailShell(title: string, previewText: string, body: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr>
          <td style="padding-bottom:24px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#B57A8C;letter-spacing:-0.5px;">Boss Beauty Studio</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;border-radius:16px;border:1px solid #E8E3DF;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding-top:20px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#bbb;">
              Boss Beauty Studio ·
              <a href="${appUrl}/dashboard/settings" style="color:#B57A8C;text-decoration:none;">Se désabonner</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<div style="margin-top:24px;text-align:center;">
    <a href="${href}" style="display:inline-block;background:#B57A8C;color:#fff;text-decoration:none;
       font-size:15px;font-weight:600;padding:13px 28px;border-radius:100px;">${label}</a>
  </div>`;
}

// ── Templates activation séquence ─────────────────────────────────────────────

/**
 * Email J+1 — Montrer ce que l'outil sait faire.
 * Objectif : faire revenir l'utilisatrice pour utiliser ses 2 essais.
 */
export function buildActivationEmail1(appUrl: string, specialite?: string | null): string {
  const niche = specialite ?? "beauté";
  const body = `
    <p style="margin:0 0 6px;font-size:32px;text-align:center;">✨</p>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a1a;text-align:center;">
      Voici ce que tu peux créer en 10 secondes
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#888;text-align:center;">
      Tu t'es inscrite hier — tu n'as pas encore tout essayé.
    </p>

    <!-- Exemple de post généré -->
    <div style="background:#FAF7F5;border-radius:12px;border:1px solid #E8E3DF;padding:18px 20px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#B57A8C;text-transform:uppercase;letter-spacing:1px;">
        Exemple · Post ${niche}
      </p>
      <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">
        "Tu mérites des ongles qui racontent ton histoire. 💅<br/>
        Chaque pose, c'est un moment rien qu'à toi — pour te sentir belle, confiante, irrésistible.<br/>
        Réserve ton créneau avant qu'il ne soit trop tard. ✨<br/><br/>
        <span style="color:#888;">#${niche.toLowerCase().replace(/\s+/g, "")} #beauté #prendssoindtoi</span>"
      </p>
    </div>

    <!-- Les 7 modules -->
    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1a1a1a;">
      7 outils t'attendent dans ton espace :
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${[
        ["📝", "Post Instagram", "7 types de contenu"],
        ["🖼️", "Carrousel", "+ guide Canva gratuit"],
        ["📱", "Story & Reel", "script + templates"],
        ["⚡", "Accroches", "10 hooks percutants"],
        ["💬", "Réponse DM", "3 variantes qui convertissent"],
        ["📅", "Idées semaine", "7 posts en 5 secondes"],
        ["🗓️", "Calendrier", "planifie tes publications"],
      ].map(([emoji, label, desc]) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #F0EBE7;">
          <span style="font-size:16px;">${emoji}</span>
          <span style="font-size:14px;font-weight:600;color:#1a1a1a;margin-left:8px;">${label}</span>
          <span style="font-size:13px;color:#888;margin-left:4px;">— ${desc}</span>
        </td>
      </tr>`).join("")}
    </table>

    ${ctaButton(`${appUrl}/dashboard`, "Essayer maintenant — c'est gratuit →")}
    <p style="margin:16px 0 0;font-size:12px;color:#aaa;text-align:center;">
      2 générations gratuites · Sans carte bancaire
    </p>
  `;
  return emailShell("Voici ce que Boss Beauty Studio peut faire pour toi", "7 outils pour créer ton contenu Instagram en quelques secondes ✨", body, appUrl);
}

/**
 * Email J+3 — Preuve sociale + FOMO.
 * Objectif : créer l'urgence via les résultats d'autres utilisatrices.
 */
export function buildActivationEmail2(appUrl: string): string {
  const body = `
    <p style="margin:0 0 6px;font-size:32px;text-align:center;">📱</p>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a1a;text-align:center;">
      Pendant ce temps, elles publient.
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#888;text-align:center;">
      3 jours sans contenu Instagram, c'est 3 jours offerts à la concurrence.
    </p>

    <!-- Avis clients -->
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${[
        ["Laura M.", "Technicienne cils · Lyon", "Je passais 2h le dimanche à préparer ma semaine Instagram. Maintenant ça me prend 10 minutes."],
        ["Inès B.", "Prothésiste ongulaire · Bordeaux", "Ce qui m'a convaincue c'est que le contenu parle vraiment de mon métier. Pas du générique sorti de ChatGPT."],
        ["Camille R.", "Coloriste · Nantes", "En 3 semaines j'ai doublé mes demandes de RDV via Instagram."],
      ].map(([nom, metier, texte]) => `
      <div style="background:#FAF7F5;border-radius:12px;border:1px solid #E8E3DF;padding:16px 18px;margin-bottom:10px;">
        <p style="margin:0 0 6px;font-size:14px;color:#333;line-height:1.5;">
          &ldquo;${texte}&rdquo;
        </p>
        <p style="margin:0;font-size:12px;font-weight:600;color:#B57A8C;">${nom}</p>
        <p style="margin:0;font-size:11px;color:#aaa;">${metier}</p>
      </div>`).join("")}
    </div>

    <p style="margin:20px 0 4px;font-size:14px;color:#555;text-align:center;">
      Tu as encore <strong>2 générations gratuites</strong> qui t'attendent.
    </p>

    ${ctaButton(`${appUrl}/dashboard`, "Générer mon contenu maintenant →")}
  `;
  return emailShell("Pendant que tu lis ceci, elles publient 📱", "3 jours sans contenu Instagram, c'est 3 jours offerts à la concurrence...", body, appUrl);
}

/**
 * Email J+7 — Conversion directe.
 * Objectif : pousser à l'abonnement avec clarté sur ce qui est inclus.
 */
export function buildActivationEmail3(appUrl: string): string {
  const body = `
    <p style="margin:0 0 6px;font-size:32px;text-align:center;">🌸</p>
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a1a;text-align:center;">
      Une seule cliente rembourse tout.
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#888;text-align:center;">
      Tu t'es inscrite il y a 7 jours. Si tu n'as pas encore franchi le cap,<br/>voici ce qui t'attend de l'autre côté.
    </p>

    <!-- Pricing card -->
    <div style="background:#FAF7F5;border-radius:14px;border:2px solid #B57A8C;padding:24px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#B57A8C;text-transform:uppercase;letter-spacing:1px;">Accès complet</p>
      <p style="margin:0;font-size:42px;font-weight:700;color:#1a1a1a;line-height:1.1;">29€<span style="font-size:16px;font-weight:400;color:#888;">/mois</span></p>
      <p style="margin:8px 0 16px;font-size:13px;color:#555;">Sans engagement · Annulation en 1 clic</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="text-align:left;">
        ${[
          "7 modules de création de contenu",
          "Profil de marque — pré-remplissage auto",
          "Rappels de publication par email",
          "Bibliothèque de tes créations",
          "Contenu adapté à ta spécialité",
          "Guide Canva inclus dans chaque module",
        ].map((f) => `
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#333;">
            <span style="color:#B57A8C;font-weight:700;margin-right:8px;">✓</span>${f}
          </td>
        </tr>`).join("")}
      </table>
    </div>

    ${ctaButton(`${appUrl}/login`, "Passer à l'abonnement — 29€/mois →")}
    <p style="margin:14px 0 0;font-size:12px;color:#aaa;text-align:center;">
      Accès immédiat · Première cliente = abonnement remboursé
    </p>
  `;
  return emailShell("Une seule cliente rembourse tout 🌸", "29€/mois · 7 modules · Sans engagement · Accès immédiat", body, appUrl);
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
