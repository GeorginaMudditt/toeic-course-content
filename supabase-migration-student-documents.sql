-- Create StudentDocument table
CREATE TABLE IF NOT EXISTS "StudentDocument" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentDocument_pkey" PRIMARY KEY ("id")
);

-- Create index on studentId for faster queries
CREATE INDEX IF NOT EXISTS "StudentDocument_studentId_idx" ON "StudentDocument"("studentId");

-- Add foreign key constraint to User table
ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_studentId_fkey" 
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
