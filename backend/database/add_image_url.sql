-- Migration: Add image_url column to existing games table
-- Run this if you already created the database without image_url

-- Add the column if it doesn't exist
ALTER TABLE games ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN games.image_url IS 'URL to official lottery ticket image from government website';
