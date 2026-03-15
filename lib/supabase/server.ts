// ============================================================
// Client Supabase — Côté serveur (Server Components, API Routes)
// Utilise @supabase/ssr pour gérer les cookies Next.js correctement
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pour les Server Components et API Routes.
 * Lit et écrit les cookies de session via next/headers.
 *
 * Usage dans un Server Component :
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
  cookiesToSet: Array<{ name: string; value: string; options: any }>
) {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
      cookieStore.set(name, value, options);
    });
  } catch {
    // setAll peut échouer dans un Server Component read-only.
    // Ignoré car le middleware gère le rafraîchissement de session.
  }
}
      },
    }
  );
}

/**
 * Client Supabase avec la clé service_role.
 * ⚠️ Usage UNIQUEMENT dans les webhooks et les crons côté serveur.
 * Ne jamais exposer au client ni dans des Server Components classiques.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant"
    );
  }

  // Import direct pour le service client (pas de gestion de cookies)
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
