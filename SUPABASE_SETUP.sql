-- ============================================
-- Supabase Database Setup SQL Script
-- ============================================
-- Run this in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/ulrwcortyhassmytkcij/editor
-- Click "New query" and paste this entire script, then click "Run"

-- Step 1: Create Enums (ignore errors if they already exist)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('TEACHER', 'STUDENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ResourceType" AS ENUM ('WORKSHEET', 'LESSON', 'EXERCISE', 'QUIZ');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create Resource table
CREATE TABLE IF NOT EXISTS "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResourceType" NOT NULL,
    "content" TEXT NOT NULL,
    "estimatedHours" DOUBLE PRECISION NOT NULL,
    "level" TEXT NOT NULL,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create Course table
CREATE TABLE IF NOT EXISTS "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create Enrollment table
CREATE TABLE IF NOT EXISTS "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- Step 6: Create Assignment table
CREATE TABLE IF NOT EXISTS "Assignment" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "order" INTEGER NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create Progress table
CREATE TABLE IF NOT EXISTS "Progress" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "timeSpent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- Step 8: Create unique constraints (ignore errors if they already exist)
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_studentId_courseId_key" ON "Enrollment"("studentId", "courseId");
CREATE UNIQUE INDEX IF NOT EXISTS "Assignment_enrollmentId_resourceId_key" ON "Assignment"("enrollmentId", "resourceId");
CREATE UNIQUE INDEX IF NOT EXISTS "Progress_assignmentId_studentId_key" ON "Progress"("assignmentId", "studentId");

-- Step 9: Create foreign keys (using DO blocks to handle existing constraints)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Resource_creatorId_fkey'
    ) THEN
        ALTER TABLE "Resource" ADD CONSTRAINT "Resource_creatorId_fkey" 
        FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Course_creatorId_fkey'
    ) THEN
        ALTER TABLE "Course" ADD CONSTRAINT "Course_creatorId_fkey" 
        FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Enrollment_studentId_fkey'
    ) THEN
        ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Enrollment_courseId_fkey'
    ) THEN
        ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" 
        FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Assignment_enrollmentId_fkey'
    ) THEN
        ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_enrollmentId_fkey" 
        FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Assignment_resourceId_fkey'
    ) THEN
        ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_resourceId_fkey" 
        FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Progress_assignmentId_fkey'
    ) THEN
        ALTER TABLE "Progress" ADD CONSTRAINT "Progress_assignmentId_fkey" 
        FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Progress_studentId_fkey'
    ) THEN
        ALTER TABLE "Progress" ADD CONSTRAINT "Progress_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 10: Add updatedAt trigger function (auto-update updatedAt timestamp)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 11: Create triggers for updatedAt (ignore errors if they already exist)
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resource_updated_at ON "Resource";
CREATE TRIGGER update_resource_updated_at BEFORE UPDATE ON "Resource"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_updated_at ON "Course";
CREATE TRIGGER update_course_updated_at BEFORE UPDATE ON "Course"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_progress_updated_at ON "Progress";
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON "Progress"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Create VocabularyProgress table
CREATE TABLE IF NOT EXISTS "VocabularyProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "bronze" BOOLEAN NOT NULL DEFAULT false,
    "silver" BOOLEAN NOT NULL DEFAULT false,
    "gold" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabularyProgress_pkey" PRIMARY KEY ("id")
);

-- Step 13: Create unique constraint for VocabularyProgress
CREATE UNIQUE INDEX IF NOT EXISTS "VocabularyProgress_studentId_level_topic_key"
ON "VocabularyProgress"("studentId", "level", "topic");

-- Step 14: Create foreign key for VocabularyProgress
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'VocabularyProgress_studentId_fkey'
    ) THEN
        ALTER TABLE "VocabularyProgress" ADD CONSTRAINT "VocabularyProgress_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 15: Create trigger for VocabularyProgress updatedAt
DROP TRIGGER IF EXISTS update_vocabularyprogress_updated_at ON "VocabularyProgress";
CREATE TRIGGER update_vocabularyprogress_updated_at BEFORE UPDATE ON "VocabularyProgress"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done! All tables and constraints have been created.
-- You can verify by running: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
