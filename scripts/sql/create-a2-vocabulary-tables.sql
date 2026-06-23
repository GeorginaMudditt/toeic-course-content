-- Create A2 vocabulary tables (mirrors A1 structure)
-- Run in Supabase SQL Editor before importing data

CREATE TABLE IF NOT EXISTS "Brizzle_A2_vocab" (
    "id" BIGSERIAL PRIMARY KEY,
    "word_english" TEXT NOT NULL,
    "translation_french" TEXT NOT NULL,
    "topic_page" TEXT NOT NULL,
    "pron_english" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Brizzle_A2_vocab_topic_page_idx"
ON "Brizzle_A2_vocab" ("topic_page");

CREATE TABLE IF NOT EXISTS "Brizzle_A2_icons" (
    "id" BIGSERIAL PRIMARY KEY,
    "topic_page" TEXT NOT NULL UNIQUE,
    "icon" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
