-- Create B1 vocabulary tables (mirrors A2 structure)
-- Run before importing data/b1-vocabulary-topics.json

CREATE TABLE IF NOT EXISTS "Brizzle_B1_vocab" (
    "id" BIGSERIAL PRIMARY KEY,
    "word_english" TEXT NOT NULL,
    "translation_french" TEXT NOT NULL,
    "topic_page" TEXT NOT NULL,
    "pron_english" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Brizzle_B1_vocab_topic_page_idx"
ON "Brizzle_B1_vocab" ("topic_page");

CREATE TABLE IF NOT EXISTS "Brizzle_B1_icons" (
    "id" BIGSERIAL PRIMARY KEY,
    "topic_page" TEXT NOT NULL UNIQUE,
    "icon" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
