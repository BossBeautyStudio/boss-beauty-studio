"use client";

// ============================================================
// components/SupabaseErrorRedirect.tsx
//
// Composant invisible ajouté au layout racine.
//
// Problème : quand un magic link est expiré ou invalide,
// Supabase redirige vers la Site URL configurée (ex: "/") avec
// les paramètres d'erreur dans le query string ET le hash :
//   ?error=access_denied&error_code=otp_expired...
//   #error=access_denied&error_code=otp_expired...
//
// La landing page (Server Component) ne lit pas ces params.
// Ce composant les détecte côté client et redirige vers
// /login?error=link_expired — qui affiche le bon message
// et permet à l'utilisatrice de demander un nouveau lien.
//
// Rendu : rien (null). Pas d'impact visuel.
// ============================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SupabaseErrorRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Lire les params dans le query string ET dans le hash
    // Supabase les met parfois aux deux endroits simultanément
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const error = search.get("error") ?? hash.get("error");
    const errorCode = search.get("error_code") ?? hash.get("error_code");

    // Ne réagir QUE sur les erreurs Supabase auth connues.
    // Ceci évite les faux positifs sur des paramètres ?error= non liés
    // (ex : /?error=checkout généré par /api/checkout en cas d'échec Stripe).
    const isSupabaseAuthError =
      errorCode === "otp_expired" ||
      errorCode === "otp_disabled" ||
      // access_denied sans error_code peut venir d'autre chose — on l'accepte
      // uniquement quand error_code est aussi présent (double signal Supabase).
      (error === "access_denied" && Boolean(errorCode));

    if (!isSupabaseAuthError) return;

    // Mapping des codes Supabase → clés d'erreur de /login
    const isExpired =
      errorCode === "otp_expired" ||
      errorCode === "otp_disabled" ||
      error === "access_denied";

    const errorParam = isExpired ? "link_expired" : "auth_error";

    // Remplacer l'URL dans l'historique (pas de retour arrière vers la landing avec les params)
    router.replace(`/login?error=${errorParam}`);
  }, [router]);

  return null;
}
