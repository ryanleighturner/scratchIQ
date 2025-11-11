# Supabase Setup Guide for ScratchIQ

## What You Need from Supabase

Supabase provides two things for ScratchIQ:
1. **PostgreSQL Database** - Stores games, prizes, and user data
2. **API Credentials** - Connects your backend to the database

---

## Step-by-Step Setup (5 minutes)

### 1. Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Free tier is perfect for MVP (up to 500MB database)

### 2. Create New Project

1. Click "New Project"
2. Fill in:
   - **Name**: `scratchiq` (or whatever you like)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free

3. Click "Create new project"
4. Wait ~2 minutes for provisioning

### 3. Get API Credentials

Once your project is ready:

1. Go to **Settings** (gear icon in sidebar)
2. Click **API** in the sidebar
3. You'll see two things you need:

**Copy These:**
```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Put them in your backend `.env` file:**
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Create Database Tables

1. In Supabase dashboard, click **SQL Editor** (in sidebar)
2. Click "New query"
3. Copy the entire contents of `backend/database/schema.sql`
4. Paste into the editor
5. Click "Run" (or press Ctrl+Enter)

You should see: `Success. No rows returned`

### 5. Verify Tables Created

1. Click **Table Editor** in sidebar
2. You should see 5 tables:
   - ✅ `games`
   - ✅ `prizes`
   - ✅ `user_scans`
   - ✅ `user_preferences`
   - ✅ `notification_queue`

If you see these, you're done! ✓

---

## What Each Table Does

### `games` Table
Stores scratch-off game information:
- Game ID, name, price
- Expected Value (EV)
- Top prize amount and remaining
- Hot ticket flag
- Value score

### `prizes` Table
Prize breakdown for each game:
- Prize amount (e.g., "$100", "$1,000,000")
- Total available
- Remaining count
- Links to parent game

### `user_scans` Table
Tracks free tier limits:
- User ID
- Game IDs scanned
- Scan timestamp
- Used to enforce 3 scans/day limit

### `user_preferences` Table
User settings:
- Selected state (NC, etc.)
- Notification preferences
- Pro tier status

### `notification_queue` Table
Push notifications:
- Hot ticket alerts
- Prize updates
- User-specific notifications

---

## Testing Your Connection

### Method 1: From Backend

```bash
cd backend
node -e "const db = require('./services/database'); db.healthCheck().then(r => console.log('Connected:', r))"
```

Should output: `Connected: true`

### Method 2: From API

Start your backend:
```bash
cd backend
npm start
```

Then test:
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

---

## Adding Sample Data (Optional)

To test without scraping, add sample games:

In Supabase SQL Editor:
```sql
INSERT INTO games (id, name, price, state, ev, top_prize_amount, top_prize_remaining, is_hot, value_score, url)
VALUES
  ('test-1', '$1M Cash Spectacular', 20, 'nc', 0.75, 1000000, 3, true, 85, 'https://nclottery.com'),
  ('test-2', 'Triple 777', 5, 'nc', 0.65, 77777, 15, false, 72, 'https://nclottery.com'),
  ('test-3', 'Diamond Millions', 10, 'nc', 0.72, 500000, 5, true, 80, 'https://nclottery.com'),
  ('test-4', 'Fast Cash', 2, 'nc', 0.55, 25000, 100, false, 65, 'https://nclottery.com'),
  ('test-5', 'Lucky 7s', 1, 'nc', 0.48, 7777, 50, false, 58, 'https://nclottery.com');

INSERT INTO prizes (game_id, prize_amt, total, remaining, prize_rank)
VALUES
  -- $1M Cash Spectacular prizes
  ('test-1', '$1,000,000', 5, 3, 0),
  ('test-1', '$10,000', 50, 35, 1),
  ('test-1', '$1,000', 500, 320, 2),
  ('test-1', '$100', 5000, 3200, 3),

  -- Triple 777 prizes
  ('test-2', '$77,777', 20, 15, 0),
  ('test-2', '$777', 200, 150, 1),
  ('test-2', '$77', 2000, 1200, 2),

  -- Diamond Millions prizes
  ('test-3', '$500,000', 10, 5, 0),
  ('test-3', '$50,000', 100, 75, 1),
  ('test-3', '$5,000', 1000, 650, 2),

  -- Fast Cash prizes
  ('test-4', '$25,000', 50, 100, 0),
  ('test-4', '$500', 500, 350, 1),

  -- Lucky 7s prizes
  ('test-5', '$7,777', 100, 50, 0),
  ('test-5', '$77', 1000, 600, 1);
```

Now when you open the mobile app, you'll see 5 games immediately!

---

## Troubleshooting

### Error: "Invalid API key"
- Double-check your `SUPABASE_KEY` in `.env`
- Make sure you copied the **anon public** key, not the service key
- No extra spaces or quotes in `.env` file

### Error: "relation 'games' does not exist"
- You didn't run the schema SQL
- Go to SQL Editor and run `backend/database/schema.sql`

### Error: "Connection timed out"
- Check your internet connection
- Verify `SUPABASE_URL` is correct in `.env`
- Free tier projects pause after 7 days of inactivity - just wake it up from dashboard

### Error: "Row Level Security"
- The schema includes RLS policies
- Your backend uses the `anon` key which bypasses RLS for app operations
- If you access tables directly, you may need to adjust RLS policies

---

## Supabase Dashboard Tips

### View Data
1. Click **Table Editor**
2. Select a table
3. See all rows

### Query Data
1. Click **SQL Editor**
2. Write SQL:
```sql
SELECT * FROM games WHERE is_hot = true ORDER BY value_score DESC;
```

### Monitor API Usage
1. Click **Settings** → **Usage**
2. See database size, API requests, etc.

### Backup Data
1. Click **Database** → **Backups**
2. Free tier: Daily backups for 7 days

---

## What You DON'T Need

You don't need these Supabase features for MVP:
- ❌ Authentication (we use simple user IDs)
- ❌ Storage (images processed server-side)
- ❌ Edge Functions
- ❌ Realtime (we use REST API)

These can be added later if needed!

---

## Cost Estimate

**Free Tier Limits:**
- 500 MB database storage
- 2 GB bandwidth per month
- 50,000 monthly active users
- Pauses after 1 week of inactivity

**For ScratchIQ MVP:**
- Games table: ~1-2 MB (1000 games)
- Prizes table: ~5-10 MB (10,000 prizes)
- User scans: ~1 MB (1000 users)
- **Total: ~10-15 MB** (plenty of room!)

You'll stay free tier for a long time!

---

## Summary Checklist

- [ ] Created Supabase account
- [ ] Created new project
- [ ] Copied Project URL and anon key
- [ ] Added credentials to `backend/.env`
- [ ] Ran `schema.sql` in SQL Editor
- [ ] Verified 5 tables exist in Table Editor
- [ ] Tested connection with health check
- [ ] (Optional) Added sample data

Once all checked, you're ready to go! 🚀

---

## Next Steps

1. **Start backend**: `cd backend && npm start`
2. **Test API**: `curl http://localhost:3001/api/games/nc`
3. **Run scraper**: `curl -X POST http://localhost:3001/api/admin/scrape`
4. **Launch mobile app**: `cd mobile && npx expo start`

Your database is ready for action! 💪
