// ============================================================
// lib/copy.ts — Helper clipboard
// ============================================================

export function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
}
