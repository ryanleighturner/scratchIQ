# ScratchIQ Setup Guide

Complete step-by-step guide to get ScratchIQ running locally in 30 minutes.

## 📋 Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] npm or yarn package manager
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] Smartphone with Expo Go app (for mobile testing)
- [ ] Supabase account (free tier: [supabase.com](https://supabase.com))
- [ ] Browserbase account (free trial: [browserbase.com](https://www.browserbase.com))

## 🎯 Quick Start (15 minutes)

### Step 1: Clone Repository

```bash
# Clone your repository
git clone https://github.com/ryanleighturner/scratchIQ.git
cd scratchIQ
```

### Step 2: Backend Setup (10 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

**Edit `.env` file** with your credentials:

```bash
# Get these from Supabase dashboard → Settings → API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here

# Get from Browserbase dashboard
BROWSERBASE_API_KEY=your-browserbase-key-here

# Server config
PORT=3001
NODE_ENV=development
SCRAPE_ON_STARTUP=false
```

### Step 3: Database Setup (5 minutes)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project (takes ~2 minutes to provision)
3. Go to **SQL Editor**
4. Copy contents of `backend/database/schema.sql`
5. Paste and click **Run**
6. Verify tables created in **Table Editor**

### Step 4: Test Backend

```bash
# Start server
npm start

# Should see:
# 🚀 ScratchIQ Backend running on port 3001
# 💾 Database: ✓ Connected

# In another terminal, test API
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-..."
}
```

### Step 5: Mobile App Setup (5 minutes)

```bash
# Navigate to mobile (from project root)
cd mobile

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g expo-cli

# Update API URL in config.js
# For simulator: http://localhost:3001/api
# For physical device: http://YOUR_IP:3001/api (see below)
```

**Find your IP address**:

Windows:
```bash
ipconfig
# Look for "IPv4 Address" (e.g., 192.168.1.100)
```

Mac/Linux:
```bash
ifconfig | grep "inet "
# Look for your local network IP
```

Edit `mobile/config.js`:
```javascript
export const API_BASE_URL = 'http://192.168.1.100:3001/api';  // Use your IP
```

### Step 6: Run Mobile App

```bash
# Start Expo
npx expo start

# Choose your platform:
# - Press 'i' for iOS simulator (Mac only)
# - Press 'a' for Android emulator
# - Scan QR code with phone (Expo Go app required)
```

**On your phone**:
1. Install "Expo Go" from App Store / Google Play
2. Scan QR code from terminal
3. App should launch!

## 🧪 Testing the App

### Test Backend API

```bash
# Get all games (should be empty initially)
curl http://localhost:3001/api/games/nc

# Run manual scrape (takes ~2-5 minutes)
curl -X POST http://localhost:3001/api/admin/scrape

# Check games again (should have data now)
curl http://localhost:3001/api/games/nc | json_pp
```

### Test Mobile App

1. **Onboarding**: Select North Carolina, accept disclaimer
2. **Home Screen**: Should show "Connecting..." then games (after scrape)
3. **Scan Feature**: Allow camera permissions, test photo upload
4. **Game Details**: Tap any game to see EV breakdown

## 🔍 Troubleshooting

### Backend Issues

**Problem**: `ECONNREFUSED` when starting server

**Solution**: Check `.env` file has correct Supabase credentials

```bash
# Test Supabase connection
node -e "const {createClient} = require('@supabase/supabase-js'); const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY); sb.from('games').select('count').then(console.log);"
```

---

**Problem**: Scraper returns no games

**Solutions**:
1. Check Browserbase API key is valid
2. NC Lottery website may have changed structure
3. Try running scraper directly: `node services/scraper.js`
4. Check console logs for specific errors

---

**Problem**: Database errors

**Solution**: Verify schema was created properly

```bash
# In Supabase SQL Editor, run:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

Should see: `games`, `prizes`, `user_scans`, `user_preferences`, `notification_queue`

### Mobile App Issues

**Problem**: "Network request failed"

**Solutions**:
1. Ensure backend is running (`npm start` in `backend/` directory)
2. Check `mobile/config.js` has correct IP address
3. Phone and computer must be on same WiFi network
4. Try disabling firewall temporarily
5. Use ngrok for tunneling: `ngrok http 3001`

---

**Problem**: "Unable to resolve module"

**Solution**: Clear cache and reinstall

```bash
cd mobile
rm -rf node_modules
npm install
npx expo start -c  # -c clears cache
```

---

**Problem**: Camera permissions not working

**Solution**:
1. Check `app.json` has camera permissions
2. Uninstall and reinstall app from device
3. Grant permissions in device Settings → Apps → Expo Go

---

**Problem**: OCR not detecting games

**Solutions**:
1. Ensure photo has good lighting
2. Game numbers should be clearly visible
3. Try closer photos with less background
4. Test with sample image first

## 🔑 Getting API Keys

### Supabase (Free Tier)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create organization and project
4. Wait ~2 minutes for provisioning
5. Go to **Settings** → **API**
6. Copy **Project URL** and **anon public key**

### Browserbase (Free Trial)

1. Go to [browserbase.com](https://www.browserbase.com)
2. Sign up for free trial
3. Go to dashboard
4. Copy API key from settings
5. *Note*: Free trial has usage limits; use sparingly during development

**Alternative**: Use local Playwright (no Browserbase key needed)

The scraper will fallback to local Playwright if Browserbase fails. Just comment out `BROWSERBASE_API_KEY` in `.env`.

## 🏃 Development Workflow

### Backend Development

```bash
cd backend

# Watch mode (auto-restart on changes)
npm install -g nodemon
nodemon server.js

# Check logs
tail -f logs/app.log  # if logging to file

# Manual scrape
node services/scraper.js

# Test EV calculations
node -e "const calc = require('./utils/evCalculator'); console.log(calc.calculateEV([{prize_amt:'$100',remaining:100,total:1000}], 5))"
```

### Mobile Development

```bash
cd mobile

# Start with cache clear
npx expo start -c

# Rebuild iOS
npx expo run:ios

# Rebuild Android
npx expo run:android

# Check for updates
expo upgrade
```

## 📊 Sample Data (Optional)

To test without scraping, add sample data:

```sql
-- In Supabase SQL Editor
INSERT INTO games (id, name, price, state, ev, top_prize_amount, top_prize_remaining, is_hot, value_score, url)
VALUES
  ('game-test-1', '$1,000,000 Jackpot', 20.00, 'nc', 0.75, 1000000, 3, TRUE, 85, 'https://nclottery.com'),
  ('game-test-2', 'Triple 777', 5.00, 'nc', 0.65, 77777, 15, FALSE, 72, 'https://nclottery.com'),
  ('game-test-3', 'Cash Explosion', 10.00, 'nc', 0.72, 500000, 5, TRUE, 80, 'https://nclottery.com');

INSERT INTO prizes (game_id, prize_amt, total, remaining, prize_rank)
VALUES
  ('game-test-1', '$1,000,000', 5, 3, 0),
  ('game-test-1', '$10,000', 50, 35, 1),
  ('game-test-2', '$77,777', 20, 15, 0),
  ('game-test-3', '$500,000', 10, 5, 0);
```

Refresh mobile app and you should see test games!

## 🚀 Production Deployment

### Backend (Railway / Heroku / Render)

**Railway Example**:

```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set SUPABASE_URL=your_url
railway variables set SUPABASE_KEY=your_key
railway variables set BROWSERBASE_API_KEY=your_key

# Deploy
railway up
```

### Mobile (Expo EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## 📞 Need Help?

- **GitHub Issues**: [Open an issue](https://github.com/ryanleighturner/scratchIQ/issues)
- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

## ✅ Success Checklist

- [ ] Backend running on port 3001
- [ ] Database connected (check `/api/health`)
- [ ] Scraper completed successfully (20+ games)
- [ ] Mobile app loads onboarding
- [ ] Games visible on home screen
- [ ] Camera permissions working
- [ ] Game detail screen shows EV breakdown
- [ ] No console errors

If all checked, you're ready to develop! 🎉

---

**Estimated Setup Time**: 30 minutes (20 min for first-time setup, 10 min for experienced devs)

Good luck and happy coding! 🚀
