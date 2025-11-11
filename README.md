# ScratchIQ - Data-Driven Lottery Ticket Analysis App

ScratchIQ is a cross-platform mobile app that helps users find the best-value scratch-off lottery tickets using Expected Value (EV) analysis based on real-time data scraped from state lottery websites.

## 🎯 Features

- **Real-time EV Calculations**: Calculate expected value for all scratch-off games based on remaining prizes
- **Hot Ticket Alerts**: Get notified when high-value tickets become available
- **Photo Scanning**: Scan lottery ticket display walls with OCR to identify games
- **Budget Filters**: Find the best tickets within your price range
- **Prize Tracking**: Monitor remaining top prizes for all games
- **State Support**: Currently supports North Carolina (MVP), more states coming soon

## 📊 Expected Value (EV) Explained

Expected Value represents the average return per dollar spent on a lottery ticket:
- **EV = 0.75** means you get 75¢ back for every $1 spent (on average)
- **EV > 0.70** is considered a "hot ticket" (better than average)
- **EV < 1.00** means the house has an edge (you lose money long-term)

*Note: All gambling has an expected loss. This app helps minimize that loss by finding the best available options.*

## 🏗️ Architecture

```
ScratchIQ/
├── backend/              # Node.js/Express API server
│   ├── services/
│   │   ├── scraper.js    # Browserbase-powered web scraper
│   │   ├── database.js   # Supabase integration
│   │   └── notifications.js  # Push notification service
│   ├── utils/
│   │   └── evCalculator.js  # EV calculation logic
│   ├── database/
│   │   └── schema.sql    # PostgreSQL database schema
│   └── server.js         # Main API server
│
└── mobile/               # React Native/Expo mobile app
    ├── screens/
    │   ├── OnboardingScreen.js
    │   ├── HomeScreen.js
    │   ├── ScanScreen.js
    │   └── GameDetailScreen.js
    ├── App.js
    └── config.js
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier works)
- Browserbase API key (for scraping)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your credentials:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   BROWSERBASE_API_KEY=your_browserbase_api_key
   PORT=3001
   ```

3. **Set up Supabase database**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL commands from `backend/database/schema.sql`

4. **Start the backend server**:
   ```bash
   npm start
   ```

   The server will run on `http://localhost:3001`

5. **Test the scraper** (optional):
   ```bash
   node services/scraper.js
   ```

### Mobile App Setup

1. **Navigate to mobile directory**:
   ```bash
   cd mobile
   npm install
   ```

2. **Update API configuration**:

   Edit `mobile/config.js` and set your backend URL:

   - For local testing on emulator: `http://localhost:3001/api`
   - For physical device: `http://YOUR_IP:3001/api` (find your IP with `ipconfig` or `ifconfig`)
   - For production: `https://your-production-domain.com/api`

3. **Start Expo**:
   ```bash
   npx expo start
   ```

4. **Run on device**:
   - **iOS**: Press `i` in terminal or scan QR code with Camera app
   - **Android**: Press `a` in terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in terminal

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:

```bash
# Scraping settings
MAX_GAMES_PER_SCRAPE=20        # Limit games per scrape
SCRAPE_DELAY_MS=2000           # Delay between game scrapes (rate limiting)
SCRAPE_ON_STARTUP=false        # Run scrape on server start

# Free tier limits
FREE_TIER_SCANS=3              # Free scans per day
```

### Frontend Configuration

Edit `mobile/config.js`:

```javascript
export const API_BASE_URL = 'http://localhost:3001/api';
export const FREE_TIER_SCANS = 3;
export const HOT_TICKET_THRESHOLD = 0.7;
```

## 📡 API Endpoints

### Get Games by State
```
GET /api/games/:state?minPrice=5&maxPrice=10&hotOnly=true
```

### Get Game Details
```
GET /api/game/:gameId
```

### Get Hot Tickets
```
GET /api/hot/:state?limit=10
```

### Track Scan (Free Tier)
```
POST /api/scan/track
Body: { userId: "user_123", gameIds: ["1001", "1002"] }
```

