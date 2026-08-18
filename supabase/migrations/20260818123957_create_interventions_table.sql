/*
# Create interventions table for ambulance simulation

1. New Tables
- `interventions`
  - `id` (uuid, primary key)
  - `case_id` (text, identifier of the scenario)
  - `case_title` (text, title of the scenario)
  - `patient_age` (int)
  - `patient_sex` (text, 'M' or 'F')
  - `chief_complaint` (text, motif de l'intervention)
  - `vitals` (jsonb, vital signs recorded during the simulation)
  - `assessment` (jsonb, bilan lésionnel and complementary data)
  - `call15` (jsonb, the SAMU call transmission content)
  - `score` (int, evaluation score)
  - `feedback` (jsonb, evaluation feedback per step)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `interventions`.
- Single-tenant app (no sign-in): allow anon + authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id text NOT NULL,
  case_title text NOT NULL,
  patient_age int,
  patient_sex text,
  chief_complaint text,
  vitals jsonb DEFAULT '{}'::jsonb,
  assessment jsonb DEFAULT '{}'::jsonb,
  call15 jsonb DEFAULT '{}'::jsonb,
  score int DEFAULT 0,
  feedback jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_interventions" ON interventions;
CREATE POLICY "anon_select_interventions" ON interventions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_interventions" ON interventions;
CREATE POLICY "anon_insert_interventions" ON interventions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_interventions" ON interventions;
CREATE POLICY "anon_update_interventions" ON interventions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_interventions" ON interventions;
CREATE POLICY "anon_delete_interventions" ON interventions FOR DELETE
  TO anon, authenticated USING (true);
