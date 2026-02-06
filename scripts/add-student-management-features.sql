-- Migration: Add student management features
-- This script adds:
-- 1. lastSeenAt field to User table
-- 2. CourseNote table for storing course notes

-- Add lastSeenAt column to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

-- Create CourseNote table
CREATE TABLE IF NOT EXISTS "CourseNote" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseNote_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on enrollmentId (one note per enrollment)
CREATE UNIQUE INDEX IF NOT EXISTS "CourseNote_enrollmentId_key" ON "CourseNote"("enrollmentId");

-- Add foreign key constraint (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'CourseNote_enrollmentId_fkey'
    ) THEN
        ALTER TABLE "CourseNote" 
        ADD CONSTRAINT "CourseNote_enrollmentId_fkey" 
        FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
