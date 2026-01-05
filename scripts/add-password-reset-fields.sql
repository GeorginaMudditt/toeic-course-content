-- ============================================
-- Add Password Reset Fields to User Table
-- ============================================
-- Run this in Supabase SQL Editor to add password reset functionality
-- This adds resetToken and resetTokenExpiry columns to the User table

-- Add resetToken column (nullable string for storing reset tokens)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "resetToken" TEXT;

-- Add resetTokenExpiry column (nullable timestamp for token expiration)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP;

-- Add comment to document the fields
COMMENT ON COLUMN "User"."resetToken" IS 'Secure token for password reset requests';
COMMENT ON COLUMN "User"."resetTokenExpiry" IS 'Expiration time for the reset token (typically 1 hour from generation)';

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'User'
  AND column_name IN ('resetToken', 'resetTokenExpiry')
ORDER BY column_name;
