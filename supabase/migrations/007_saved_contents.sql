-- ============================================================
-- Migration 007 — Bibliothèque de contenu
--
-- Crée la table saved_contents pour stocker les contenus
-- explicitement sauvegardés par l'utilisatrice depuis les
-- modules Post, Carrousel, Hooks et DM.
--
-- Séparée de la table generations (historique automatique) :
-- seul le contenu volontairement sauvegardé apparaît ici.
-- ============================================================

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.saved_contents (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module      TEXT          NOT NULL CHECK (module IN ('post', 'carousel', 'hooks', 'dm')),
  title       TEXT          NOT NULL,
  content     JSONB         NOT NULL,
  params      JSONB,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index pour accélérer les lectures par user
CREATE INDEX IF NOT EXISTS saved_contents_user_id_idx
  ON public.saved_contents (user_id, created_at DESC);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.saved_contents ENABLE ROW LEVEL SECURITY;

-- Chaque utilisatrice ne voit que ses propres contenus
CREATE POLICY "saved_contents_select_own"
  ON public.saved_contents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Chaque utilisatrice ne peut insérer que pour elle-même
CREATE POLICY "saved_contents_insert_own"
  ON public.saved_contents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chaque utilisatrice ne peut supprimer que ses propres contenus
CREATE POLICY "saved_contents_delete_own"
  ON public.saved_contents
  FOR DELETE
  USING (auth.uid() = user_id);
