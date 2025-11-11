/**
 * Test Scraper Script
 * Quick test of scraping functionality without full server
 */

require('dotenv').config();
const NCLotteryScraper = require('./services/scraper');
const database = require('./services/database');

async function testScraper() {
  console.log('\n=== ScratchIQ Scraper Test ===\n');

  // Check environment
  console.log('Environment Check:');
  console.log('✓ Node version:', process.version);
  console.log('✓ Browserbase API Key:', process.env.BROWSERBASE_API_KEY ? 'Set' : 'Missing (will use local Playwright)');
  console.log('✓ Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
  console.log('✓ Supabase Key:', process.env.SUPABASE_KEY ? 'Set' : 'Missing');
  console.log('');

  // Test database connection
  console.log('Testing database connection...');
  const dbHealthy = await database.healthCheck();
  console.log(dbHealthy ? '✓ Database connected' : '✗ Database connection failed');
  console.log('');

  if (!dbHealthy) {
    console.log('⚠️  Database not connected. Data will be displayed but not saved.');
    console.log('');
  }

  // Initialize scraper
  console.log('Initializing scraper...');
  const scraper = new NCLotteryScraper(process.env.BROWSERBASE_API_KEY, {
    maxGames: 5, // Only scrape 5 games for testing
    scrapeDelay: 1000, // Faster for testing
    headless: true
  });
  console.log('✓ Scraper initialized');
  console.log('');

  // Run scrape
  console.log('Starting scrape (this may take 2-3 minutes)...');
  console.log('Scraping up to 5 games from NC Lottery...');
  console.log('');

  const startTime = Date.now();
  const results = await scraper.scrapeAllGames();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('');
  console.log('=== Scrape Results ===');
  console.log(`Duration: ${duration}s`);
  console.log(`Games found: ${results.length}`);
  console.log('');

  if (results.length === 0) {
    console.log('⚠️  No games found. Possible issues:');
    console.log('  - NC Lottery website structure changed');
    console.log('  - Network issues');
    console.log('  - Browserbase rate limits');
    console.log('');
    console.log('Try running with DEBUG=* for more info');
    return;
  }

  // Display results
  console.log('Top 3 Games by Value Score:');
  console.log('─'.repeat(80));

  const topGames = results
    .sort((a, b) => b.value_score - a.value_score)
    .slice(0, 3);

  topGames.forEach((game, i) => {
    console.log(`${i + 1}. ${game.name}`);
    console.log(`   Price: $${game.price} | EV: ${(game.ev * 100).toFixed(1)}% | Score: ${game.value_score}/100`);
    console.log(`   Top Prize: $${game.top_prize_amount?.toLocaleString()} (${game.top_prize_remaining} left)`);
    console.log(`   Hot Ticket: ${game.is_hot ? '🔥 YES' : 'No'}`);
    console.log(`   Prizes: ${game.prizes?.length || 0} tiers`);
    console.log('');
  });

  // Save to database if connected
  if (dbHealthy && results.length > 0) {
    console.log('Saving to database...');
    try {
      await database.upsertGames(results);
      console.log('✓ Data saved successfully');
      console.log('');
      console.log('You can now query games via API:');
      console.log('  GET http://localhost:3001/api/games/nc');
    } catch (error) {
      console.error('✗ Failed to save to database:', error.message);
    }
  }

  console.log('');
  console.log('=== Test Complete ===');
  console.log('');

  // Show sample JSON
  if (results.length > 0) {
    console.log('Sample Game JSON:');
    console.log(JSON.stringify(results[0], null, 2));
  }

  process.exit(0);
}

// Run test
testScraper().catch(error => {
  console.error('\n✗ Test failed with error:');
  console.error(error);
  process.exit(1);
});
