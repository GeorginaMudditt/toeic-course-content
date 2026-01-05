-- Add avatar field to User table
-- Avatar can be either an image URL (from upload) or an emoji string

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar" TEXT;

COMMENT ON COLUMN "User"."avatar" IS 'Avatar: image URL or emoji string';
