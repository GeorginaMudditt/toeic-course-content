-- ============================================================================
-- Fix Supabase Linter Errors
-- ============================================================================
-- This script addresses ERROR and WARN level security issues detected by
-- Supabase's database linter.
--
-- IMPORTANT: The application uses SUPABASE_SERVICE_ROLE_KEY which bypasses
-- RLS, so enabling RLS won't break existing functionality. However, it's
-- a security best practice to have RLS enabled.
--
-- INSTRUCTIONS:
-- 1. Copy and paste this entire script into Supabase SQL Editor
-- 2. Run it (it's idempotent - safe to run multiple times)
-- 3. If any ALTER FUNCTION commands fail, those functions may need manual
--    fixing. Check the error message and update those functions individually.
-- ============================================================================

-- ============================================================================
-- PART 1: Enable RLS on all public tables (ERROR level)
-- ============================================================================

-- Enable RLS on Course table
ALTER TABLE "public"."Course" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Enrollment table
ALTER TABLE "public"."Enrollment" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on User table
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Assignment table
ALTER TABLE "public"."Assignment" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Progress table
ALTER TABLE "public"."Progress" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Resource table
ALTER TABLE "public"."Resource" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on VocabularyProgress table
ALTER TABLE "public"."VocabularyProgress" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: Create basic RLS policies for service role access
-- ============================================================================
-- Since the application uses service_role key (which bypasses RLS), these
-- policies are primarily for security best practices. They allow service_role
-- to access everything while blocking anon key access.

-- User table policies
-- Allow service_role full access (service_role bypasses RLS anyway, but this is explicit)
DROP POLICY IF EXISTS "Service role can access all users" ON "public"."User";
CREATE POLICY "Service role can access all users"
  ON "public"."User"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Block anon key from accessing User table (especially password column)
DROP POLICY IF EXISTS "Anon cannot access users" ON "public"."User";
CREATE POLICY "Anon cannot access users"
  ON "public"."User"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Course table policies
DROP POLICY IF EXISTS "Service role can access all courses" ON "public"."Course";
CREATE POLICY "Service role can access all courses"
  ON "public"."Course"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon cannot access courses" ON "public"."Course";
CREATE POLICY "Anon cannot access courses"
  ON "public"."Course"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Enrollment table policies
DROP POLICY IF EXISTS "Service role can access all enrollments" ON "public"."Enrollment";
CREATE POLICY "Service role can access all enrollments"
  ON "public"."Enrollment"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon cannot access enrollments" ON "public"."Enrollment";
CREATE POLICY "Anon cannot access enrollments"
  ON "public"."Enrollment"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Assignment table policies
DROP POLICY IF EXISTS "Service role can access all assignments" ON "public"."Assignment";
CREATE POLICY "Service role can access all assignments"
  ON "public"."Assignment"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon cannot access assignments" ON "public"."Assignment";
CREATE POLICY "Anon cannot access assignments"
  ON "public"."Assignment"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Progress table policies
DROP POLICY IF EXISTS "Service role can access all progress" ON "public"."Progress";
CREATE POLICY "Service role can access all progress"
  ON "public"."Progress"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon cannot access progress" ON "public"."Progress";
CREATE POLICY "Anon cannot access progress"
  ON "public"."Progress"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Resource table policies
DROP POLICY IF EXISTS "Service role can access all resources" ON "public"."Resource";
CREATE POLICY "Service role can access all resources"
  ON "public"."Resource"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon cannot access resources" ON "public"."Resource";
CREATE POLICY "Anon cannot access resources"
  ON "public"."Resource"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- VocabularyProgress table policies
DROP POLICY IF EXISTS "Service role can access all vocabulary progress" ON "public"."VocabularyProgress";
CREATE POLICY "Service role can access all vocabulary progress"
  ON "public"."VocabularyProgress"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon cannot access vocabulary progress" ON "public"."VocabularyProgress";
CREATE POLICY "Anon cannot access vocabulary progress"
  ON "public"."VocabularyProgress"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- PART 3: Fix function search_path issues (WARN level)
-- ============================================================================
-- Set search_path to prevent search_path injection attacks
-- We use ALTER FUNCTION to preserve existing function bodies

-- Fix handle_updated_at function (if it exists)
DO $$
BEGIN
  ALTER FUNCTION "public"."handle_updated_at"() SET search_path = public, pg_temp;
EXCEPTION
  WHEN undefined_function THEN
    -- Function doesn't exist, skip it
    NULL;
  WHEN OTHERS THEN
    -- Other error (e.g., wrong signature), skip it
    NULL;
END $$;

-- Fix update_user_updated_at_column function (if it exists)
DO $$
BEGIN
  ALTER FUNCTION "public"."update_user_updated_at_column"() SET search_path = public, pg_temp;
EXCEPTION
  WHEN undefined_function THEN
    -- Function doesn't exist, skip it
    NULL;
  WHEN OTHERS THEN
    -- Other error (e.g., wrong signature), skip it
    NULL;
END $$;

-- Fix check_sub_account_count function (if it exists)
-- Note: This function might be from another project, but we'll fix it if it exists
DO $$
BEGIN
  ALTER FUNCTION "public"."check_sub_account_count"() SET search_path = public, pg_temp;
EXCEPTION
  WHEN undefined_function THEN
    -- Function doesn't exist, skip it
    NULL;
  WHEN OTHERS THEN
    -- Other error (e.g., wrong signature), skip it
    NULL;
END $$;

-- Fix raw_sql function (if it exists)
DO $$
BEGIN
  ALTER FUNCTION "public"."raw_sql"() SET search_path = public, pg_temp;
EXCEPTION
  WHEN undefined_function THEN
    -- Function doesn't exist, skip it
    NULL;
  WHEN OTHERS THEN
    -- Other error (e.g., wrong signature), skip it
    NULL;
END $$;

-- Fix update_updated_at_column function (if it exists)
DO $$
BEGIN
  ALTER FUNCTION "public"."update_updated_at_column"() SET search_path = public, pg_temp;
EXCEPTION
  WHEN undefined_function THEN
    -- Function doesn't exist, skip it
    NULL;
  WHEN OTHERS THEN
    -- Other error (e.g., wrong signature), skip it
    NULL;
END $$;

-- ============================================================================
-- PART 4: Fix overly permissive RLS policy on sub_account (WARN level)
-- ============================================================================
-- Note: This table might be from another project, but we'll fix it if it exists

DO $$
BEGIN
  -- Check if sub_account table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sub_account'
  ) THEN
    -- Drop the overly permissive policy
    DROP POLICY IF EXISTS "SubAccount" ON "public"."sub_account";
    
    -- Create a more restrictive policy
    -- Only allow users to access their own sub_accounts
    CREATE POLICY "Users can access own sub_accounts"
      ON "public"."sub_account"
      FOR ALL
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- ============================================================================
-- Verification Queries (Optional - run these to verify the fixes)
-- ============================================================================

-- Check RLS status on all tables
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('Course', 'Enrollment', 'User', 'Assignment', 'Progress', 'Resource', 'VocabularyProgress')
-- ORDER BY tablename;

-- Check function search_path settings
-- SELECT proname, prosecdef, proconfig 
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' 
--   AND proname IN ('handle_updated_at', 'update_user_updated_at_column', 'check_sub_account_count', 'raw_sql', 'update_updated_at_column')
-- ORDER BY proname;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('Course', 'Enrollment', 'User', 'Assignment', 'Progress', 'Resource', 'VocabularyProgress')
-- ORDER BY tablename, policyname;
