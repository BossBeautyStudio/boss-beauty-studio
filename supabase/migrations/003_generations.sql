-- ============================================================
-- Migration 003 — Table generations
-- Stocke l'historique de toutes les générations Claude
-- ============================================================

CREATE TABLE IF NOT EXISTS public.generations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL
                CHECK (type IN ('planning', 'carousel', 'dm', 'hooks')),
  inputs        JSONB NOT NULL,   -- inputs du formulaire
  output        JSONB NOT NULL,   -- output structuré de Claude
  canva_link    TEXT,             -- lien Canva éditabe (V1.1+, null en V1)
  tokens_used   INTEGER,          -- pour le monitoring des coûts
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index principal : user + date (liste de l'historique)
CREATE INDEX IF NOT EXISTS idx_generations_user_created
  ON public.generations(user_id, created_at DESC);

-- Index sur le type (filtrage par module dans l'historique)
CREATE INDEX IF NOT EXISTS idx_generations_type
  ON public.generations(type);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generations_select_own" ON public.generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "generations_insert_own" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pas de UPDATE ni DELETE en V1 (l'historique est en lecture seule)
-- On ajoutera un DELETE en V1.1 pour la fonctionnalité "Supprimer"

-- ============================================================
-- Vue utilitaire : résumé des générations par utilisateur
-- Utile pour les analytics futurs et le dashboard
-- ============================================================
CREATE OR REPLACE VIEW public.user_generation_stats AS
SELECT
  user_id,
  COUNT(*) AS total_generations,
  COUNT(*) FILTER (WHERE type = 'planning') AS total_planning,
  COUNT(*) FILTER (WHERE type = 'carousel') AS total_carousel,
  COUNT(*) FILTER (WHERE type = 'dm')       AS total_dm,
  COUNT(*) FILTER (WHERE type = 'hooks')    AS total_hooks,
  MAX(created_at) AS last_generation_at
FROM public.generations
GROUP BY user_id;
