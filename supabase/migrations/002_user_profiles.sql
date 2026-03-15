-- ============================================================
-- Migration 002 — Table user_profiles
-- Profil business de l'utilisatrice (activité, ville, ton, etc.)
-- Une seule ligne par utilisateur (relation 1-1)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_name     TEXT,
  activity          TEXT,       -- ex: 'cils', 'microblading', 'hydrafacial', etc.
  city              TEXT,
  positioning       TEXT,       -- ex: 'premium', 'accessible', 'expert'
  default_tone      TEXT,       -- ex: 'glamour', 'expert', 'bienveillant'
  instagram_handle  TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)   -- une seule ligne par utilisateur
);

-- Index sur user_id (requête fréquente)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- Trigger : mettre à jour updated_at automatiquement
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
