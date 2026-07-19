-- Writing submissions: student homework upload + teacher marking with tracked corrections.
-- Run in the Supabase SQL editor (or via prisma db push).

CREATE TABLE IF NOT EXISTS "WritingSubmission" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "originalText" TEXT NOT NULL DEFAULT '',
  "fileUrl" TEXT,
  "fileName" TEXT,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "markedHtml" TEXT,
  "teacherComments" TEXT,
  "score" DOUBLE PRECISION,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "markedAt" TIMESTAMP(3),
  "markedById" TEXT,
  "uploadedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WritingSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WritingSubmission_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WritingSubmission_markedById_fkey"
    FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "WritingSubmission_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WritingSubmission_studentId_status_idx"
  ON "WritingSubmission"("studentId", "status");

CREATE INDEX IF NOT EXISTS "WritingSubmission_studentId_submittedAt_idx"
  ON "WritingSubmission"("studentId", "submittedAt");

CREATE INDEX IF NOT EXISTS "WritingSubmission_status_submittedAt_idx"
  ON "WritingSubmission"("status", "submittedAt");
