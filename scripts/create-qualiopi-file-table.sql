-- Run in Supabase SQL editor to enable Qualiopi PDF uploads.

CREATE TABLE IF NOT EXISTS "public"."QualiopiFile" (
  "id" TEXT NOT NULL,
  "indicatorSlug" TEXT NOT NULL,
  "folderSlug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" TEXT,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QualiopiFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "QualiopiFile_indicatorSlug_folderSlug_idx"
  ON "public"."QualiopiFile" ("indicatorSlug", "folderSlug");

ALTER TABLE "public"."QualiopiFile" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can access all qualiopi files" ON "public"."QualiopiFile";
CREATE POLICY "Service role can access all qualiopi files"
  ON "public"."QualiopiFile"
  FOR ALL
  USING (true)
  WITH CHECK (true);
