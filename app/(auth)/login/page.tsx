"use client";

// ============================================================
// Page Login — Magic Link Supabase
// Client Component : gère le formulaire et les états UI
// ============================================================

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// États possibles de la page
type PageState = "idle" | "loading" | "sent" | "error";

// Messages d'erreur correspondant aux ?error= renvoyés par /auth/callback
const URL_ERROR_MESSAGES: Record<string, string> = {
  link_expired:
    "Ce lien de connexion a expiré ou a déjà été utilisé. Entre ton email pour en recevoir un nouveau.",
  auth_error:
    "Une erreur s'est produite lors de la connexion. Réessaie.",
  missing_code:
    "Lien de connexion invalide. Entre ton email pour en recevoir un nouveau.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pageState, setPageState] = useState<PageState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  // Erreur provenant de l'URL (?error=link_expired, etc.)
  const [urlError, setUrlError] = useState("");

  const supabase = createClient();

  // Lire le ?error= dans l'URL au montage (après redirect depuis /auth/callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err && URL_ERROR_MESSAGES[err]) {
      setUrlError(URL_ERROR_MESSAGES[err]);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validation locale minimale
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMessage("Saisis une adresse email valide.");
      setPageState("error");
      return;
    }

    setPageState("loading");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        // L'URL de callback où Supabase redirige après clic sur le lien
        // En dev : http://localhost:3000/auth/callback
        // En prod : à définir dans Supabase → Auth → URL Configuration
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      // Rate limit : Supabase limite à 3 envois / heure par email
      if (error.message.includes("rate limit")) {
        setErrorMessage(
          "Trop de tentatives. Attends quelques minutes avant de réessayer."
        );
      } else {
        setErrorMessage(
          "Une erreur est survenue. Vérifie ton email et réessaie."
        );
      }
      setPageState("error");
      return;
    }

    setPageState("sent");
  }

  function handleReset() {
    setPageState("idle");
    setErrorMessage("");
    // On garde l'email pré-rempli pour faciliter une nouvelle tentative
  }

  // ──────────────────────────────────────────────────────────
  // Vue : email envoyé avec succès
  // ──────────────────────────────────────────────────────────
  if (pageState === "sent") {
    return (
      <LoginLayout>
        <div className="fade-in text-center">
          {/* Icône envelope */}
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--surface-alt)" }}
          >
            <svg
              className="h-8 w-8"
              style={{ color: "var(--accent)" }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>

          <h2 className="mb-2 text-xl font-bold" style={{ color: "var(--text)" }}>
            Vérifie ta boîte mail
          </h2>
          <p className="mb-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Un lien de connexion a été envoyé à
          </p>
          <p className="mb-6 font-semibold" style={{ color: "var(--text)" }}>
            {email.trim()}
          </p>

          <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
            Clique sur le lien dans l&apos;email pour te connecter.
            <br />
            Le lien expire dans 1 heure.
          </p>

          {/* Permettre de renvoyer si besoin */}
          <button
            onClick={handleReset}
            className="text-sm underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            Renvoyer ou changer d&apos;adresse
          </button>
        </div>
      </LoginLayout>
    );
  }

  // ──────────────────────────────────────────────────────────
  // Vue : formulaire (idle + error + loading)
  // ──────────────────────────────────────────────────────────
  return (
    <LoginLayout>
      <div className="fade-in">
        {/* Banner d'erreur provenant du callback (/auth/callback → ?error=...) */}
        {urlError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <p className="text-xs leading-relaxed text-amber-700">{urlError}</p>
          </div>
        )}

        <h2 className="mb-1 text-center text-xl font-bold" style={{ color: "var(--text)" }}>
          Connexion
        </h2>
        <p className="mb-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          On t&apos;envoie un lien magique par email — pas de mot de passe.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Champ email */}
          <div className="field">
            <label className="label" htmlFor="email">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                // Effacer l'erreur dès que l'utilisatrice retape
                if (pageState === "error") {
                  setPageState("idle");
                  setErrorMessage("");
                }
              }}
              placeholder="ton@email.com"
              className="input"
              style={
                pageState === "error"
                  ? { borderColor: "#cc4444", backgroundColor: "var(--surface-alt)" }
                  : {}
              }
              disabled={pageState === "loading"}
              required
            />

            {/* Message d'erreur inline */}
            {pageState === "error" && errorMessage && (
              <p className="mt-2 text-xs" style={{ color: "#cc4444" }}>
                {errorMessage}
              </p>
            )}
          </div>

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={pageState === "loading" || !email.trim()}
            className="btn btn-primary w-full"
            style={
              pageState === "loading" || !email.trim()
                ? { opacity: 0.5, cursor: "not-allowed" }
                : {}
            }
          >
            {pageState === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Envoi en cours…
              </span>
            ) : (
              "Recevoir mon lien de connexion"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Pas encore de compte ?{" "}
          <a
            href={process.env.NEXT_PUBLIC_SYSTEME_CHECKOUT_URL ?? "#"}
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: "var(--text)" }}
          >
            Découvrir Boss Beauty Studio
          </a>
        </p>
      </div>
    </LoginLayout>
  );
}

// ──────────────────────────────────────────────────────────
// Layout partagé de la page auth
// Centré, fond design system, logo en haut
// ──────────────────────────────────────────────────────────
function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <Image
          src="/logo.png"
          alt="Boss Beauty Studio"
          width={180}
          height={49}
          priority
          className="object-contain"
        />
      </div>

      {/* Card */}
      <div className="card w-full max-w-sm p-8">
        {children}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Spinner inline (pas de dépendance externe)
// ──────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white"
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
  );
}
