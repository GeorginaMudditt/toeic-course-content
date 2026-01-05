-- Add password reset fields to User table
-- These fields are needed for the password reset functionality

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

-- Add comments for documentation
COMMENT ON COLUMN "User"."resetToken" IS 'Token for password reset';
COMMENT ON COLUMN "User"."resetTokenExpiry" IS 'Expiry time for reset token';
