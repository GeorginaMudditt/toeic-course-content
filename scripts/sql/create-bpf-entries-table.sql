-- BPF (Bilan Pédagogique et Financier) NDA-covered training entries
-- Run in Supabase SQL Editor before using the admin BPF forms

CREATE TABLE IF NOT EXISTS "Brizzle_bpf_entries" (
    "id" BIGSERIAL PRIMARY KEY,
    "period_slug" TEXT NOT NULL,
    "student_name" TEXT NOT NULL,
    "stagiaire_category" TEXT NOT NULL,
    "course_name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "hours" NUMERIC(8, 2) NOT NULL,
    "modality" TEXT NOT NULL,
    "in_bpf_scope" BOOLEAN NOT NULL DEFAULT TRUE,
    "certification_type" TEXT NOT NULL DEFAULT 'none',
    "price_ht" NUMERIC(10, 2) NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "funding_source" TEXT NOT NULL,
    "funding_opco_name" TEXT,
    "contract_reference" TEXT,
    "trainer" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Brizzle_bpf_entries_period_slug_idx"
ON "Brizzle_bpf_entries" ("period_slug");

CREATE INDEX IF NOT EXISTS "Brizzle_bpf_entries_start_date_idx"
ON "Brizzle_bpf_entries" ("start_date" DESC);

ALTER TABLE "public"."Brizzle_bpf_entries" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can access all bpf entries" ON "public"."Brizzle_bpf_entries";
CREATE POLICY "Service role can access all bpf entries"
  ON "public"."Brizzle_bpf_entries"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon cannot access bpf entries" ON "public"."Brizzle_bpf_entries";
CREATE POLICY "Anon cannot access bpf entries"
  ON "public"."Brizzle_bpf_entries"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
