-- Migration: Add new analytical metrics columns
-- Run this in your Supabase SQL Editor

-- Add overall odds field (stores the raw overall odds value like "1 in 4.12")
ALTER TABLE games ADD COLUMN IF NOT EXISTS overall_odds VARCHAR(50);

-- Add computed fields for overall win probability
ALTER TABLE games ADD COLUMN IF NOT EXISTS overall_win_probability DECIMAL(10, 6);
ALTER TABLE games ADD COLUMN IF NOT EXISTS overall_win_percentage VARCHAR(20);

-- Add computed fields for adjusted top prize probability
ALTER TABLE games ADD COLUMN IF NOT EXISTS adjusted_top_prize_odds VARCHAR(50);
ALTER TABLE games ADD COLUMN IF NOT EXISTS adjusted_probability DECIMAL(10, 8);
ALTER TABLE games ADD COLUMN IF NOT EXISTS claim_rate DECIMAL(10, 4);
ALTER TABLE games ADD COLUMN IF NOT EXISTS estimated_remaining_tickets INTEGER;

-- Create indexes for new searchable fields
CREATE INDEX IF NOT EXISTS idx_games_overall_odds ON games(overall_win_probability DESC);
CREATE INDEX IF NOT EXISTS idx_games_adjusted_prob ON games(adjusted_probability DESC);

-- Add comment
COMMENT ON COLUMN games.overall_odds IS 'Overall odds of winning any prize (e.g., "1 in 4.12")';
COMMENT ON COLUMN games.overall_win_probability IS 'Calculated probability of winning any prize (1/O)';
COMMENT ON COLUMN games.adjusted_top_prize_odds IS 'Adjusted top prize odds accounting for claimed tickets';
COMMENT ON COLUMN games.claim_rate IS 'Estimated claim rate based on remaining prizes';
