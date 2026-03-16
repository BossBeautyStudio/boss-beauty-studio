-- ============================================================
-- Script : apply_pending_migrations.sql
--
-- Applique toutes les migrations non encore exécutées en base.
-- Chaque opération est IDEMPOTENTE (ADD COLUMN IF NOT EXISTS,
-- CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE, etc.).
-- Tu peux relancer ce script sans risque même si certaines
-- migrations ont déjà été appliquées.
--
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ============================================================
-- MIGRATION 002 — Table user_profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_name     TEXT,
  activity          TEXT,
  city              TEXT,
  positioning       TEXT,
  default_tone      TEXT,
  instagram_handle  TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY "profiles_select_own" ON public.user_profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY "profiles_insert_own" ON public.user_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY "profiles_update_own" ON public.user_profiles
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

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


-- ============================================================
-- MIGRATION 003 — Table generations
-- ============================================================

CREATE TABLE IF NOT EXISTS public.generations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  inputs        JSONB NOT NULL,
  output        JSONB NOT NULL,
  canva_link    TEXT,
  tokens_used   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generations_user_created
  ON public.generations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generations_type
  ON public.generations(type);

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generations' AND policyname = 'generations_select_own'
  ) THEN
    CREATE POLICY "generations_select_own" ON public.generations
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generations' AND policyname = 'generations_insert_own'
  ) THEN
    CREATE POLICY "generations_insert_own" ON public.generations
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- MIGRATION 004 — Colonnes Stripe + table pending_activations
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id              TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id          TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
  ON public.users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription
  ON public.users(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.pending_activations (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                           TEXT        UNIQUE NOT NULL,
  stripe_customer_id              TEXT        NOT NULL,
  stripe_subscription_id          TEXT,
  subscription_current_period_end TIMESTAMPTZ,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pending_activations ENABLE ROW LEVEL SECURITY;

-- Mise à jour du trigger handle_new_user (vérifie pending_activations à l'inscription)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pending public.pending_activations%ROWTYPE;
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, LOWER(TRIM(NEW.email)))
  ON CONFLICT (id) DO NOTHING;

  SELECT *
  INTO v_pending
  FROM public.pending_activations
  WHERE email = LOWER(TRIM(NEW.email));

  IF FOUND THEN
    UPDATE public.users
    SET
      subscription_status                    = 'active',
      stripe_customer_id                     = v_pending.stripe_customer_id,
      stripe_subscription_id                 = v_pending.stripe_subscription_id,
      subscription_current_period_end        = v_pending.subscription_current_period_end,
      quota_monthly                          = 30
    WHERE id = NEW.id;

    DELETE FROM public.pending_activations
    WHERE email = LOWER(TRIM(NEW.email));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- MIGRATION 005 — Colonne free_quota_used  ← FIX DU BUG
-- C'est la colonne manquante qui causait l'erreur 500.
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS free_quota_used INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.users.free_quota_used IS
  'Nombre de générations gratuites consommées par un utilisateur sans abonnement actif. Plafond : 3.';


-- ============================================================
-- MIGRATION 006 — Contrainte CHECK + vue stats pour le type post
-- ============================================================

-- Contrainte CHECK : ajouter 'post' aux types autorisés
ALTER TABLE public.generations
  DROP CONSTRAINT IF EXISTS generations_type_check;

ALTER TABLE public.generations
  ADD CONSTRAINT generations_type_check
  CHECK (type IN ('planning', 'carousel', 'dm', 'hooks', 'post'));

-- Vue de stats mise à jour (inclut les posts)
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


-- ============================================================
-- Vérification finale (optionnelle) — colle dans une 2e query
-- pour confirmer que la colonne existe bien après migration :
--
--   SELECT column_name, data_type, column_default
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name   = 'users'
--   ORDER BY ordinal_position;
-- ============================================================
