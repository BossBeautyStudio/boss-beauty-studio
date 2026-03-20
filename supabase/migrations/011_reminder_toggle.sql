-- ============================================================
-- Migration 011 — Toggle rappels email
--
-- Ajoute reminders_enabled dans brand_profiles.
-- true  → l'utilisatrice reçoit un email de rappel la veille
--         de chaque entrée calendrier au statut "planifie".
-- false → aucun rappel envoyé.
-- ============================================================

ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN NOT NULL DEFAULT true;
