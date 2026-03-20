-- ============================================================
-- Migration 012 — Suivi de la séquence email d'activation
--
-- Table activation_emails_sent :
--   Enregistre quel email a été envoyé à quel utilisateur.
--   step : 1 = J+1 · 2 = J+3 · 3 = J+7
--
-- Contrainte UNIQUE (user_id, step) → on n'envoie jamais
-- deux fois le même email au même utilisateur.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activation_emails_sent (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  step       INTEGER     NOT NULL CHECK (step IN (1, 2, 3)),
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, step)
);

CREATE INDEX IF NOT EXISTS activation_emails_user_idx
  ON public.activation_emails_sent(user_id);

-- Pas de RLS — lecture/écriture via service client uniquement
