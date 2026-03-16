// ============================================================
// app/merci/page.tsx — Page de confirmation post-paiement
//
// Composant serveur. Ne fait AUCUNE activation de compte.
// Son seul rôle : rassurer et orienter selon l'état de l'utilisateur.
//
// Deux cas :
//   A) Utilisateur connecté → bouton "Accéder au dashboard"
//   B) Utilisateur non connecté → instructions pour créer le compte
//      avec l'email utilisé lors du paiement (récupéré via session_id)
// ============================================================

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { stripeRequest, type StripeCheckoutSession } from "@/lib/stripe";
import { MerciTracker } from "@/components/MerciTracker";

export const dynamic = "force-dynamic";

export default async function MerciPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id ?? null;

  // ── Récupérer l'état de connexion ────────────────────────────
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    // Non-bloquant
  }

  // ── Récupérer l'email depuis la session Stripe ───────────────
  // Uniquement si session_id présent et STRIPE_SECRET_KEY configuré.
  // Non-bloquant : si ça échoue, on affiche le message sans email.
  let customerEmail: string | null = null;
  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await stripeRequest<StripeCheckoutSession>(
        "GET",
        `/checkout/sessions/${sessionId}`,
        { expand: "customer_details" }
      );
      customerEmail = session.customer_details?.email ?? null;
    } catch {
      // Non-bloquant — la page reste fonctionnelle
    }
  }

  // ── Rendu ────────────────────────────────────────────────────
  return (
    <div
      style={{ backgroundColor: "var(--bg)", minHeight: "100dvh" }}
      className="flex items-center justify-center px-5 py-24"
    >
      <div
        className="w-full text-center"
        style={{ maxWidth: "520px" }}
      >
        {/* Icône de succès */}
        <div className="mb-6 text-5xl">🎉</div>

        {/* Titre */}
        <h1
          className="mb-3 text-2xl font-semibold leading-snug"
          style={{ color: "var(--text)" }}
        >
          Paiement confirmé.
          <br />
          Bienvenue dans Boss Beauty Studio !
        </h1>

        {/* Sous-titre */}
        <p
          className="mb-8 text-base leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Ton accès est en cours d&apos;activation. Ça prend quelques
          secondes.
        </p>

        {/* ── Cas A : utilisateur connecté ── */}
        {isLoggedIn ? (
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/dashboard"
              className="btn btn-primary"
              style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}
            >
              Accéder à mon dashboard →
            </Link>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Si ton accès n&apos;est pas encore actif, rafraîchis la page
              dans quelques secondes.
            </p>
          </div>
        ) : (
          /* ── Cas B : utilisateur non connecté ── */
          <div className="flex flex-col items-center gap-4">
            {/* Encadré instruction */}
            <div
              className="card w-full text-left"
              style={{ maxWidth: "420px" }}
            >
              <p
                className="mb-2 text-sm font-semibold"
                style={{ color: "var(--text)" }}
              >
                Dernière étape : crée ton compte
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {customerEmail ? (
                  <>
                    Utilise l&apos;adresse{" "}
                    <span
                      className="font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      {customerEmail}
                    </span>{" "}
                    pour créer ton compte — c&apos;est celle liée à ton
                    paiement. Ton accès sera activé automatiquement.
                  </>
                ) : (
                  <>
                    Crée ton compte avec l&apos;adresse email que tu as
                    utilisée lors du paiement. Ton accès sera activé
                    automatiquement.
                  </>
                )}
              </p>
            </div>

            {/* CTA inscription */}
            <Link
              href={
                customerEmail
                  ? `/login?email=${encodeURIComponent(customerEmail)}`
                  : "/login"
              }
              className="btn btn-primary"
              style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}
            >
              Créer mon compte →
            </Link>

            {/* Lien retour */}
            <Link
              href="/"
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              ← Retour à l&apos;accueil
            </Link>
          </div>
        )}

        {/* Signature de confiance */}
        <p
          className="mt-10 text-xs"
          style={{ color: "var(--text-muted)", opacity: 0.6 }}
        >
          ✨ Boss Beauty Studio · Paiement sécurisé par Stripe
        </p>
      </div>

      {/* PostHog — subscription_started */}
      <MerciTracker />
    </div>
  );
}
