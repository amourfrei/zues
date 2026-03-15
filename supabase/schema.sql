-- ============================================================
-- 萌宝日记 (MengBao Diary) - Supabase Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- BABIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS babies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  birth_date DATE NOT NULL,
  birth_weight INTEGER NOT NULL, -- in grams
  birth_height DECIMAL(5,1) NOT NULL, -- in cm
  blood_type TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_babies_user_id ON babies(user_id);

-- Row Level Security
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own babies"
  ON babies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own babies"
  ON babies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own babies"
  ON babies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own babies"
  ON babies FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RECORDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'feeding', 'sleep', 'diaper', 'bath',
    'weight', 'height', 'temperature', 'jaundice',
    'medicine', 'note'
  )),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  data JSONB NOT NULL DEFAULT '{}',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_records_baby_id ON records(baby_id);
CREATE INDEX IF NOT EXISTS idx_records_started_at ON records(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_records_type ON records(type);
CREATE INDEX IF NOT EXISTS idx_records_baby_type ON records(baby_id, type);

-- Row Level Security (via baby ownership)
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view records of their babies"
  ON records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = records.baby_id
      AND babies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert records for their babies"
  ON records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = records.baby_id
      AND babies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update records of their babies"
  ON records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = records.baby_id
      AND babies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete records of their babies"
  ON records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = records.baby_id
      AND babies.user_id = auth.uid()
    )
  );

-- ============================================================
-- VACCINES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS vaccines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  scheduled_date DATE NOT NULL,
  administered_date DATE,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'overdue', 'skipped')),
  dose_number INTEGER DEFAULT 1,
  lot_number TEXT,
  administered_by TEXT,
  side_effects TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaccines_baby_id ON vaccines(baby_id);
CREATE INDEX IF NOT EXISTS idx_vaccines_scheduled_date ON vaccines(scheduled_date);

ALTER TABLE vaccines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage vaccines of their babies"
  ON vaccines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = vaccines.baby_id
      AND babies.user_id = auth.uid()
    )
  );

-- ============================================================
-- REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly')),
  summary TEXT NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]',
  suggestions JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_baby_id ON reports(baby_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage reports of their babies"
  ON reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = reports.baby_id
      AND babies.user_id = auth.uid()
    )
  );

-- ============================================================
-- FAMILY MEMBERS TABLE (for shared access)
-- ============================================================
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(baby_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_family_members_baby_id ON family_members(baby_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view family members of their babies"
  ON family_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = family_members.baby_id
      AND babies.user_id = auth.uid()
    )
  );

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_babies_updated_at
  BEFORE UPDATE ON babies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
