// ============================================================
// Middleware Next.js — Protection des routes authentifiées
// Rafraîchit automatiquement la session Supabase à chaque requête
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes qui nécessitent une authentification.
// "/dashboard" couvre toutes les sous-routes /dashboard/* via startsWith.
// Les entrées suivantes sont listées explicitement pour la lisibilité,
// mais "/dashboard" seul suffit techniquement.
const PROTECTED_PATHS = [
  "/dashboard",
  "/dashboard/planning",
  "/dashboard/carousel",
  "/dashboard/dm",
  "/dashboard/history",
  "/dashboard/settings",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Fallback PKCE : Supabase redirige parfois le code vers le Site URL (/)
  // au lieu de /auth/callback. On le renvoie proprement vers le callback.
  if (pathname === "/" && request.nextUrl.searchParams.get("code")) {
    const code = request.nextUrl.searchParams.get("code")!;
    const callbackUrl = new URL("/auth/callback", request.nextUrl.origin);
    callbackUrl.searchParams.set("code", code);
    return NextResponse.redirect(callbackUrl);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
  cookiesToSet: Array<{ name: string; value: string; options?: any }>
) {
  cookiesToSet.forEach(({ name, value }) =>
    request.cookies.set(name, value)
  );

  supabaseResponse = NextResponse.next({ request });
  cookiesToSet.forEach(({ name, value, options }) =>
    supabaseResponse.cookies.set(name, value, options)
  );
}
      },
    }
  );

  // Rafraîchir la session — NE PAS supprimer cet appel
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Vérifier si la route est protégée
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  // Rediriger vers /login si non authentifié sur une route protégée
  if (isProtectedPath && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Rediriger vers /dashboard si déjà connecté et sur /login
  // On utilise une URL propre (sans les query params de /login) pour éviter
  // que ?error=auth_error ou ?redirectTo=... se retrouvent dans /dashboard
  if (pathname === "/login" && user) {
    const redirectUrl = new URL("/dashboard", request.nextUrl.origin);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Matcher : toutes les routes sauf les fichiers statiques et _next
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
