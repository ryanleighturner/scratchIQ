/**
 * PA Lottery Scraper Service
 * Scrapes Pennsylvania Lottery scratch-off games and prize information
 */

require('dotenv').config();
const { chromium } = require('playwright');
const { calculateEV, getTopPrizeInfo, isHotTicket, calculateValueScore } = require('../utils/evCalculator');

class PALotteryScraper {
  constructor(options = {}) {
    this.baseUrl = 'https://www.palottery.com';
    this.scrapeDelay = options.scrapeDelay || 2000;
    this.maxGames = options.maxGames || 50;
    this.headless = options.headless !== false;
  }

  /**
   * Initialize local Playwright browser
   */
  async initBrowser() {
    try {
      console.log('Launching local Playwright browser for PA...');
      const browser = await chromium.launch({
        headless: this.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
      });

      console.log('✓ Browser launched successfully');
      return { browser };
    } catch (error) {
      console.error('Failed to launch browser:', error.message);
      throw error;
    }
  }

  /**
   * Scrape games list from PA Lottery homepage
   */
  async scrapeGamesList(page) {
    console.log('Navigating to PA Lottery scratch-offs page...');

    try {
      // PA Lottery URL for active scratch-off games
      await page.goto(`${this.baseUrl}/scratch-offs/active-games.aspx`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      // Wait a bit for JS to load
      await page.waitForTimeout(3000);

      // Wait for content to load - try multiple possible selectors
      try {
        await page.waitForSelector('.game, .scratch-off, [class*="game"], table, .scratchCard', { timeout: 10000 });
      } catch (e) {
        // Try to continue anyway, selector might not match
        console.log('Timeout waiting for selectors, continuing anyway...');
      }

      // Save page content for debugging if needed
      const htmlContent = await page.content();
      if (htmlContent.length < 500) {
        console.log('Warning: Page content seems too short:', htmlContent.substring(0, 300));
      }

      // Extract games - PA lottery might use table or card layout
      let games = [];
      try {
        games = await page.evaluate(() => {
        const results = [];

        // Try multiple approaches for different PA lottery layouts

        // Approach 1: Table-based layout (common for government lottery sites)
        const tableRows = document.querySelectorAll('table tr, .game-row, [class*="game-row"]');
        if (tableRows.length > 1) { // More than just header
          tableRows.forEach((row, index) => {
            try {
              const cells = row.querySelectorAll('td, .cell, [class*="cell"]');
              if (cells.length >= 3) {
                const gameNum = cells[0]?.textContent?.trim();
                const gameName = cells[1]?.textContent?.trim();
                const priceText = cells[2]?.textContent?.trim();

                // Find link
                const linkEl = row.querySelector('a[href*="game"], a[href*="scratch"], a');
                const imageEl = row.querySelector('img');

                if (gameName && priceText) {
                  const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

                  if (price > 0 && linkEl) {
                    let imageUrl = null;
                    if (imageEl) {
                      imageUrl = imageEl.src || imageEl.getAttribute('data-src');
                      if (imageUrl && !imageUrl.startsWith('http')) {
                        imageUrl = `https://www.palottery.com${imageUrl}`;
                      }
                    }

                    results.push({
                      id: gameNum || `game-${index}`,
                      name: gameName,
                      price: price.toFixed(2),
                      url: linkEl.href.startsWith('http') ? linkEl.href : `https://www.palottery.com${linkEl.href}`,
                      image_url: imageUrl
                    });
                  }
                }
              }
            } catch (err) {
              // Skip malformed rows
            }
          });
        }

        // Approach 2: Card-based layout (if table approach didn't work)
        if (results.length === 0) {
          const gameCards = document.querySelectorAll('.game, .game-card, .scratch-off, [class*="game-item"]');
          gameCards.forEach((card, index) => {
            try {
              const nameEl = card.querySelector('.game-name, .name, h3, h4, .title, [class*="name"]');
              const priceEl = card.querySelector('.price, .cost, [class*="price"]');
              const idEl = card.querySelector('.game-id, .number, [class*="number"]');
              const linkEl = card.querySelector('a[href*="scratch"], a[href*="game"], a');
              const imageEl = card.querySelector('img');

              if (nameEl && priceEl) {
                const name = nameEl.textContent.trim();
                const priceText = priceEl.textContent.trim();
                const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

                let gameId = idEl ? idEl.textContent.trim() : null;
                if (!gameId && linkEl) {
                  const urlMatch = linkEl.href.match(/game[/-]?(\d+)/i);
                  gameId = urlMatch ? urlMatch[1] : `game-${index}`;
                }

                const url = linkEl ? (linkEl.href.startsWith('http') ? linkEl.href : `https://www.palottery.com${linkEl.href}`) : null;

                let imageUrl = null;
                if (imageEl) {
                  imageUrl = imageEl.src || imageEl.getAttribute('data-src');
                  if (imageUrl && !imageUrl.startsWith('http')) {
                    imageUrl = `https://www.palottery.com${imageUrl}`;
                  }
                }

                if (price > 0 && url) {
                  results.push({
                    id: gameId || `game-${index}`,
                    name,
                    price: price.toFixed(2),
                    url,
                    image_url: imageUrl
                  });
                }
              }
            } catch (err) {
              // Skip malformed cards
            }
          });
        }

          return results;
        });
      } catch (evalError) {
        console.error('Error during page.evaluate:', evalError.message);
        games = [];
      }

      console.log(`Found ${games.length} PA games`);
      return games.slice(0, this.maxGames);

    } catch (error) {
      console.error('Error scraping PA games list:', error.message);
      return [];
    }
  }

  /**
   * Scrape prize data for a specific game
   */
  async scrapePrizeData(page, gameUrl) {
    try {
      await page.goto(gameUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Try to find and click prizes/odds tab if it exists
      try {
        const prizesTab = await page.$('[href*="prizes"], [href*="odds"], button:has-text("Prizes"), button:has-text("Odds")');
        if (prizesTab) {
          await prizesTab.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        // Tab might not exist or already visible
      }

      // Wait for prize table
      await page.waitForSelector('table, .prize-table, .prizes, [class*="prize"]', { timeout: 5000 });

      // Extract prize data and total tickets info
      const pageData = await page.evaluate(() => {
        const prizes = [];

        // Find prize table rows
        const tables = document.querySelectorAll('table');
        let prizeRows = [];

        // Find the right table (usually has "prize" in class or nearby text)
        for (const table of tables) {
          const tableText = table.textContent.toLowerCase();
          if (tableText.includes('prize') || tableText.includes('remaining') || tableText.includes('available')) {
            prizeRows = table.querySelectorAll('tr');
            break;
          }
        }

        // If no table found, try other selectors
        if (prizeRows.length === 0) {
          prizeRows = document.querySelectorAll('.prize-row, [class*="prize-row"]');
        }

        prizeRows.forEach((row, idx) => {
          try {
            // Skip header rows
            const isHeader = row.querySelector('th');
            if (isHeader && idx === 0) return;

            const cells = row.querySelectorAll('td, th, .cell');

            if (cells.length >= 2) {
              // PA lottery typically shows: Prize Amount | Prizes Available (or Remaining)
              // Could be: Prize | Total | Remaining
              let prizeAmt = '';
              let remaining = 0;

              // Try to find prize amount (usually has $ sign)
              for (let i = 0; i < cells.length; i++) {
                const cellText = cells[i].textContent.trim();
                if (cellText.includes('$') && !prizeAmt) {
                  prizeAmt = cellText;
                }
              }

              // Try to find remaining count (usually a number)
              for (let i = cells.length - 1; i >= 0; i--) {
                const cellText = cells[i].textContent.trim();
                const num = parseInt(cellText.replace(/[^0-9]/g, ''));
                if (num > 0 && !cellText.includes('$')) {
                  remaining = num;
                  break;
                }
              }

              if (prizeAmt && remaining > 0) {
                // Clean up prize amount
                const prizeValue = parseFloat(prizeAmt.replace(/[^0-9.]/g, ''));
                if (prizeValue > 0) {
                  prizes.push({
                    prize_amt: prizeAmt,
                    total: remaining, // PA might not show total, use remaining
                    remaining: remaining
                  });
                }
              }
            }
          } catch (err) {
            // Skip malformed rows
          }
        });

        // Get odds info
        const oddsEl = document.querySelector('[class*="odds"], .odds, .overall-odds, [id*="odds"]');
        const oddsInfo = oddsEl ? oddsEl.textContent.trim() : null;

        // Extract total tickets printed (for better EV calculation)
        let totalTickets = null;
        const bodyText = document.body.textContent;
        const ticketMatch = bodyText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:tickets|total\s*tickets)/i);
        if (ticketMatch) {
          totalTickets = parseInt(ticketMatch[1].replace(/,/g, ''));
        }

        // Get ticket image
        const detailImageEl = document.querySelector('.ticket-image, .game-image, img[alt*="ticket"], img[class*="ticket"]');
        let imageUrl = null;
        if (detailImageEl) {
          imageUrl = detailImageEl.src || detailImageEl.getAttribute('data-src');
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = window.location.origin + imageUrl;
          }
        }

        return { prizes, oddsInfo, imageUrl, totalTickets };
      });

      return pageData;

    } catch (error) {
      console.error(`Error scraping prize data for ${gameUrl}:`, error.message);
      return { prizes: [], oddsInfo: null, imageUrl: null, totalTickets: null };
    }
  }

