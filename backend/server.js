/**
 * ScratchIQ Backend Server
 * Main Express API server with cron jobs for scraping
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const NCLotteryScraper = require('./services/scraper');
const PALotteryScraper = require('./services/paScraper');
const MDLotteryScraper = require('./services/mdScraper');
const database = require('./services/database');
const gemini = require('./services/gemini');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG) are allowed'));
    }
  }
});

const app = express();
const PORT = process.env.PORT || 3001;

// Supported states and their scrapers
const SUPPORTED_STATES = ['nc', 'pa', 'md'];

/**
 * Get the appropriate scraper for a given state
 */
function getScraper(state, options = {}) {
  const stateCode = state.toLowerCase();

  const defaultOptions = {
    maxGames: process.env.MAX_GAMES_PER_SCRAPE || 50,
    scrapeDelay: process.env.SCRAPE_DELAY_MS || 2000,
    headless: true,
    ...options
  };

  switch (stateCode) {
    case 'nc':
      return new NCLotteryScraper(defaultOptions);
    case 'pa':
      return new PALotteryScraper(defaultOptions);
    case 'md':
      return new MDLotteryScraper(defaultOptions);
    default:
      throw new Error(`Unsupported state: ${state}`);
  }
}

/**
 * Validate state parameter
 */
function isValidState(state) {
  return SUPPORTED_STATES.includes(state.toLowerCase());
}

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== API ROUTES ====================

/**
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  const dbHealthy = await database.healthCheck();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected'
  });
});

/**
 * Get games by state with optional filters
 * Query params: minPrice, maxPrice, hotOnly
 */
