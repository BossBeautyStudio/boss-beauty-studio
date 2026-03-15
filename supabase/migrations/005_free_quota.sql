-- ============================================================
-- Migration 005 — Free quota
--
-- Ajoute free_quota_used à public.users pour le système
-- de génération gratuite limitée (paywall Feature 3).
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS free_quota_used INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.users.free_quota_used IS
  'Nombre de générations gratuites consommées par un utilisateur sans abonnement actif. Plafond : 3.';
