-- Script to delete fake games from NC database
-- Run this in your Supabase SQL Editor

-- First, let's see what games match (optional - for verification)
SELECT id, name, state, price, ev
FROM games
WHERE state = 'nc'
AND (
  name ILIKE '%Cash spectacular%'
  OR name ILIKE '%Diamond millions%'
  OR name ILIKE '%Triple 777%'
);

-- Delete prizes first (if CASCADE doesn't handle it)
-- This will delete all prizes associated with these games
DELETE FROM prizes
WHERE game_id IN (
  SELECT id FROM games
  WHERE state = 'nc'
  AND (
    name ILIKE '%Cash spectacular%'
    OR name ILIKE '%Diamond millions%'
    OR name ILIKE '%Triple 777%'
  )
);

-- Delete the games
DELETE FROM games
WHERE state = 'nc'
AND (
  name ILIKE '%Cash spectacular%'
  OR name ILIKE '%Diamond millions%'
  OR name ILIKE '%Triple 777%'
);

-- Verify deletion (should return 0 rows)
SELECT id, name, state
FROM games
WHERE state = 'nc'
AND (
  name ILIKE '%Cash spectacular%'
  OR name ILIKE '%Diamond millions%'
  OR name ILIKE '%Triple 777%'
);

-- Show remaining NC games count
SELECT COUNT(*) as remaining_nc_games
FROM games
WHERE state = 'nc';
