-- ============================================================
-- Migration 001 — Table users
-- Étend les utilisateurs créés par Supabase Auth
-- ============================================================

-- La table users étend auth.users avec les données métier
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email               TEXT UNIQUE NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'inactive'
                      CHECK (subscription_status IN ('active', 'inactive', 'trial', 'cancelled')),
  plan                TEXT NOT NULL DEFAULT 'starter'
                      CHECK (plan IN ('starter', 'pro')),
  quota_monthly       INTEGER NOT NULL DEFAULT 30,
  quota_used          INTEGER NOT NULL DEFAULT 0,
  quota_reset_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  systeme_order_id    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index sur email pour les lookups webhook
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Index pour le cron de reset des quotas
CREATE INDEX IF NOT EXISTS idx_users_quota_reset ON public.users(quota_reset_at)
  WHERE subscription_status = 'active';

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur ne voit et ne modifie que ses propres données
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Insert : autorisé uniquement lors de la création du compte
-- (via trigger ci-dessous ou via service_role)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- Trigger : créer automatiquement un enregistrement users
-- dès qu'un utilisateur s'inscrit via Supabase Auth
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Note : la clé service_role (utilisée dans les webhooks)
-- bypass automatiquement le RLS — pas besoin de policy supplémentaire
-- ============================================================
