-- Marketing pronunciation short links (fb-wod-audio → brizzle-courses.com/audio/...)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "Brizzle_marketing_pronunciation" (
    "id" BIGSERIAL PRIMARY KEY,
    "posted_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "topic" TEXT NOT NULL DEFAULT '',
    "supabase_url" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Brizzle_marketing_pronunciation_posted_date_idx"
ON "Brizzle_marketing_pronunciation" ("posted_date" DESC);

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
