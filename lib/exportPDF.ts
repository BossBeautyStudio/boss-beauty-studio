// ============================================================
// lib/exportPDF.ts
//
// Export PDF côté client — zéro dépendance.
// Génère du HTML stylé et déclenche window.print() dans un
// nouvel onglet pour que l'utilisatrice puisse sauvegarder en PDF.
//
// Fonctions disponibles :
//   exportCarouselPDF  — carrousel complet (couverture + slides + caption)
//   exportPostPDF      — post Instagram (hook + texte + hashtags)
//   exportHooksPDF     — liste des 10 accroches
//   exportPlanningPDF  — planning de la semaine (7 jours)
// ============================================================

// ── Styles communs ────────────────────────────────────────────────────────────

const BASE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 12px;
    color: #1a1a1a;
    background: #fff;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

const ACCENT = "#C4956A";
const SURFACE = "#FDF7F2";
const BORDER  = "#E8D5C4";

// ── Utilitaire d'ouverture ────────────────────────────────────────────────────

function openPrintWindow(html: string): void {
  const win = window.open("", "_blank", "width=860,height=960");
  if (!win) {
    alert("Active les popups pour exporter en PDF.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Export Carrousel ──────────────────────────────────────────────────────────

interface CarouselSlide {
  numero: number;
  titre: string;
  texte: string;
  visuel: string;
}

interface CarouselExportData {
  titre: string;
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
  cta: string;
}

export function exportCarouselPDF(
  result: CarouselExportData,
  params: { specialite: string; sujet: string }
): void {
  const slidesHTML = result.slides.map((slide) => `
    <div class="slide">
      <div class="slide-header">
        <span class="slide-num">${slide.numero}</span>
        <span class="slide-total">/ ${result.slides.length}</span>
      </div>
      <h2 class="slide-title">${esc(slide.titre)}</h2>
      <p class="slide-text">${esc(slide.texte)}</p>
      <div class="slide-visual">
        <span class="visual-label">📷 Visuel suggéré</span>
        <span class="visual-text">${esc(slide.visuel)}</span>
      </div>
    </div>
  `).join("");

  const hashtagsHTML = result.hashtags
    .map((h) => `<span class="tag">${esc(h)}</span>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${esc(result.titre)}</title>
  <style>
    ${BASE_STYLES}
    .cover {
      padding: 60px 50px;
      background: ${SURFACE};
      border-bottom: 3px solid ${ACCENT};
      page-break-after: always;
    }
    .cover-badge {
      font-size: 9px; text-transform: uppercase; letter-spacing: 2px;
      color: #999; margin-bottom: 16px;
    }
    .cover-title { font-size: 26px; font-weight: 700; line-height: 1.25; margin-bottom: 12px; color: #111; }
    .cover-meta  { font-size: 12px; color: #777; }
    .cover-accent { color: ${ACCENT}; }

    .slide {
      padding: 50px;
      page-break-after: always;
      border-bottom: 1px solid ${BORDER};
    }
    .slide:last-of-type { page-break-after: auto; border-bottom: none; }
    .slide-header { display: flex; align-items: center; gap: 6px; margin-bottom: 24px; }
    .slide-num {
      width: 30px; height: 30px; border-radius: 50%;
      background: ${ACCENT}; color: #fff;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
    }
    .slide-total  { font-size: 11px; color: #aaa; }
    .slide-title  { font-size: 18px; font-weight: 700; margin-bottom: 14px; line-height: 1.3; }
    .slide-text   { font-size: 13px; line-height: 1.75; color: #333; margin-bottom: 20px; white-space: pre-wrap; }
    .slide-visual {
      background: ${SURFACE}; border-left: 3px solid ${ACCENT};
      padding: 10px 14px; border-radius: 0 6px 6px 0;
      display: flex; flex-direction: column; gap: 4px;
    }
    .visual-label { font-size: 10px; font-weight: 700; color: ${ACCENT}; }
    .visual-text  { font-size: 11px; color: #555; line-height: 1.5; }

    .caption-page { padding: 50px; }
    .section-title { font-size: 14px; font-weight: 700; color: ${ACCENT}; margin-bottom: 14px; }
    .caption-text  { font-size: 13px; line-height: 1.8; white-space: pre-wrap; color: #222; margin-bottom: 20px; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
    .tag {
      background: ${SURFACE}; border: 1px solid ${BORDER};
      padding: 3px 10px; border-radius: 20px;
      font-size: 11px; color: ${ACCENT};
    }
    .cta-box {
      background: ${SURFACE}; border: 1px solid ${BORDER};
      border-radius: 8px; padding: 14px 16px;
      font-size: 12px; color: #333;
    }
    .cta-box strong { color: ${ACCENT}; }
    .footer {
      margin-top: 40px; padding-top: 12px;
      border-top: 1px solid ${BORDER};
      font-size: 10px; color: #bbb; text-align: center;
    }
  </style>
</head>
<body>
  <div class="cover">
    <p class="cover-badge">Carrousel Instagram · Boss Beauty Studio</p>
    <h1 class="cover-title">${esc(result.titre)}</h1>
    <p class="cover-meta">
      <span class="cover-accent">${esc(params.specialite)}</span> · ${result.slides.length} slides
    </p>
  </div>

  ${slidesHTML}

  <div class="caption-page">
    <p class="section-title">📝 Caption Instagram</p>
    <p class="caption-text">${esc(result.caption)}</p>
    <div class="tags">${hashtagsHTML}</div>
    <div class="cta-box"><strong>CTA :</strong> ${esc(result.cta)}</div>
    <p class="footer">Généré par Boss Beauty Studio</p>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

// ── Export Post ───────────────────────────────────────────────────────────────

interface PostExportData {
  hook: string;
  caption: string;
  hashtags: string[];
  ideeStory: string;
  ideeReel?: string | null;
}

export function exportPostPDF(
  result: PostExportData,
  params: { typePost: string; specialite: string }
): void {
  const hashtagsHTML = result.hashtags
    .map((h) => `<span class="tag">${esc(h)}</span>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Post Instagram — ${esc(params.typePost)}</title>
  <style>
    ${BASE_STYLES}
    .page { padding: 50px; max-width: 680px; margin: 0 auto; }
    .header {
      padding-bottom: 20px; margin-bottom: 28px;
      border-bottom: 3px solid ${ACCENT};
    }
    .badge {
      font-size: 9px; text-transform: uppercase; letter-spacing: 2px;
      color: #999; margin-bottom: 10px;
    }
    .title { font-size: 20px; font-weight: 700; color: #111; }
    .meta  { font-size: 12px; color: #777; margin-top: 6px; }

    .section { margin-bottom: 28px; }
    .section-label {
      font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px;
      color: #aaa; font-weight: 700; margin-bottom: 8px;
    }
    .hook-box {
      background: ${SURFACE}; border-left: 4px solid ${ACCENT};
      padding: 14px 16px; border-radius: 0 8px 8px 0;
      font-size: 14px; font-weight: 600; line-height: 1.4; color: #111;
    }
    .caption-text { font-size: 13px; line-height: 1.85; color: #222; white-space: pre-wrap; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag {
      background: ${SURFACE}; border: 1px solid ${BORDER};
      padding: 3px 10px; border-radius: 20px;
      font-size: 11px; color: ${ACCENT};
    }
    .idea-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .idea-box {
      background: ${SURFACE}; border: 1px solid ${BORDER};
      border-radius: 8px; padding: 12px 14px;
    }
    .idea-box-label { font-size: 10px; font-weight: 700; color: ${ACCENT}; margin-bottom: 6px; }
    .idea-box-text  { font-size: 12px; color: #333; line-height: 1.5; }
    .footer {
      margin-top: 40px; padding-top: 12px;
      border-top: 1px solid ${BORDER};
      font-size: 10px; color: #bbb; text-align: center;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <p class="badge">Post Instagram · Boss Beauty Studio</p>
      <h1 class="title">${esc(params.typePost)}</h1>
      <p class="meta">${esc(params.specialite)}</p>
    </div>

    <div class="section">
      <p class="section-label">Première phrase</p>
      <div class="hook-box">${esc(result.hook)}</div>
    </div>

    <div class="section">
      <p class="section-label">Texte du post</p>
      <p class="caption-text">${esc(result.caption)}</p>
    </div>

    <div class="section">
      <p class="section-label">Hashtags</p>
      <div class="tags">${hashtagsHTML}</div>
    </div>

    <div class="section">
      <p class="section-label">Idées de réutilisation</p>
      <div class="idea-grid">
        <div class="idea-box">
          <p class="idea-box-label">📸 Story</p>
          <p class="idea-box-text">${esc(result.ideeStory)}</p>
        </div>
        ${result.ideeReel ? `
        <div class="idea-box">
          <p class="idea-box-label">🎬 Reel</p>
          <p class="idea-box-text">${esc(result.ideeReel)}</p>
        </div>` : ""}
      </div>
    </div>

    <p class="footer">Généré par Boss Beauty Studio</p>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

// ── Export Hooks ──────────────────────────────────────────────────────────────

interface HookItem {
  numero: number;
  hook: string;
  pourquoi: string;
  utilisation: string;
  reelIdee?: string | null;
}

export function exportHooksPDF(
  hooks: HookItem[],
  params: { specialite: string; typeContenu: string }
): void {
  const hooksHTML = hooks.map((h) => `
    <div class="hook-card">
      <div class="hook-header">
        <span class="hook-num">${h.numero}</span>
        <p class="hook-text">${esc(h.hook)}</p>
      </div>
      <p class="hook-why"><em>Pourquoi ça marche :</em> ${esc(h.pourquoi)}</p>
      <div class="hook-usage">
        <span class="usage-label">🎯 Comment l'utiliser</span>
        <span class="usage-text">${esc(h.utilisation)}</span>
      </div>
      ${h.reelIdee ? `<p class="reel-idea">🎬 <em>${esc(h.reelIdee)}</em></p>` : ""}
    </div>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Accroches Instagram — ${esc(params.specialite)}</title>
  <style>
    ${BASE_STYLES}
    .page { padding: 50px; }
    .header {
      padding-bottom: 20px; margin-bottom: 32px;
      border-bottom: 3px solid ${ACCENT};
    }
    .badge { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 10px; }
    .title { font-size: 20px; font-weight: 700; color: #111; }
    .meta  { font-size: 12px; color: #777; margin-top: 6px; }

    .hook-card {
      margin-bottom: 24px; padding: 18px 20px;
      border: 1px solid ${BORDER}; border-radius: 10px;
      page-break-inside: avoid;
    }
    .hook-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
    .hook-num {
      min-width: 26px; height: 26px; border-radius: 50%;
      background: ${ACCENT}; color: #fff;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px;
    }
    .hook-text  { font-size: 14px; font-weight: 600; color: #111; line-height: 1.4; }
    .hook-why   { font-size: 11px; color: #777; margin-bottom: 10px; line-height: 1.5; }
    .hook-usage {
      background: ${SURFACE}; border-radius: 6px; padding: 8px 12px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .usage-label { font-size: 10px; font-weight: 700; color: ${ACCENT}; }
    .usage-text  { font-size: 11px; color: #444; line-height: 1.5; }
    .reel-idea   { margin-top: 8px; font-size: 11px; color: #888; }
    .footer {
      margin-top: 32px; padding-top: 12px;
      border-top: 1px solid ${BORDER};
      font-size: 10px; color: #bbb; text-align: center;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <p class="badge">Accroches Instagram · Boss Beauty Studio</p>
      <h1 class="title">${hooks.length} accroches — ${esc(params.typeContenu)}</h1>
      <p class="meta">${esc(params.specialite)}</p>
    </div>
    ${hooksHTML}
    <p class="footer">Généré par Boss Beauty Studio</p>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

// ── Export Planning ───────────────────────────────────────────────────────────

interface PlanningPost {
  jour: number;
  jourNom: string;
  typeContenu: string;
  theme: string;
  description: string;
}

const FORMAT_COLORS: Record<string, string> = {
  Post:      ACCENT,
  Carrousel: "#6b9fd4",
  Reel:      "#9b7fd4",
  Story:     "#7fc9a0",
};

export function exportPlanningPDF(
  posts: PlanningPost[],
  params: { specialite: string; objectif: string; dateDebut: string }
): void {
  const rowsHTML = posts.map((post) => {
    const color = FORMAT_COLORS[post.typeContenu] ?? ACCENT;
    return `
      <tr>
        <td class="col-jour">${esc(post.jourNom)}</td>
        <td class="col-format">
          <span class="format-badge" style="background:${color}">${esc(post.typeContenu)}</span>
        </td>
        <td class="col-theme">${esc(post.theme)}</td>
        <td class="col-desc">${esc(post.description)}</td>
      </tr>
    `;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Planning semaine — ${esc(params.specialite)}</title>
  <style>
    ${BASE_STYLES}
    .page { padding: 50px; }
    .header {
      padding-bottom: 20px; margin-bottom: 28px;
      border-bottom: 3px solid ${ACCENT};
    }
    .badge { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 10px; }
    .title { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 8px; }
    .meta  { font-size: 12px; color: #777; }

    table { width: 100%; border-collapse: collapse; }
    thead tr { background: ${SURFACE}; }
    th {
      padding: 10px 12px; text-align: left;
      font-size: 9px; text-transform: uppercase; letter-spacing: 1px;
      color: #999; border-bottom: 2px solid ${BORDER};
    }
    td { padding: 12px; border-bottom: 1px solid ${BORDER}; vertical-align: top; }
    tr:last-child td { border-bottom: none; }

    .col-jour   { width: 80px; font-weight: 700; font-size: 12px; color: #111; white-space: nowrap; }
    .col-format { width: 90px; }
    .col-theme  { font-size: 12px; font-weight: 600; color: #111; }
    .col-desc   { font-size: 11px; color: #666; line-height: 1.5; }

    .format-badge {
      display: inline-block; padding: 3px 9px; border-radius: 20px;
      font-size: 10px; font-weight: 700; color: #fff;
    }
    .footer {
      margin-top: 32px; padding-top: 12px;
      border-top: 1px solid ${BORDER};
      font-size: 10px; color: #bbb; text-align: center;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <p class="badge">Planning de la semaine · Boss Beauty Studio</p>
      <h1 class="title">Semaine du ${esc(params.dateDebut)}</h1>
      <p class="meta">${esc(params.specialite)} · Objectif : ${esc(params.objectif)}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Jour</th>
          <th>Format</th>
          <th>Thème</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>${rowsHTML}</tbody>
    </table>

    <p class="footer">Généré par Boss Beauty Studio</p>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
