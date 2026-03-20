// ============================================================
// app/(onboarding)/layout.tsx
//
// Layout minimal pour les pages d'onboarding — pas de sidebar.
// ============================================================

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
