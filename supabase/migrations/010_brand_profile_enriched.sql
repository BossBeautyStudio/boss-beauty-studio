-- ============================================================
-- Migration 010 — Enrichissement brand_profiles
--
-- Ajoute 4 champs supplémentaires au profil de marque :
--   instagram_handle  — ex : @beautyбysarah
--   ville             — ex : Lyon, Paris 11e
--   services          — services principaux séparés par virgule
--   prix_moyen        — fourchette tarifaire (Accessible / Standard / Premium / Luxe)
-- ============================================================

ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS instagram_handle  TEXT,
  ADD COLUMN IF NOT EXISTS ville             TEXT,
  ADD COLUMN IF NOT EXISTS services          TEXT,
  ADD COLUMN IF NOT EXISTS prix_moyen        TEXT;
