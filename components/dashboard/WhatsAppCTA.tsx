"use client";

// ============================================================
// components/dashboard/WhatsAppCTA.tsx
//
// Bloc CTA WhatsApp affiché après chaque résultat généré.
// Propose une analyse personnalisée via WhatsApp — conversion
// vers consultation directe après l'expérience de génération.
//
// Affiché pour tous les utilisateurs (free + abonnés).
// ============================================================

const WA_URL = "https://wa.me/33767323995?text=ANALYSE";

// Icône WhatsApp inline (SVG officiel simplifié — pas de dépendance)
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export function WhatsAppCTA() {
  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 block overflow-hidden rounded-[14px] transition-opacity hover:opacity-95"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        textDecoration: "none",
      }}
    >
      {/* Bandeau vert signature WhatsApp */}
      <div className="h-1 w-full" style={{ backgroundColor: "#25D366" }} />

      <div className="flex items-start gap-4 px-5 py-4">
        {/* Icône */}
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: "#25D366" }}
        >
          <WhatsAppIcon size={18} />
        </div>

        {/* Texte */}
        <div className="flex-1 min-w-0">
          <p
            className="mb-1 text-sm font-semibold"
            style={{ color: "var(--text)" }}
          >
            Ton contenu est prêt ✨
          </p>
          <p
            className="mb-3 text-sm leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Tu veux aller plus loin avec une stratégie adaptée à ton activité
            et attirer plus de clientes ? Reçois ton analyse personnalisée
            directement sur WhatsApp.
          </p>
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white"
            style={{ backgroundColor: "#25D366" }}
          >
            <WhatsAppIcon size={14} />
            Recevoir mon analyse
          </span>
        </div>
      </div>
    </a>
  );
}
