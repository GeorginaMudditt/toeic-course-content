-- Fix Supabase linter: rls_disabled_in_public
-- Run in Supabase SQL Editor
--
-- Brizzle_bpf_entries and Brizzle_marketing_pronunciation are accessed only via
-- Next.js API routes / server components using the service_role key. Block anon
-- direct PostgREST access; service_role bypasses RLS but policies are explicit.

-- ============================================================================
-- Brizzle_bpf_entries
-- ============================================================================

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

-- ============================================================================
-- Brizzle_marketing_pronunciation
-- ============================================================================

ALTER TABLE "public"."Brizzle_marketing_pronunciation" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can access all marketing pronunciation" ON "public"."Brizzle_marketing_pronunciation";
CREATE POLICY "Service role can access all marketing pronunciation"
  ON "public"."Brizzle_marketing_pronunciation"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon cannot access marketing pronunciation" ON "public"."Brizzle_marketing_pronunciation";
CREATE POLICY "Anon cannot access marketing pronunciation"
  ON "public"."Brizzle_marketing_pronunciation"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Verification (optional):
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('Brizzle_bpf_entries', 'Brizzle_marketing_pronunciation');
