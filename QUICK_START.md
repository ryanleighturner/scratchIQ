# ScratchIQ Quick Start Guide

Get ScratchIQ running in **15 minutes** with this streamlined guide.

## ⚡ Express Setup

### 1. Prerequisites (2 min)

Install if you don't have:
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- Expo Go app on your phone

### 2. Clone & Install (3 min)

```bash
# Clone repository
git clone https://github.com/ryanleighturner/scratchIQ.git
cd scratchIQ

# Install backend
cd backend
npm install

# Install mobile
cd ../mobile
npm install
```

### 3. Get API Keys (5 min)

**Supabase** (Required):
1. Go to [supabase.com](https://supabase.com) → New Project
2. Wait 2 minutes for provisioning
3. Settings → API → Copy URL and anon key

**Browserbase** (Optional):
1. Go to [browserbase.com](https://browserbase.com) → Sign Up
2. Copy API key from dashboard
3. *Or skip and use local Playwright*

### 4. Configure Backend (2 min)

```bash
cd backend

# Create .env file
cp .env.example .env

# Edit .env (use notepad, vim, or VS Code)
# Add your Supabase credentials
```

**Required in .env**:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_anon_key_here
```

### 5. Setup Database (1 min)

1. Supabase Dashboard → SQL Editor
2. Copy all from `backend/database/schema.sql`
3. Paste and Run
4. Check Table Editor - should see 5 tables

### 6. Start Backend (1 min)

```bash
cd backend
npm start

# Should see:
# 🚀 ScratchIQ Backend running on port 3001
# 💾 Database: ✓ Connected
```

Leave this running.

### 7. Configure Mobile (1 min)

Open new terminal:

```bash
cd mobile

# Edit config.js - change this line:
# export const API_BASE_URL = 'http://YOUR_IP:3001/api';
```

**Find your IP**:
- Windows: `ipconfig` (look for IPv4)
- Mac/Linux: `ifconfig` (look for inet)
- Example: `192.168.1.100`

### 8. Start Mobile App (2 min)

```bash
npx expo start

# Scan QR code with:
# - iPhone: Camera app
# - Android: Expo Go app
```

### 9. Test It! (2 min)

1. App loads → Onboarding screen
2. Select North Carolina → Accept terms
3. Home screen appears

**To load data**:

Back in backend terminal:
```bash
# Trigger manual scrape
curl -X POST http://localhost:3001/api/admin/scrape
```

Wait 2-3 minutes, then pull to refresh in app!

## 🎯 Verification Checklist

- [ ] Backend shows "Database: ✓ Connected"
- [ ] Mobile app loads onboarding
- [ ] Can complete onboarding flow
- [ ] Home screen displays (may be empty initially)
- [ ] Manual scrape completes successfully
- [ ] Games appear after refresh
- [ ] Can tap game to see details

## 🚨 Common Issues

### Backend won't start
```bash
# Check Node version
node --version  # Should be 18+

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Mobile can't connect
```bash
# Verify backend is running
curl http://localhost:3001/api/health

# Check IP address in config.js matches your computer
# Both devices must be on same WiFi
```

### No games after scrape
```bash
# Check scraper logs
node backend/test-scraper.js

# Use sample data instead
# Run this in Supabase SQL Editor:
```

```sql
INSERT INTO games (id, name, price, state, ev, top_prize_amount, top_prize_remaining, is_hot, value_score, url)
VALUES
  ('test-1', '$1M Jackpot', 20, 'nc', 0.75, 1000000, 3, true, 85, 'https://nclottery.com'),
  ('test-2', 'Triple 777', 5, 'nc', 0.65, 77777, 15, false, 72, 'https://nclottery.com');
```

## 📱 Using the App

### Browse Games
- Pull down to refresh
- Tap budget filters ($1, $2, $5, etc.)
- Toggle "Hot Tickets Only"
- Tap any game for details

### Scan Tickets
- Tap "📸 Scan Ticket Wall"
- Allow camera permissions
- Take photo of lottery display
- Wait for OCR processing
- View detected games

### Free Tier
- 3 scans per day
- Resets at midnight
- Tracks locally on device

## 🎉 You're Done!

**Next Steps**:
1. Read [README.md](README.md) for full documentation
2. Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for troubleshooting
3. Review [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for architecture

## 💡 Pro Tips

1. **Faster Testing**: Use sample data (SQL above) instead of waiting for scrapes
2. **Skip Browserbase**: Works fine with local Playwright for development
3. **USB Debugging**: Faster than WiFi - `npx expo start --tunnel`
4. **Hot Reload**: Edit code and app updates automatically
5. **Check Logs**: Backend terminal shows all API calls

## 🆘 Still Stuck?

1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting
2. Review console logs in both terminals
3. Verify all environment variables are set
4. Try restarting both backend and mobile app
5. Open GitHub issue with error details

## 🚀 Ready to Build?

The app is now running! Try:
- Adding more states
- Customizing the UI
- Improving EV calculations
- Adding analytics
- Building new features

**Happy coding!** 🎰
