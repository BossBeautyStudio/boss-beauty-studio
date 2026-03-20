-- ============================================================
-- Migration 013 : Programme de parrainage
--
-- Table referrals :
--   referrer_id → utilisatrice qui parraine
--   referee_id  → nouvelle utilisatrice parrainée (nullable avant inscription)
--   code        → code unique utilisé dans le lien (/login?ref=CODE)
--   status      → pending | registered | converted
--   rewarded    → true quand le mois offert a été accordé
--
-- Récompense stockée dans brand_profiles.referral_credit_months (INTEGER)
-- Décrémenté par le cron reset-quotas quand il accorde un mois gratuit.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  code         TEXT        NOT NULL UNIQUE,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'registered', 'converted')),
  rewarded     BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

-- Index pour lookup rapide par referrer
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals(referrer_id);
-- Index pour lookup rapide par code
CREATE INDEX IF NOT EXISTS referrals_code_idx ON public.referrals(code);

-- RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Lecture : chaque utilisatrice voit ses propres parrainages
CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Colonne crédit dans brand_profiles
ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS referral_credit_months INTEGER NOT NULL DEFAULT 0;
