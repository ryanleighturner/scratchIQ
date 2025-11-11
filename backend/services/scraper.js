/**
 * NC Lottery Scraper Service
 * Uses Browserbase for reliable headless scraping of dynamic content
 */

require('dotenv').config();
const { chromium } = require('playwright');
const { calculateEV, getTopPrizeInfo, isHotTicket, calculateValueScore } = require('../utils/evCalculator');

class NCLotteryScraper {
  constructor(options = {}) {
    this.baseUrl = 'https://nclottery.com';
    this.scrapeDelay = options.scrapeDelay || 2000;
    this.maxGames = options.maxGames || 20;
    this.headless = options.headless !== false;
  }

  /**
   * Initialize local Playwright browser
   */
  async initBrowser() {
    try {
      console.log('Launching local Playwright browser...');
      const browser = await chromium.launch({
        headless: this.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      console.log('✓ Browser launched successfully');
      return { browser };
    } catch (error) {
      console.error('Failed to launch browser:', error.message);
      throw error;
    }
  }

  /**
   * Scrape games list from NC Lottery homepage
   */
  async scrapeGamesList(page) {
    console.log('Navigating to NC Lottery scratch-offs page...');

    try {
      await page.goto(`${this.baseUrl}/scratch-offs`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for game cards to load
      await page.waitForSelector('.scratchoff-game, .game-card, [class*="game"]', { timeout: 10000 });

      // Extract games - adjust selectors based on actual NC Lottery site structure
      const games = await page.evaluate(() => {
        const gameElements = document.querySelectorAll('.scratchoff-game, .game-card, [class*="game-item"]');
        const results = [];

        gameElements.forEach((card, index) => {
          try {
            // Flexible selector approach - adjust based on actual site
            const nameEl = card.querySelector('.game-name, [class*="name"], h3, h4');
            const priceEl = card.querySelector('.game-price, [class*="price"], .cost');
            const idEl = card.querySelector('.game-id, [class*="game-number"]');
            const linkEl = card.querySelector('a[href*="scratch"], a[href*="game"]');

            // NEW: Extract ticket image
            const imageEl = card.querySelector('img, [class*="ticket-image"], [class*="game-image"]');

            if (nameEl && priceEl) {
              const name = nameEl.textContent.trim();
              const priceText = priceEl.textContent.trim();
              const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

              // Extract game ID from various sources
              let gameId = idEl ? idEl.textContent.trim() : null;
              if (!gameId && linkEl) {
                const urlMatch = linkEl.href.match(/game[/-](\d+)/i);
                gameId = urlMatch ? urlMatch[1] : `game-${index}`;
              }

              const url = linkEl ? linkEl.href : null;

              // Get image URL
              let imageUrl = null;
              if (imageEl) {
                imageUrl = imageEl.src || imageEl.getAttribute('data-src');
                // Make sure it's absolute URL
                if (imageUrl && !imageUrl.startsWith('http')) {
                  imageUrl = `https://nclottery.com${imageUrl}`;
                }
              }

              if (price > 0 && url) {
                results.push({
                  id: gameId || `game-${index}`,
                  name,
                  price: price.toFixed(2),
                  url: url.startsWith('http') ? url : `https://nclottery.com${url}`,
                  image_url: imageUrl
                });
              }
            }
          } catch (err) {
            console.error('Error parsing game card:', err.message);
          }
        });

        return results;
      });

      console.log(`Found ${games.length} games`);
      return games.slice(0, this.maxGames);

    } catch (error) {
      console.error('Error scraping games list:', error.message);
      return [];
    }
  }

  /**
   * Scrape prize data for a specific game
   */
  async scrapePrizeData(page, gameUrl) {
    try {
      await page.goto(gameUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Try to click prizes tab if it exists
      try {
        const prizesTab = await page.$('#prizes-tab, [href*="prizes"], button:has-text("Prizes")');
        if (prizesTab) {
          await prizesTab.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        // Tab might not exist or already visible
      }

      // Wait for prize table
      await page.waitForSelector('table, .prize-table, [class*="prize"]', { timeout: 5000 });

      // Extract prize data and ticket image from detail page
      const pageData = await page.evaluate(() => {
        // Get prizes
        const rows = document.querySelectorAll('table tr, .prize-row, [class*="prize-item"]');
        const prizes = [];

        rows.forEach(row => {
          try {
            const cells = row.querySelectorAll('td, .prize-cell, [class*="cell"]');

            if (cells.length >= 3) {
              // Typical format: [Prize Amount, Total Available, Remaining]
              const prizeAmt = cells[0].textContent.trim();
              const total = cells[1].textContent.trim();
              const remaining = cells[2].textContent.trim();

              // Parse numbers
              const totalNum = parseInt(total.replace(/[^0-9]/g, '')) || 0;
              const remainingNum = parseInt(remaining.replace(/[^0-9]/g, '')) || 0;

              if (prizeAmt && totalNum > 0) {
                prizes.push({
                  prize_amt: prizeAmt,
                  total: totalNum,
                  remaining: remainingNum
                });
              }
            }
          } catch (err) {
            // Skip malformed rows
          }
        });

        // Get odds info
        const oddsEl = document.querySelector('[class*="odds"], .game-odds, .overall-odds');
        const oddsInfo = oddsEl ? oddsEl.textContent.trim() : null;

        // Get ticket image (might be larger/better quality on detail page)
        const detailImageEl = document.querySelector('.ticket-image, .game-detail-image, img[class*="ticket"], img[alt*="ticket"]');
        let imageUrl = null;
        if (detailImageEl) {
          imageUrl = detailImageEl.src || detailImageEl.getAttribute('data-src');
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = window.location.origin + imageUrl;
          }
        }

        return { prizes, oddsInfo, imageUrl };
      });

      return pageData;

    } catch (error) {
      console.error(`Error scraping prize data for ${gameUrl}:`, error.message);
      return { prizes: [], oddsInfo: null, imageUrl: null };
    }
  }

  /**
   * Main scrape function - orchestrates the full scrape process
   */
  async scrapeAllGames() {
    let browser = null;

    try {
      console.log('Starting NC Lottery scrape...');
      const browserContext = await this.initBrowser();
      browser = browserContext.browser;

      const page = await browser.newPage();

      // Set realistic headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      // Step 1: Get games list
      const games = await this.scrapeGamesList(page);

      if (games.length === 0) {
        console.log('No games found - site structure may have changed');
        await browser.close();
        return [];
      }

      // Step 2: Scrape prize data for each game
      const results = [];

      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        console.log(`Scraping ${i + 1}/${games.length}: ${game.name}`);

        const { prizes, oddsInfo, imageUrl } = await this.scrapePrizeData(page, game.url);

        if (prizes.length > 0) {
          // Calculate EV and other metrics
          const price = parseFloat(game.price);
          const ev = calculateEV(prizes, price);
          const topPrizeInfo = getTopPrizeInfo(prizes);
          const hot = isHotTicket(ev);
          const valueScore = calculateValueScore(ev, topPrizeInfo, price);

          // Use detail page image if available, otherwise use listing image
          const finalImageUrl = imageUrl || game.image_url;

          results.push({
            ...game,
            image_url: finalImageUrl, // Ensure we have the best image URL
            prizes,
            odds_info: oddsInfo,
            ev,
            top_prize_amount: topPrizeInfo.amount,
            top_prize_remaining: topPrizeInfo.remaining,
            is_hot: hot,
            value_score: valueScore,
            scraped_at: new Date().toISOString(),
            state: 'nc'
          });
        }

        // Rate limiting
        if (i < games.length - 1) {
          await page.waitForTimeout(this.scrapeDelay);
        }
      }

      // Cleanup
      await browser.close();

      console.log(`✓ Scrape completed: ${results.length} games with prize data`);
      return results;

    } catch (error) {
      console.error('✗ Fatal error during scrape:', error);

      // Cleanup on error
      if (browser) {
        await browser.close().catch(() => {});
      }

      return [];
    }
  }
}

// Export scraper instance
module.exports = NCLotteryScraper;

// Allow running as standalone script
if (require.main === module) {
  (async () => {
    const scraper = new NCLotteryScraper({
      maxGames: process.env.MAX_GAMES_PER_SCRAPE || 20,
      headless: true
    });

    const results = await scraper.scrapeAllGames();
    console.log('\n=== Scrape Results ===');
    console.log(JSON.stringify(results, null, 2));
  })();
}
