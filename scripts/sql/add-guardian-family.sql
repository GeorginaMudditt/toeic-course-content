-- Step 1: Add GUARDIAN role (run once)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'GUARDIAN';

-- Step 2: Family link table (run once)
CREATE TABLE IF NOT EXISTS "FamilyMembership" (
  "id" TEXT PRIMARY KEY,
  "guardianId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "childStudentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("guardianId", "childStudentId")
);

CREATE INDEX IF NOT EXISTS "FamilyMembership_guardianId_idx"
  ON "FamilyMembership" ("guardianId");
