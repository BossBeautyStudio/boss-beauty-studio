-- ============================================================
-- Migration 006 — Ajouter le type 'post' dans la table generations
--
-- Cause du bug historique :
--   La contrainte CHECK de la migration 003 n'autorise que
--   ('planning', 'carousel', 'dm', 'hooks').
--   Quand saveGeneration({ type: "post" }) est appelé, Supabase
--   retourne une violation de contrainte. L'erreur est attrapée
--   silencieusement (best-effort), le post n'est jamais enregistré.
--
-- Correction :
--   1. Supprimer l'ancienne contrainte CHECK.
--   2. Recréer la contrainte en ajoutant 'post'.
--   3. Mettre à jour la vue user_generation_stats pour inclure
--      les posts dans les statistiques.
-- ============================================================

-- 1. Supprimer l'ancienne contrainte CHECK
--    Le nom généré automatiquement par PostgreSQL pour un CHECK inline
--    dans CREATE TABLE est : {table}_{colonne}_check
ALTER TABLE public.generations
  DROP CONSTRAINT IF EXISTS generations_type_check;

-- 2. Recréer la contrainte avec 'post' inclus
ALTER TABLE public.generations
  ADD CONSTRAINT generations_type_check
  CHECK (type IN ('planning', 'carousel', 'dm', 'hooks', 'post'));

-- 3. Mettre à jour la vue de stats pour inclure les posts
CREATE OR REPLACE VIEW public.user_generation_stats AS
SELECT
  user_id,
  COUNT(*)                                          AS total_generations,
  COUNT(*) FILTER (WHERE type = 'planning')         AS total_planning,
  COUNT(*) FILTER (WHERE type = 'carousel')         AS total_carousel,
  COUNT(*) FILTER (WHERE type = 'dm')               AS total_dm,
  COUNT(*) FILTER (WHERE type = 'hooks')            AS total_hooks,
  COUNT(*) FILTER (WHERE type = 'post')             AS total_post,
  MAX(created_at)                                   AS last_generation_at
FROM public.generations
GROUP BY user_id;
