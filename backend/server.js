/**
 * ScratchIQ Backend Server
 * Main Express API server with cron jobs for scraping
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const NCLotteryScraper = require('./services/scraper');
const database = require('./services/database');

const app = express();
const PORT = process.env.PORT || 3001;

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

    // Validate state (only NC supported in MVP)
    if (state.toLowerCase() !== 'nc') {
      return res.status(400).json({
        error: 'Invalid state',
        message: 'Only NC (North Carolina) is supported in MVP'
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

    if (state.toLowerCase() !== 'nc') {
      return res.status(400).json({
        error: 'Invalid state',
        message: 'Only NC is supported in MVP'
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

    if (state.toLowerCase() !== 'nc') {
      return res.status(400).json({ error: 'Only NC is supported in MVP' });
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
 * Manual scrape trigger (admin only - add auth in production)
 */
app.post('/api/admin/scrape', async (req, res) => {
  try {
    console.log('Manual scrape triggered');

    // Run scrape
    const scraper = new NCLotteryScraper(process.env.BROWSERBASE_API_KEY, {
      maxGames: process.env.MAX_GAMES_PER_SCRAPE || 20,
      scrapeDelay: process.env.SCRAPE_DELAY_MS || 2000
    });

    const results = await scraper.scrapeAllGames();

    if (results.length > 0) {
      await database.upsertGames(results);
    }

    res.json({
      success: true,
      gamesScraped: results.length,
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
 */
cron.schedule('0 2 * * *', async () => {
  console.log('\n=== Starting scheduled scrape ===');

  try {
    const scraper = new NCLotteryScraper(process.env.BROWSERBASE_API_KEY, {
      maxGames: process.env.MAX_GAMES_PER_SCRAPE || 20,
      scrapeDelay: process.env.SCRAPE_DELAY_MS || 2000
    });

    const results = await scraper.scrapeAllGames();

    if (results.length > 0) {
      await database.upsertGames(results);
      console.log(`✓ Scheduled scrape completed: ${results.length} games updated`);
    } else {
      console.log('⚠ Scheduled scrape returned no results');
    }

  } catch (error) {
    console.error('✗ Scheduled scrape failed:', error.message);
  }
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
    console.log('\n📡 Running initial scrape...');
    try {
      const scraper = new NCLotteryScraper(process.env.BROWSERBASE_API_KEY, {
        maxGames: process.env.MAX_GAMES_PER_SCRAPE || 20
      });

      const results = await scraper.scrapeAllGames();

      if (results.length > 0) {
        await database.upsertGames(results);
      }
    } catch (error) {
      console.error('Initial scrape failed:', error.message);
    }
  }

  console.log('\n✓ Server ready\n');
});

module.exports = app;
