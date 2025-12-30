-- Migration script to change difficulty column to level
-- Run this if you have existing data with difficulty values

-- First, add the new level column
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "level" TEXT;

-- If you want to migrate existing difficulty values to level (optional):
-- You can map: 1->A1, 2->A2, 3->B1, 4->B2, 5->C1 (or adjust as needed)
-- UPDATE "Resource" SET "level" = CASE 
--   WHEN "difficulty" = 1 THEN 'A1'
--   WHEN "difficulty" = 2 THEN 'A2'
--   WHEN "difficulty" = 3 THEN 'B1'
--   WHEN "difficulty" = 4 THEN 'B2'
--   WHEN "difficulty" = 5 THEN 'C1'
--   ELSE NULL
-- END WHERE "difficulty" IS NOT NULL;

-- Drop the old difficulty column
ALTER TABLE "Resource" DROP COLUMN IF EXISTS "difficulty";

