"use client";

// ============================================================
// Page Auth Callback — Client Component
//
// Pourquoi client et non route.ts ?
//
// Le PKCE code verifier est stocké par createBrowserClient()
// dans document.cookie au moment de signInWithOtp().
// exchangeCodeForSession() DOIT être appelé par ce même client
// navigateur pour lire le verifier depuis son propre storage.
//
// Un Route Handler serveur lit request.cookies, qui peut ne pas
// contenir le verifier (cross-origin redirect depuis supabase.co).
// Le Client Component lit document.cookie directement → fiable.
//
// Flux :
//   1. /login → signInWithOtp → verifier dans document.cookie
//   2. Magic link → /auth/callback?code=xxx
//   3. useEffect → createBrowserClient().exchangeCodeForSession(code)
//   4. Verifier trouvé dans document.cookie → échange OK
//   5. Session stockée en cookies → redirect /dashboard
// ============================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import posthog from "posthog-js";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    // ── Cas 1 : erreur Supabase dans le hash ──────────────────
    // Ex : #error=access_denied&error_code=otp_expired
    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const hashError = hashParams.get("error");
    const hashErrorCode = hashParams.get("error_code");

    if (hashError) {
      const msg =
        hashErrorCode === "otp_expired" || hashError === "access_denied"
          ? "link_expired"
          : "auth_error";
      router.replace(`/login?error=${msg}`);
      return;
    }

    // ── Cas 2 : pas de code dans l'URL ────────────────────────
    if (!code) {
      router.replace("/login?error=missing_code");
      return;
    }

    // ── Cas 3 : code présent → échange PKCE côté navigateur ──
    // createBrowserClient lit le verifier depuis document.cookie
    // (même storage que signInWithOtp, même session navigateur)
    const safeNext =
      next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ data, error }) => {
        if (error) {
          console.error(
            "[auth/callback] exchangeCodeForSession error:",
            error.message
          );
          const errorParam =
            error.message.includes("expired") ||
            error.message.includes("invalid")
              ? "link_expired"
              : "auth_error";
          router.replace(`/login?error=${errorParam}`);
        } else {
          // ── PostHog : détecter un nouvel utilisateur ──────────
          // created_at < 30s → premier magic link → signup réel
          if (data?.user) {
            const createdAt = new Date(data.user.created_at).getTime();
            const isNewUser = Date.now() - createdAt < 30_000;
            if (isNewUser) {
              posthog.capture("user_signup", {
                email: data.user.email,
              });
            }
          }
          // Session stockée en cookies par createBrowserClient
          // → lisible par createServerClient dans les Server Components
          router.replace(safeNext);
        }
      });
  }, [router]);

  // Écran de transition — visible ~200ms
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C9748F]">
          <svg
            className="h-5 w-5 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-400">Connexion en cours…</p>
      </div>
    </div>
  );
}
