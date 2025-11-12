/**
 * MD Lottery Scraper Service
 * Scrapes Maryland Lottery scratch-off games and prize information
 */

require('dotenv').config();
const { chromium } = require('playwright');
const { calculateEV, getTopPrizeInfo, isHotTicket, calculateValueScore } = require('../utils/evCalculator');

class MDLotteryScraper {
  constructor(options = {}) {
    this.baseUrl = 'https://www.mdlottery.com';
    this.scrapeDelay = options.scrapeDelay || 2000;
    this.maxGames = options.maxGames || 50;
    this.headless = options.headless !== false;
  }

  /**
   * Initialize local Playwright browser
   */
  async initBrowser() {
    try {
      console.log('Launching local Playwright browser for MD...');
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
   * Scrape games list from MD Lottery homepage
   */
  async scrapeGamesList(page) {
    console.log('Navigating to MD Lottery scratch-offs page...');

    try {
      // MD Lottery URL for scratch-off games
      await page.goto(`${this.baseUrl}/games/scratch-offs/`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      // Wait a bit for JS to load
      await page.waitForTimeout(3000);

      // Wait for content to load - try multiple possible selectors
      try {
        await page.waitForSelector('.game, .scratch-off, [class*="game"], .product', { timeout: 10000 });
      } catch (e) {
        console.log('Timeout waiting for selectors, continuing anyway...');
      }

      // Extract games
      const games = await page.evaluate(() => {
        const results = [];

        // Try multiple approaches for different MD lottery layouts

        // Approach 1: Card/Product based layout
        const gameCards = document.querySelectorAll('.game, .game-card, .product, .scratch-off, [class*="game-item"], [class*="product"]');

        gameCards.forEach((card, index) => {
          try {
            const nameEl = card.querySelector('.game-name, .name, .title, h3, h4, h2, [class*="name"], [class*="title"]');
            const priceEl = card.querySelector('.price, .cost, [class*="price"], [class*="cost"]');
            const idEl = card.querySelector('.game-id, .game-number, .number, [class*="number"], [class*="game-id"]');
            const linkEl = card.querySelector('a[href*="scratch"], a[href*="game"], a');
            const imageEl = card.querySelector('img');

            if (nameEl && (priceEl || linkEl)) {
              const name = nameEl.textContent.trim();

              // Try to get price from element or link
              let price = 0;
              if (priceEl) {
                const priceText = priceEl.textContent.trim();
                price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
              }

              // If price not found, try to extract from name or other elements
              if (price === 0) {
                const cardText = card.textContent;
                const priceMatch = cardText.match(/\$(\d+)/);
                if (priceMatch) {
                  price = parseFloat(priceMatch[1]);
                }
              }

              let gameId = idEl ? idEl.textContent.trim() : null;
              if (!gameId && linkEl) {
                const urlMatch = linkEl.href.match(/game[/-]?(\d+)|(\d{3,})/i);
                gameId = urlMatch ? (urlMatch[1] || urlMatch[2]) : `game-${index}`;
              }

              const url = linkEl ? (linkEl.href.startsWith('http') ? linkEl.href : `https://www.mdlottery.com${linkEl.href}`) : null;

              let imageUrl = null;
              if (imageEl) {
                imageUrl = imageEl.src || imageEl.getAttribute('data-src') || imageEl.getAttribute('data-lazy-src');
                if (imageUrl && !imageUrl.startsWith('http')) {
                  imageUrl = `https://www.mdlottery.com${imageUrl}`;
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

        // Approach 2: List-based layout (if cards didn't work)
        if (results.length === 0) {
          const listItems = document.querySelectorAll('li, .list-item, [class*="list-item"]');
          listItems.forEach((item, index) => {
            try {
              const linkEl = item.querySelector('a[href*="scratch"], a[href*="game"]');
              if (!linkEl) return;

              const nameEl = item.querySelector('.name, .title, h3, h4, strong');
              const priceEl = item.querySelector('.price, [class*="price"]');
              const imageEl = item.querySelector('img');

              if (nameEl) {
                const name = nameEl.textContent.trim();
                let price = 0;

                if (priceEl) {
                  const priceText = priceEl.textContent.trim();
                  price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
                } else {
                  const itemText = item.textContent;
                  const priceMatch = itemText.match(/\$(\d+)/);
                  if (priceMatch) {
                    price = parseFloat(priceMatch[1]);
                  }
                }

                const url = linkEl.href.startsWith('http') ? linkEl.href : `https://www.mdlottery.com${linkEl.href}`;

                let imageUrl = null;
                if (imageEl) {
                  imageUrl = imageEl.src || imageEl.getAttribute('data-src');
                  if (imageUrl && !imageUrl.startsWith('http')) {
                    imageUrl = `https://www.mdlottery.com${imageUrl}`;
                  }
                }

                if (price > 0 && url) {
                  results.push({
                    id: `game-${index}`,
                    name,
                    price: price.toFixed(2),
                    url,
                    image_url: imageUrl
                  });
                }
              }
            } catch (err) {
              // Skip malformed items
            }
          });
        }

        return results;
      });

      console.log(`Found ${games.length} MD games`);
      return games.slice(0, this.maxGames);

    } catch (error) {
      console.error('Error scraping MD games list:', error.message);
      return [];
    }
  }

  /**
   * Scrape prize data for a specific game
   */
  async scrapePrizeData(page, gameUrl) {
    try {
      await page.goto(gameUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Try to find and click prizes/odds tab or link
      try {
        const prizesLink = await page.$('[href*="prizes"], [href*="odds"], a:has-text("Prizes"), a:has-text("Odds"), button:has-text("Prizes")');
        if (prizesLink) {
          await prizesLink.click();
          await page.waitForTimeout(1500);
        }
      } catch (e) {
        // Link might not exist or already on prizes page
      }

      // Wait for prize information to load
      await page.waitForSelector('table, .prize-table, .prizes, [class*="prize"], [class*="remaining"]', { timeout: 5000 });

      // Extract prize data
      const pageData = await page.evaluate(() => {
        const prizes = [];

        // Find all tables on the page
        const tables = document.querySelectorAll('table');
        let prizeTable = null;

        // Find the prize table (usually contains "prize", "remaining", or "available" in text)
        for (const table of tables) {
          const tableText = table.textContent.toLowerCase();
          if (tableText.includes('prize') || tableText.includes('remaining') || tableText.includes('available')) {
            prizeTable = table;
            break;
          }
        }

        if (prizeTable) {
          const rows = prizeTable.querySelectorAll('tr');

          rows.forEach((row, idx) => {
            try {
              // Skip header row
              const hasHeader = row.querySelector('th');
              if (hasHeader && idx === 0) return;

              const cells = row.querySelectorAll('td, th');

              if (cells.length >= 2) {
                // MD lottery typically shows: Prize Amount | Remaining Prizes
                // Could also be: Prize | Total | Claimed | Remaining
                let prizeAmt = '';
                let total = 0;
                let remaining = 0;

                // Find prize amount (has $ sign)
                for (let i = 0; i < cells.length; i++) {
                  const cellText = cells[i].textContent.trim();
                  if (cellText.includes('$') && !prizeAmt) {
                    prizeAmt = cellText;
                  }
                }

                // Find remaining count (usually last numeric column)
                for (let i = cells.length - 1; i >= 0; i--) {
                  const cellText = cells[i].textContent.trim();
                  const num = parseInt(cellText.replace(/[^0-9]/g, ''));
                  if (num >= 0 && !cellText.includes('$')) {
                    if (remaining === 0) {
                      remaining = num;
                    } else if (total === 0) {
                      total = num;
                    }
                  }
                }

                // If we only found one number, use it as both total and remaining
                if (remaining > 0 && total === 0) {
                  total = remaining;
                }

                if (prizeAmt && remaining >= 0) {
                  const prizeValue = parseFloat(prizeAmt.replace(/[^0-9.]/g, ''));
                  if (prizeValue > 0) {
                    prizes.push({
                      prize_amt: prizeAmt,
                      total: total || remaining,
                      remaining: remaining
                    });
                  }
                }
              }
            } catch (err) {
              // Skip malformed rows
            }
          });
        }

        // Try alternative layout if no prizes found
        if (prizes.length === 0) {
          const prizeElements = document.querySelectorAll('.prize, [class*="prize-item"]');
          prizeElements.forEach(el => {
            try {
              const prizeText = el.textContent;
              const prizeMatch = prizeText.match(/\$[\d,]+/);
              const remainingMatch = prizeText.match(/(\d+)\s*(?:remaining|left|available)/i);

              if (prizeMatch && remainingMatch) {
                prizes.push({
                  prize_amt: prizeMatch[0],
                  total: parseInt(remainingMatch[1]),
                  remaining: parseInt(remainingMatch[1])
                });
              }
            } catch (err) {
              // Skip
            }
          });
        }

        // Get odds info
        const oddsEl = document.querySelector('[class*="odds"], .odds, [id*="odds"]');
        const oddsInfo = oddsEl ? oddsEl.textContent.trim() : null;

        // Extract total tickets if available
        let totalTickets = null;
        const bodyText = document.body.textContent;
        const ticketMatch = bodyText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:tickets|total)/i);
        if (ticketMatch) {
          totalTickets = parseInt(ticketMatch[1].replace(/,/g, ''));
        }

        // Get ticket image
        const detailImageEl = document.querySelector('.ticket-image, .game-image, img[alt*="ticket"], img[class*="ticket"], .game-detail img');
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
      console.log('Starting MD Lottery scrape...');
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
        console.log('No MD games found - site structure may have changed');
        await browser.close();
        return [];
      }

      // Step 2: Scrape prize data for each game
      const results = [];

      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        console.log(`Scraping MD ${i + 1}/${games.length}: ${game.name}`);

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
            state: 'md'
          });
        }

        // Rate limiting
        if (i < games.length - 1) {
          await page.waitForTimeout(this.scrapeDelay);
        }
      }

      // Cleanup
      await browser.close();

      console.log(`✓ MD Scrape completed: ${results.length} games with prize data`);
      return results;

    } catch (error) {
      console.error('✗ Fatal error during MD scrape:', error);

      // Cleanup on error
      if (browser) {
        await browser.close().catch(() => {});
      }

      return [];
    }
  }
}

// Export scraper instance
module.exports = MDLotteryScraper;

// Allow running as standalone script
if (require.main === module) {
  (async () => {
    const scraper = new MDLotteryScraper({
      maxGames: process.env.MAX_GAMES_PER_SCRAPE || 50,
      headless: true
    });

    const results = await scraper.scrapeAllGames();
    console.log('\n=== MD Scrape Results ===');
    console.log(JSON.stringify(results, null, 2));
  })();
}
