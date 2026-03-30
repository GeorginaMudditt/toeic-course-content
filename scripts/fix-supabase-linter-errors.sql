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

-- Enable RLS on Kids archive tables (external linter findings)
-- These may be created by other parts of your system; we guard with IF EXISTS.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND lower(table_name) = 'kids_courses_archive'
  ) THEN
    ALTER TABLE "public"."kids_courses_archive" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role can access all kids_courses_archive" ON "public"."kids_courses_archive";
    CREATE POLICY "Service role can access all kids_courses_archive"
      ON "public"."kids_courses_archive"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Anon cannot access kids_courses_archive" ON "public"."kids_courses_archive";
    CREATE POLICY "Anon cannot access kids_courses_archive"
      ON "public"."kids_courses_archive"
      FOR ALL
      TO anon
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND lower(table_name) = 'kids_course_registrations_archive'
  ) THEN
    ALTER TABLE "public"."kids_course_registrations_archive" ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role can access all kids_course_registrations_archive" ON "public"."kids_course_registrations_archive";
    CREATE POLICY "Service role can access all kids_course_registrations_archive"
      ON "public"."kids_course_registrations_archive"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Anon cannot access kids_course_registrations_archive" ON "public"."kids_course_registrations_archive";
    CREATE POLICY "Anon cannot access kids_course_registrations_archive"
      ON "public"."kids_course_registrations_archive"
      FOR ALL
      TO anon
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- Enable RLS on VocabularyProgress table
ALTER TABLE "public"."VocabularyProgress" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on CourseNote table
ALTER TABLE "public"."CourseNote" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on CourseNoteRevision table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND lower(table_name) = 'coursenoterevision'
  ) THEN
    ALTER TABLE "public"."CourseNoteRevision" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on StudentDocument table (if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND lower(table_name) = 'studentdocument'
  ) THEN
    ALTER TABLE "public"."StudentDocument" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

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

-- CourseNote table policies
DROP POLICY IF EXISTS "Service role can access all course notes" ON "public"."CourseNote";
CREATE POLICY "Service role can access all course notes"
  ON "public"."CourseNote"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon cannot access course notes" ON "public"."CourseNote";
CREATE POLICY "Anon cannot access course notes"
  ON "public"."CourseNote"
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- CourseNoteRevision table policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND lower(table_name) = 'coursenoterevision'
  ) THEN
    DROP POLICY IF EXISTS "Service role can access all course note revisions" ON "public"."CourseNoteRevision";
    CREATE POLICY "Service role can access all course note revisions"
      ON "public"."CourseNoteRevision"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Anon cannot access course note revisions" ON "public"."CourseNoteRevision";
    CREATE POLICY "Anon cannot access course note revisions"
      ON "public"."CourseNoteRevision"
      FOR ALL
      TO anon
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- StudentDocument table policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND lower(table_name) = 'studentdocument'
  ) THEN
    DROP POLICY IF EXISTS "Service role can access all student documents" ON "public"."StudentDocument";
    CREATE POLICY "Service role can access all student documents"
      ON "public"."StudentDocument"
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Anon cannot access student documents" ON "public"."StudentDocument";
    CREATE POLICY "Anon cannot access student documents"
      ON "public"."StudentDocument"
      FOR ALL
      TO anon
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

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

-- Fix check_sub_account_count and raw_sql (any signature - they may have parameters)
-- Uses dynamic SQL so it works regardless of function arguments
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname IN ('check_sub_account_count', 'raw_sql')
  LOOP
    IF r.args IS NULL OR r.args = '' THEN
      EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public, pg_temp', r.proname);
    ELSE
      EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp', r.proname, r.args);
    END IF;
  END LOOP;
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
    -- If this policy was already created in an earlier run, drop it too
    DROP POLICY IF EXISTS "Users can access own sub_accounts" ON "public"."sub_account";
    
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