  /**
   * Main scrape function - orchestrates the full scrape process
   */
  async scrapeAllGames() {
    let browser = null;

    try {
      console.log('Starting PA Lottery scrape...');
      const browserContext = await this.initBrowser();
      browser = browserContext.browser;

      const context = await browser.newContext({
        ignoreHTTPSErrors: true
      });
      const page = await context.newPage();

      // Set realistic headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      // Step 1: Get games list
      const games = await this.scrapeGamesList(page);

      if (games.length === 0) {
        console.log('No PA games found - site structure may have changed');
        await browser.close();
        return [];
      }

      // Step 2: Scrape prize data for each game
      const results = [];

      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        console.log(`Scraping PA ${i + 1}/${games.length}: ${game.name}`);

        const { prizes, oddsInfo, imageUrl, totalTickets } = await this.scrapePrizeData(page, game.url);

        if (prizes.length > 0) {
          // Calculate EV and other metrics
          const price = parseFloat(game.price);
          // Use actual total tickets if available, otherwise use default
          const estimatedTotal = totalTickets || 4000000;
          const ev = calculateEV(prizes, price, estimatedTotal);
          const topPrizeInfo = getTopPrizeInfo(prizes);
          const hot = isHotTicket(ev);
          const valueScore = calculateValueScore(ev, topPrizeInfo, price);

          // Use detail page image if available, otherwise use listing image
          const finalImageUrl = imageUrl || game.image_url;

          results.push({
            ...game,
            image_url: finalImageUrl,
            prizes,
            odds_info: oddsInfo,
            ev,
            top_prize_amount: topPrizeInfo.amount,
            top_prize_remaining: topPrizeInfo.remaining,
            is_hot: hot,
            value_score: valueScore,
            scraped_at: new Date().toISOString(),
            state: 'pa'
          });
        }

        // Rate limiting
        if (i < games.length - 1) {
          await page.waitForTimeout(this.scrapeDelay);
        }
      }

      // Cleanup
      await browser.close();

      console.log(`✓ PA Scrape completed: ${results.length} games with prize data`);
      return results;

    } catch (error) {
      console.error('✗ Fatal error during PA scrape:', error);

      // Cleanup on error
      if (browser) {
        await browser.close().catch(() => {});
      }

      return [];
    }
  }
}

// Export scraper instance
module.exports = PALotteryScraper;

// Allow running as standalone script
if (require.main === module) {
  (async () => {
    const scraper = new PALotteryScraper({
      maxGames: process.env.MAX_GAMES_PER_SCRAPE || 50,
      headless: true
    });

    const results = await scraper.scrapeAllGames();
    console.log('\n=== PA Scrape Results ===');
    console.log(JSON.stringify(results, null, 2));
  })();
}
