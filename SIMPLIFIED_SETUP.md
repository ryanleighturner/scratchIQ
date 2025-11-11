# ScratchIQ - Simplified Setup (10 Minutes)

**Updated for local Playwright + Gemini 2.0 Flash**

---

## What You Need

1. **Supabase Account** (free) - Database
2. **Google AI Studio API Key** (free) - Image recognition
3. Node.js 18+ installed
4. Phone with Expo Go app

---

## Quick Setup

### 1. Clone & Install (2 min)

```bash
git clone https://github.com/ryanleighturner/scratchIQ.git
cd scratchIQ

# Backend
cd backend
npm install
npx playwright install chromium  # Install browser for scraping

# Mobile
cd ../mobile
npm install
```

### 2. Get Supabase Credentials (3 min)

**See detailed guide**: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

**Quick steps:**
1. Go to https://supabase.com → New Project
2. Wait 2 min for setup
3. Settings → API → Copy:
   - Project URL
   - anon public key
4. SQL Editor → Run `backend/database/schema.sql`

### 3. Get Gemini API Key (2 min)

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Select "Create API key in new project" (or use existing)
4. Copy the key

**Free tier:** 15 requests per minute, 1500 per day (plenty for testing!)

### 4. Configure Backend (1 min)

```bash
cd backend
cp .env.example .env
```

**Edit `.env` and add your keys:**

```bash
# From Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# From Google AI Studio
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXX...

# Rest can stay default
PORT=3001
FREE_TIER_SCANS=3
```

### 5. Add Sample Data (1 min)

In Supabase SQL Editor, run:

```sql
INSERT INTO games (id, name, price, state, ev, top_prize_amount, top_prize_remaining, is_hot, value_score, url)
VALUES
  ('test-1', '$1M Cash Spectacular', 20, 'nc', 0.75, 1000000, 3, true, 85, 'https://nclottery.com'),
  ('test-2', 'Triple 777', 5, 'nc', 0.65, 77777, 15, false, 72, 'https://nclottery.com'),
  ('test-3', 'Diamond Millions', 10, 'nc', 0.72, 500000, 5, true, 80, 'https://nclottery.com');
```

### 6. Start Backend (30 sec)

```bash
cd backend
npm start
```

Should see:
```
🚀 ScratchIQ Backend running on port 3001
💾 Database: ✓ Connected
```

### 7. Start Mobile App (1 min)

New terminal:

```bash
cd mobile

# Edit config.js first:
# Change API_BASE_URL to your IP (find with ipconfig/ifconfig)
# Example: export const API_BASE_URL = 'http://192.168.1.100:3001/api';

npx expo start
```

Scan QR code with Expo Go!

---

## Test Everything

### 1. Test Backend
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","database":"connected"}
```

### 2. Test Games Endpoint
```bash
curl http://localhost:3001/api/games/nc
# Should return your 3 sample games
```

### 3. Test Mobile App
- Open app → Complete onboarding
- Should see 3 sample games
- Tap one → See details with EV breakdown

### 4. Test Scraper (Optional)
```bash
cd backend
node services/scraper.js
```

Will scrape real NC Lottery data (takes 2-3 min for 20 games)

---

## How It Works Now

### Scraping (Playwright)
- **No Browserbase needed** - runs locally on your machine
- Scrapes NC Lottery website for games and prizes
- Calculates Expected Value for each game
- Stores in Supabase

### Image Scanning (Gemini 2.0 Flash)
- **No Tesseract** - uses Google's Gemini AI
- Much better accuracy for lottery tickets
- Recognizes game numbers, names, and prices
- Returns structured JSON data

### Mobile App
- Takes photo or selects from library
- Uploads to backend API
- Backend processes with Gemini
- Returns matched games from database
- 3 free scans per day

---

## What Changed from Original

✅ **Removed:**
- Browserbase dependency (now local Playwright)
- Tesseract.js (now Gemini 2.0 Flash)

✅ **Added:**
- Google Generative AI SDK
- Multer for file uploads
- Gemini service for image recognition
- New `/api/scan/image` endpoint

✅ **Benefits:**
- Simpler setup (no Browserbase account)
- Better image recognition (Gemini vs Tesseract)
- Free tier for everything
- Faster development

---

## API Endpoints

### Core Endpoints
- `GET /api/health` - Health check
- `GET /api/games/:state` - Get all games
- `GET /api/game/:gameId` - Get game details
- `GET /api/hot/:state` - Get hot tickets

### New Scan Endpoint
- `POST /api/scan/image` - Upload image, get detected games
  - Form data: `image` (file), `userId`, `state`
  - Returns: detected games + matched database games

### Admin
- `POST /api/admin/scrape` - Trigger manual scrape

---

## Testing Image Recognition

Create a test image or use a photo of lottery tickets:

```bash
# Backend test (from backend directory)
node services/gemini.js ../path/to/lottery-photo.jpg
```

Or via API:
```bash
curl -X POST http://localhost:3001/api/scan/image \
  -F "image=@photo.jpg" \
  -F "userId=test-user" \
  -F "state=nc"
```

---

## Troubleshooting

**Backend won't start:**
- Check `.env` has all required keys
- Run `npm install` again
- Make sure port 3001 is free

**"Invalid API key" error:**
- Verify Supabase keys are correct
- Check for extra spaces in `.env`

**Image scan not working:**
- Verify `GEMINI_API_KEY` is set
- Check uploads/ directory exists (created automatically)
- Test Gemini service directly: `node services/gemini.js test.jpg`

**Mobile app can't connect:**
- Check `config.js` has correct IP
- Both devices on same WiFi
- Backend is running

**Playwright errors:**
- Run: `npx playwright install chromium`
- On Windows, may need to allow firewall access

---

## Free Tier Limits

**Supabase:**
- 500MB database (enough for 100k games)
- 2GB bandwidth/month
- Unlimited API requests

**Gemini API:**
- 15 requests/minute
- 1500 requests/day
- Perfect for MVP testing

**Estimated Usage:**
- Each image scan = 1 Gemini request
- 50 users × 3 scans/day = 150 requests/day
- Well under free limits!

---

## Next Steps

1. **Test with real lottery photos** - Take pics of scratch-off displays
2. **Run actual scraper** - Get real NC data
3. **Customize UI** - Make it your own
4. **Add more states** - Extend to FL, GA, etc.
5. **Deploy to prod** - See deployment guides

---

## Getting Help

**Documentation:**
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Detailed database setup
- [README.md](README.md) - Full project overview
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup guide

**Issues:**
- GitHub Issues: https://github.com/ryanleighturner/scratchIQ/issues
- Supabase Docs: https://supabase.com/docs
- Gemini AI Docs: https://ai.google.dev/docs

---

**Total Setup Time: ~10 minutes**

You now have a working lottery analysis app with AI-powered image recognition! 🎰🚀
