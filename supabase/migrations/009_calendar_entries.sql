-- ============================================================
-- 009_calendar_entries.sql
--
-- Table : calendar_entries
-- Entrées du calendrier éditorial.
-- Une entrée = un contenu planifié sur une date précise.
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_entries (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date            DATE        NOT NULL,
  title           TEXT        NOT NULL,
  module          TEXT        NOT NULL CHECK (module IN ('post', 'carousel', 'story', 'reel', 'dm', 'hooks')),
  status          TEXT        NOT NULL DEFAULT 'idee' CHECK (status IN ('idee', 'planifie', 'publie')),
  note            TEXT,
  saved_content_id UUID       REFERENCES saved_contents(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour accès rapide par user + mois
CREATE INDEX IF NOT EXISTS calendar_entries_user_date_idx
  ON calendar_entries(user_id, date DESC);

-- Row Level Security
ALTER TABLE calendar_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar entries"
  ON calendar_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar entries"
  ON calendar_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar entries"
  ON calendar_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar entries"
  ON calendar_entries FOR DELETE
  USING (auth.uid() = user_id);
