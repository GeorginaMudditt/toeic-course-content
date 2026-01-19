-- Migration script to add REFERENCE to ResourceSkill enum
-- Run this in Supabase SQL Editor

-- Add REFERENCE to the ResourceSkill enum
ALTER TYPE "ResourceSkill" ADD VALUE IF NOT EXISTS 'REFERENCE';
