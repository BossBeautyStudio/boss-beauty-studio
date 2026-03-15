// ============================================================
// Client Supabase — Côté navigateur (Client Components)
// Instance singleton pour éviter de créer plusieurs clients
// ============================================================

import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pour les Client Components.
 * Utilise les variables d'env publiques (NEXT_PUBLIC_*).
 *
 * Usage dans un Client Component :
 *   const supabase = createClient()
 *   await supabase.auth.signInWithOtp({ email })
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
