-- ScratchIQ Database Schema for Supabase (PostgreSQL)
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  state VARCHAR(2) NOT NULL,
  ev DECIMAL(10, 4),
  top_prize_amount DECIMAL(15, 2),
  top_prize_remaining INTEGER,
  is_hot BOOLEAN DEFAULT FALSE,
  value_score INTEGER,
  odds_info TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on state and value_score for fast queries
CREATE INDEX IF NOT EXISTS idx_games_state ON games(state);
CREATE INDEX IF NOT EXISTS idx_games_value_score ON games(value_score DESC);
CREATE INDEX IF NOT EXISTS idx_games_is_hot ON games(is_hot) WHERE is_hot = TRUE;
CREATE INDEX IF NOT EXISTS idx_games_price ON games(price);

-- Prizes table
CREATE TABLE IF NOT EXISTS prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id VARCHAR(50) REFERENCES games(id) ON DELETE CASCADE,
  prize_amt VARCHAR(50) NOT NULL,
  total INTEGER NOT NULL,
  remaining INTEGER NOT NULL,
  prize_rank INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on game_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_prizes_game_id ON prizes(game_id);
CREATE INDEX IF NOT EXISTS idx_prizes_rank ON prizes(prize_rank);

-- User scans table (for tracking free tier limits)
CREATE TABLE IF NOT EXISTS user_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  game_ids TEXT[],
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id and scanned_at for daily limit checks
CREATE INDEX IF NOT EXISTS idx_user_scans_user_id ON user_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scans_date ON user_scans(scanned_at);

-- User preferences table (for notifications, state selection, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  selected_state VARCHAR(2) DEFAULT 'nc',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification queue table (for push notifications)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  game_id VARCHAR(50) REFERENCES games(id),
  notification_type VARCHAR(50) NOT NULL, -- 'hot_ticket', 'price_change', etc.
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notification_queue(sent) WHERE sent = FALSE;

-- Row Level Security (RLS) Policies
-- Enable RLS on user-specific tables
ALTER TABLE user_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own scans
CREATE POLICY user_scans_policy ON user_scans
  FOR ALL
  USING (auth.uid()::TEXT = user_id);

-- Policy: Users can only see their own preferences
CREATE POLICY user_preferences_policy ON user_preferences
  FOR ALL
  USING (auth.uid()::TEXT = user_id);

-- Policy: Users can only see their own notifications
CREATE POLICY notification_queue_policy ON notification_queue
  FOR ALL
  USING (auth.uid()::TEXT = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prizes_updated_at BEFORE UPDATE ON prizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data insert (for testing)
-- Uncomment to add sample game for development

/*
INSERT INTO games (id, name, price, state, ev, top_prize_amount, top_prize_remaining, is_hot, value_score, url)
VALUES
  ('game-1001', '$1,000,000 Jackpot', 20.00, 'nc', 0.75, 1000000, 3, TRUE, 85, 'https://nclottery.com/game-1001'),
  ('game-1002', 'Triple 777', 5.00, 'nc', 0.65, 77777, 15, FALSE, 72, 'https://nclottery.com/game-1002'),
  ('game-1003', 'Cash Explosion', 10.00, 'nc', 0.72, 500000, 5, TRUE, 80, 'https://nclottery.com/game-1003');

INSERT INTO prizes (game_id, prize_amt, total, remaining, prize_rank)
VALUES
  ('game-1001', '$1,000,000', 5, 3, 0),
  ('game-1001', '$10,000', 50, 35, 1),
  ('game-1001', '$1,000', 500, 320, 2),
  ('game-1002', '$77,777', 20, 15, 0),
  ('game-1002', '$777', 200, 150, 1),
  ('game-1003', '$500,000', 10, 5, 0),
  ('game-1003', '$50,000', 100, 75, 1);
*/

-- View for games with prize counts
CREATE OR REPLACE VIEW games_with_stats AS
SELECT
  g.*,
  COUNT(p.id) AS prize_count,
  SUM(p.remaining) AS total_prizes_remaining
FROM games g
LEFT JOIN prizes p ON g.id = p.game_id
GROUP BY g.id;

-- Comments for documentation
COMMENT ON TABLE games IS 'Stores scratch-off lottery game information';
COMMENT ON TABLE prizes IS 'Prize breakdown for each game';
COMMENT ON TABLE user_scans IS 'Tracks user photo scans for free tier limits';
COMMENT ON TABLE user_preferences IS 'User settings and preferences';
COMMENT ON TABLE notification_queue IS 'Queue for push notifications';
