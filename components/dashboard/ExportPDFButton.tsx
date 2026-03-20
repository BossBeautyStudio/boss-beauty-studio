"use client";

// ============================================================
// components/dashboard/ExportPDFButton.tsx
//
// Bouton générique d'export PDF — déclenche window.print()
// dans un nouvel onglet via lib/exportPDF.ts.
//
// Usage :
//   <ExportPDFButton onExport={() => exportCarouselPDF(result, params)} />
// ============================================================

interface ExportPDFButtonProps {
  onExport: () => void;
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function ExportPDFButton({
  onExport,
  label = "📄 Exporter PDF",
  style,
  className,
}: ExportPDFButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn-secondary ${className ?? ""}`.trim()}
      style={{ fontSize: "0.75rem", ...style }}
      onClick={onExport}
      title="Exporter en PDF (s'ouvre dans un nouvel onglet)"
    >
      {label}
    </button>
  );
}