### Manual Scrape Trigger
```
POST /api/admin/scrape
```

## 🤖 Scraping & Cron Jobs

The backend automatically scrapes NC Lottery data:

- **Schedule**: Daily at 2:00 AM (configured in `server.js`)
- **Method**: Browserbase + Playwright for reliable JS rendering
- **Rate Limiting**: 2 second delay between games to avoid blocks
- **Storage**: All data cached in Supabase for fast API responses

### Manual Scrape

```bash
# Via API
curl -X POST http://localhost:3001/api/admin/scrape

# Via CLI
node backend/services/scraper.js
```

## 📱 Mobile App Features

### 1. Onboarding
- State selection (NC supported in MVP)
- Disclaimer acceptance
- Responsible gambling education

### 2. Home Screen
- Browse all available games
- Filter by budget ($1, $2, $5, $10, $20, $30)
- Toggle "Hot Tickets Only" filter
- Sort by value score
- Pull to refresh data

### 3. Scan Screen
- Take photo or choose from library
- OCR-powered game ID detection
- Free tier: 3 scans/day
- Displays matched games sorted by value

### 4. Game Detail Screen
- Full EV breakdown
- Prize remaining visualization
- Break-even odds calculation
- Top prize tracking
- Link to official lottery page

## 🔐 Security & Privacy

- No user authentication required for MVP
- Anonymous user IDs stored locally
- No personal data collected
- Supabase Row Level Security (RLS) enabled
- API rate limiting recommended for production

## ⚠️ Legal Disclaimer

**IMPORTANT**: This app is for educational and entertainment purposes only.

- Must be 18+ to play lottery games
- Gambling involves risk; most players lose money
- EV < 1.0 means you will lose money on average
- Play responsibly and within your means
- Seek help if gambling becomes a problem: 1-800-522-4700

## 🚢 Deployment

### Backend Deployment

Deploy to any Node.js host (Heroku, Railway, Render, etc.):

```bash
# Example with Railway
railway init
railway up
```

Set environment variables in your hosting dashboard.

### Mobile App Deployment

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Or use EAS Build (recommended)
eas build --platform ios
eas build --platform android
```

Submit to App Store / Google Play following Expo documentation.

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Test Scraper
```bash
node backend/services/scraper.js
```

### Test EV Calculator
```bash
node -e "const calc = require('./backend/utils/evCalculator'); console.log(calc.calculateEV([{prize_amt:'$100',remaining:10}], 5, 1000))"
```

## 📈 Roadmap

### MVP (Current)
- [x] NC Lottery scraping
- [x] EV calculation
- [x] Mobile app (iOS/Android)
- [x] Photo scanning with OCR
- [x] Free tier (3 scans/day)

### v1.1
- [ ] Additional states (FL, GA, TX, etc.)
- [ ] Historical EV tracking
- [ ] Pro tier with Stripe integration
- [ ] Advanced filters (odds, prize tiers)
- [ ] Push notifications for hot tickets

### v1.2
- [ ] Social features (share finds)
- [ ] Retailer locator
- [ ] Win tracking
- [ ] Community ratings

## 🤝 Contributing

This is an MVP project. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

- **Issues**: Open a GitHub issue
- **Questions**: Contact via GitHub Discussions
- **Gambling Help**: National Problem Gambling Helpline: 1-800-522-4700

## 📚 Tech Stack

**Backend**:
- Node.js + Express
- Playwright + Browserbase (scraping)
- Supabase (PostgreSQL)
- node-cron (scheduled jobs)

**Frontend**:
- React Native + Expo
- React Navigation
- Axios (API calls)
- Tesseract.js (OCR)
- Expo Camera, Notifications

**Infrastructure**:
- Supabase (database + auth)
- Browserbase (headless browsing)
- Expo (mobile deployment)

---

**Remember**: Gambling should be fun, not a way to make money. Always play responsibly! 🎰

Made with data by the ScratchIQ team
