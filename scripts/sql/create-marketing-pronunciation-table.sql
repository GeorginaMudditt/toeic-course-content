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
