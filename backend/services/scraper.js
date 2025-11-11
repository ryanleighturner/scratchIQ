/**
 * NC Lottery Scraper Service
 * Uses Browserbase for reliable headless scraping of dynamic content
 */

require('dotenv').config();
const { chromium } = require('playwright');
const { calculateEV, getTopPrizeInfo, isHotTicket, calculateValueScore } = require('../utils/evCalculator');

class NCLotteryScraper {
  constructor(browserbaseApiKey, options = {}) {
    this.browserbaseApiKey = browserbaseApiKey;
    this.baseUrl = 'https://nclottery.com';
    this.scrapeDelay = options.scrapeDelay || 2000;
    this.maxGames = options.maxGames || 20;
    this.headless = options.headless !== false;
  }

  /**
   * Initialize Browserbase session
   */
  async initBrowser() {
    try {
      // For Browserbase, you'd typically use their SDK to get a connection URL
      // This is a simplified version - adjust based on Browserbase's actual API
      const Browserbase = require('browserbase');
      const client = new Browserbase(this.browserbaseApiKey);

      const session = await client.sessions.create({
        headless: this.headless,
        proxyCountry: 'US',
        browserSettings: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const browser = await chromium.connectOverCDP(session.connectUrl);

      return { browser, session, client };
    } catch (error) {
      console.error('Browserbase initialization failed, using local Playwright:', error.message);
      // Fallback to local Playwright for development
      const browser = await chromium.launch({
        headless: this.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      return { browser, session: null, client: null };
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

              if (price > 0 && url) {
                results.push({
                  id: gameId || `game-${index}`,
                  name,
                  price: price.toFixed(2),
                  url: url.startsWith('http') ? url : `https://nclottery.com${url}`
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

      // Extract prize data
      const prizes = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tr, .prize-row, [class*="prize-item"]');
        const results = [];

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
                results.push({
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

        return results;
      });

      // Try to extract game odds for better ticket estimation
      const oddsInfo = await page.evaluate(() => {
        const oddsEl = document.querySelector('[class*="odds"], .game-odds, .overall-odds');
        return oddsEl ? oddsEl.textContent.trim() : null;
      });

      return { prizes, oddsInfo };

    } catch (error) {
      console.error(`Error scraping prize data for ${gameUrl}:`, error.message);
      return { prizes: [], oddsInfo: null };
    }
  }

  /**
   * Main scrape function - orchestrates the full scrape process
   */
  async scrapeAllGames() {
    let browserContext = null;

    try {
      console.log('Starting NC Lottery scrape...');
      browserContext = await this.initBrowser();
      const { browser, session } = browserContext;

      const page = await browser.newPage();

      // Set realistic headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      });

      // Step 1: Get games list
      const games = await this.scrapeGamesList(page);

      if (games.length === 0) {
        console.log('No games found - site structure may have changed');
        return [];
      }

      // Step 2: Scrape prize data for each game
      const results = [];

      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        console.log(`Scraping ${i + 1}/${games.length}: ${game.name}`);

        const { prizes, oddsInfo } = await this.scrapePrizeData(page, game.url);

        if (prizes.length > 0) {
          // Calculate EV and other metrics
          const price = parseFloat(game.price);
          const ev = calculateEV(prizes, price);
          const topPrizeInfo = getTopPrizeInfo(prizes);
          const hot = isHotTicket(ev);
          const valueScore = calculateValueScore(ev, topPrizeInfo, price);

          results.push({
            ...game,
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
      if (session && browserContext.client) {
        await browserContext.client.sessions.delete(session.id);
      }

      console.log(`Scrape completed: ${results.length} games with prize data`);
      return results;

    } catch (error) {
      console.error('Fatal error during scrape:', error);

      // Cleanup on error
      if (browserContext?.browser) {
        await browserContext.browser.close();
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
    const scraper = new NCLotteryScraper(process.env.BROWSERBASE_API_KEY, {
      maxGames: process.env.MAX_GAMES_PER_SCRAPE || 20
    });

    const results = await scraper.scrapeAllGames();
    console.log('\n=== Scrape Results ===');
    console.log(JSON.stringify(results, null, 2));
  })();
}
