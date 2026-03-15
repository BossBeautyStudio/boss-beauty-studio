-- ============================================================
-- Migration 004 — Intégration Stripe
--
-- 1. Colonnes Stripe sur public.users
--      stripe_customer_id             TEXT UNIQUE
--      stripe_subscription_id         TEXT UNIQUE
--      subscription_current_period_end TIMESTAMPTZ
--
-- 2. Nouvelle table pending_activations
--      Utilisateurs qui ont payé avant de créer leur compte.
--      Consommée et purgée par le trigger handle_new_user
--      lors de l'inscription.
--
-- 3. Mise à jour du trigger handle_new_user
--      Vérifie pending_activations à l'inscription.
--      Si une activation est en attente pour cet email,
--      active immédiatement le compte et purge la ligne.
-- ============================================================

-- ── 1. Colonnes Stripe sur public.users ──────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id             TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id         TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Index pour les lookups webhook (customer_id → user)
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
  ON public.users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Index pour les lookups webhook (subscription_id → user)
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription
  ON public.users(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ── 2. Table pending_activations ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pending_activations (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                           TEXT        UNIQUE NOT NULL,   -- toujours en lowercase
  stripe_customer_id              TEXT        NOT NULL,
  stripe_subscription_id          TEXT,
  subscription_current_period_end TIMESTAMPTZ,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS activé — seul le service_role (webhooks) peut lire/écrire
ALTER TABLE public.pending_activations ENABLE ROW LEVEL SECURITY;

-- Aucune policy pour anon/authenticated : tout accès direct est bloqué.
-- Le service_role bypass le RLS par définition.

-- ── 3. Mise à jour trigger handle_new_user ────────────────────────────────────
--
-- Lorsqu'un utilisateur s'inscrit, on vérifie si son email
-- correspond à une activation Stripe en attente.
-- Si oui : activation immédiate + purge de pending_activations.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pending public.pending_activations%ROWTYPE;
BEGIN
  -- 1. Créer la ligne users (email normalisé en lowercase pour cohérence)
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, LOWER(TRIM(NEW.email)))
  ON CONFLICT (id) DO NOTHING;

  -- 2. Chercher une activation Stripe en attente pour cet email
  SELECT *
  INTO v_pending
  FROM public.pending_activations
  WHERE email = LOWER(TRIM(NEW.email));

  -- 3. Si trouvé → activer immédiatement
  IF FOUND THEN
    UPDATE public.users
    SET
      subscription_status                    = 'active',
      stripe_customer_id                     = v_pending.stripe_customer_id,
      stripe_subscription_id                 = v_pending.stripe_subscription_id,
      subscription_current_period_end        = v_pending.subscription_current_period_end,
      quota_monthly                          = 30
    WHERE id = NEW.id;

    -- Purger la ligne pending (consommée)
    DELETE FROM public.pending_activations
    WHERE email = LOWER(TRIM(NEW.email));
  END IF;

  RETURN NEW;
END;
$$;

-- Recréer le trigger (la fonction est remplacée, pas le trigger)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Variables d'environnement à ajouter dans .env.local :
--
--   STRIPE_SECRET_KEY=sk_live_...
--   STRIPE_PRICE_ID=price_...
--   STRIPE_WEBHOOK_SECRET=whsec_...
--   NEXT_PUBLIC_CHECKOUT_URL=/api/checkout
-- ============================================================