app.get('/api/games/:state', async (req, res) => {
  try {
    const { state } = req.params;

    // Validate state
    if (!isValidState(state)) {
      return res.status(400).json({
        error: 'Invalid state',
        message: `Supported states: ${SUPPORTED_STATES.map(s => s.toUpperCase()).join(', ')}`
      });
    }

    const filters = {
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      hotOnly: req.query.hotOnly === 'true'
    };

    const games = await database.getGames(state.toLowerCase(), filters);

    res.json({
      state: state.toUpperCase(),
      count: games.length,
      games,
      disclaimer: 'Expected values are estimates. Gambling involves risk. Play responsibly.'
    });

  } catch (error) {
    console.error('Error in /api/games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get games by budget (convenience endpoint)
 */
app.get('/api/games/:state/budget/:budget', async (req, res) => {
  try {
    const { state, budget } = req.params;

    if (!isValidState(state)) {
      return res.status(400).json({
        error: 'Invalid state',
        message: `Supported states: ${SUPPORTED_STATES.map(s => s.toUpperCase()).join(', ')}`
      });
    }

    const budgetAmount = parseFloat(budget);

    if (isNaN(budgetAmount) || budgetAmount < 0) {
      return res.status(400).json({ error: 'Invalid budget amount' });
    }

    const filters = {
      maxPrice: budgetAmount
    };

    const games = await database.getGames(state.toLowerCase(), filters);

    res.json({
      state: state.toUpperCase(),
      budget: budgetAmount,
      count: games.length,
      games
    });

  } catch (error) {
    console.error('Error in /api/games/budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get single game details with prizes
 */
app.get('/api/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await database.getGameWithPrizes(gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);

  } catch (error) {
    console.error('Error in /api/game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get hot tickets (high EV games)
 */
app.get('/api/hot/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    if (!isValidState(state)) {
      return res.status(400).json({
        error: 'Invalid state',
        message: `Supported states: ${SUPPORTED_STATES.map(s => s.toUpperCase()).join(', ')}`
      });
    }

    const hotTickets = await database.getHotTickets(state.toLowerCase(), limit);

    res.json({
      state: state.toUpperCase(),
      count: hotTickets.length,
      games: hotTickets,
      note: 'Hot tickets have EV >= 0.70'
    });

  } catch (error) {
    console.error('Error in /api/hot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Scan lottery ticket image with Gemini AI
 */
app.post('/api/scan/image', upload.single('image'), async (req, res) => {
  try {
    const { userId, state } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Check daily scan limit
    const scanCount = await database.getUserScanCount(userId);
    const freeLimit = parseInt(process.env.FREE_TIER_SCANS) || 3;

    if (scanCount >= freeLimit) {
      // Clean up uploaded file
      const fs = require('fs');
      fs.unlinkSync(req.file.path);

      return res.status(429).json({
        error: 'Scan limit reached',
        message: 'Upgrade to Pro for unlimited scans',
        scansUsed: scanCount,
        limit: freeLimit
      });
    }

    // Analyze image with Gemini
    console.log(`Analyzing image for user ${userId}...`);
    const result = await gemini.recognizeLotteryTickets(req.file.path);

    // Clean up uploaded file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    if (!result.games || result.games.length === 0) {
      return res.json({
        success: false,
        message: 'No lottery tickets detected in image',
        games: [],
        scansUsed: scanCount,
        scansRemaining: freeLimit - scanCount
      });
    }

    // Extract game IDs
    const gameIds = result.games.map(g => g.gameNumber).filter(Boolean);

    // Track the scan
    await database.trackUserScan(userId, gameIds);

    // Fetch matching games from database
    const allGames = await database.getGames(state || 'nc', {});
    const matchedGames = allGames.filter(game =>
      gameIds.includes(game.id) ||
      gameIds.some(id => game.id.includes(id) || game.name.toLowerCase().includes(result.games.find(g => g.gameNumber === id)?.gameName.toLowerCase()))
    );

    res.json({
      success: true,
      detected: result.games,
      matchedGames,
      scansUsed: scanCount + 1,
      scansRemaining: freeLimit - scanCount - 1
    });

  } catch (error) {
    console.error('Error in /api/scan/image:', error);

    // Clean up file on error
    if (req.file) {
      const fs = require('fs');
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * Track user scan (for free tier limits)
 */
app.post('/api/scan/track', async (req, res) => {
  try {
    const { userId, gameIds } = req.body;

    if (!userId || !gameIds) {
      return res.status(400).json({ error: 'userId and gameIds required' });
    }

    // Check daily scan limit
    const scanCount = await database.getUserScanCount(userId);
    const freeLimit = parseInt(process.env.FREE_TIER_SCANS) || 3;

    if (scanCount >= freeLimit) {
      return res.status(429).json({
        error: 'Scan limit reached',
        message: 'Upgrade to Pro for unlimited scans',
        scansUsed: scanCount,
        limit: freeLimit
      });
    }

    // Track the scan
    await database.trackUserScan(userId, gameIds);

    res.json({
      success: true,
      scansUsed: scanCount + 1,
      scansRemaining: freeLimit - scanCount - 1
    });

  } catch (error) {
    console.error('Error in /api/scan/track:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete games by name (admin only - add auth in production)
 * Body: { state: 'nc', names: ['Game Name 1', 'Game Name 2'] }
 */
app.delete('/api/admin/games', async (req, res) => {
  try {
    const { state, names } = req.body;

    if (!state || !names || !Array.isArray(names)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must include state and names array'
      });
    }

    if (!isValidState(state)) {
      return res.status(400).json({
        error: 'Invalid state',
        message: `Supported states: ${SUPPORTED_STATES.map(s => s.toUpperCase()).join(', ')}`
      });
    }

    const result = await database.deleteGamesByName(state.toLowerCase(), names);

    res.json({
      success: true,
      deleted: result.deleted,
      games: result.games,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting games:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manual scrape trigger (admin only - add auth in production)
 * Query params: state (optional - defaults to all states)
 */
app.post('/api/admin/scrape', async (req, res) => {
  try {
    const { state } = req.query;

    // If state specified, validate it
    if (state && !isValidState(state)) {
      return res.status(400).json({
        error: 'Invalid state',
        message: `Supported states: ${SUPPORTED_STATES.map(s => s.toUpperCase()).join(', ')}`
      });
    }

    // Determine which states to scrape
    const statesToScrape = state ? [state.toLowerCase()] : SUPPORTED_STATES;
    console.log(`Manual scrape triggered for: ${statesToScrape.join(', ').toUpperCase()}`);

    const results = [];

    // Scrape each state
    for (const stateCode of statesToScrape) {
      try {
        console.log(`\nScraping ${stateCode.toUpperCase()}...`);
        const scraper = getScraper(stateCode);
        const stateResults = await scraper.scrapeAllGames();

        if (stateResults.length > 0) {
          await database.upsertGames(stateResults);
          results.push({
            state: stateCode.toUpperCase(),
            gamesScraped: stateResults.length
          });
        } else {
          results.push({
            state: stateCode.toUpperCase(),
            gamesScraped: 0,
            warning: 'No games found'
          });
        }
      } catch (error) {
        console.error(`Error scraping ${stateCode.toUpperCase()}:`, error.message);
        results.push({
          state: stateCode.toUpperCase(),
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in manual scrape:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== SCRAPING CRON JOB ====================

/**
 * Daily scrape job - runs at 2 AM
 * Scrapes all supported states
 */
cron.schedule('0 2 * * *', async () => {
  console.log('\n=== Starting scheduled scrape for all states ===');

  for (const stateCode of SUPPORTED_STATES) {
    try {
      console.log(`\n--- Scraping ${stateCode.toUpperCase()} ---`);
      const scraper = getScraper(stateCode);
      const results = await scraper.scrapeAllGames();

      if (results.length > 0) {
        await database.upsertGames(results);
        console.log(`✓ ${stateCode.toUpperCase()} scrape completed: ${results.length} games updated`);
      } else {
        console.log(`⚠ ${stateCode.toUpperCase()} scrape returned no results`);
      }

    } catch (error) {
      console.error(`✗ ${stateCode.toUpperCase()} scrape failed:`, error.message);
    }
  }

  console.log('\n=== Scheduled scrape completed ===');
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== SERVER START ====================

app.listen(PORT, async () => {
  console.log(`\n🚀 ScratchIQ Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Check database connection
  const dbHealthy = await database.healthCheck();
  console.log(`💾 Database: ${dbHealthy ? '✓ Connected' : '✗ Disconnected'}`);

  // Run initial scrape on startup (optional)
  if (process.env.SCRAPE_ON_STARTUP === 'true') {
    console.log('\n📡 Running initial scrape for all states...');

    for (const stateCode of SUPPORTED_STATES) {
      try {
        console.log(`\nScraping ${stateCode.toUpperCase()}...`);
        const scraper = getScraper(stateCode);
        const results = await scraper.scrapeAllGames();

        if (results.length > 0) {
          await database.upsertGames(results);
          console.log(`✓ ${stateCode.toUpperCase()}: ${results.length} games`);
        }
      } catch (error) {
        console.error(`✗ ${stateCode.toUpperCase()} failed:`, error.message);
      }
    }
  }

  console.log('\n✓ Server ready\n');
});

module.exports = app;
