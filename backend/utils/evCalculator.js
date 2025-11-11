/**
 * EV Calculator - Expected Value calculations for lottery tickets
 */

/**
 * Calculate Expected Value (EV) for a scratch-off game
 * EV = Sum(prize_amount * probability) / ticket_price
 *
 * @param {Array} prizes - Array of prize objects {prize_amt, total, remaining}
 * @param {number} ticketPrice - Price of the ticket
 * @param {number} estimatedTotalTickets - Estimated total tickets in circulation
 * @returns {number} Expected value per dollar spent
 */
function calculateEV(prizes, ticketPrice, estimatedTotalTickets = 4000000) {
  if (!prizes || prizes.length === 0) return 0;

  let totalExpectedValue = 0;

  prizes.forEach(prize => {
    const prizeAmount = parseFloat(
      String(prize.prize_amt || '0').replace(/[$,]/g, '')
    );
    const remaining = parseInt(prize.remaining) || 0;
    const probability = remaining / estimatedTotalTickets;

    totalExpectedValue += prizeAmount * probability;
  });

  // Normalize by ticket price to get EV per dollar
  const normalizedEV = totalExpectedValue / parseFloat(ticketPrice);

  return parseFloat(normalizedEV.toFixed(4));
}

/**
 * Calculate odds of breaking even (winning >= ticket price)
 *
 * @param {Array} prizes - Array of prize objects
 * @param {number} ticketPrice - Price of the ticket
 * @param {number} estimatedTotalTickets - Estimated total tickets
 * @returns {string} Odds in "1:X" format
 */
function calculateBreakEvenOdds(prizes, ticketPrice, estimatedTotalTickets = 4000000) {
  if (!prizes || prizes.length === 0) return 'N/A';

  const minWinAmount = parseFloat(ticketPrice);
  let totalProbability = 0;

  prizes.forEach(prize => {
    const prizeAmount = parseFloat(
      String(prize.prize_amt || '0').replace(/[$,]/g, '')
    );
    const remaining = parseInt(prize.remaining) || 0;

    if (prizeAmount >= minWinAmount) {
      totalProbability += remaining / estimatedTotalTickets;
    }
  });

  if (totalProbability === 0) return 'N/A';

  const odds = Math.round(1 / totalProbability);
  return `1:${odds}`;
}

/**
 * Estimate total tickets from game odds (if available)
 *
 * @param {string} oddsString - Odds string like "1 in 4.23"
 * @param {number} totalPrizes - Total number of winning tickets
 * @returns {number} Estimated total tickets
 */
function estimateTotalTickets(oddsString, totalPrizes) {
  try {
    // Parse "1 in X" format
    const match = oddsString.match(/1\s+in\s+([\d.]+)/i);
    if (match) {
      const oddsRatio = parseFloat(match[1]);
      return Math.round(totalPrizes * oddsRatio);
    }
  } catch (error) {
    console.error('Error parsing odds:', error);
  }
  return 4000000; // Default fallback
}

/**
 * Calculate top prize remaining probability
 *
 * @param {Array} prizes - Array of prize objects
 * @param {number} estimatedTotalTickets - Estimated total tickets
 * @returns {Object} Top prize info with probability
 */
function getTopPrizeInfo(prizes, estimatedTotalTickets = 4000000) {
  if (!prizes || prizes.length === 0) {
    return { amount: 0, remaining: 0, probability: 0, odds: 'N/A' };
  }

  // Sort by prize amount descending
  const sortedPrizes = [...prizes].sort((a, b) => {
    const amtA = parseFloat(String(a.prize_amt || '0').replace(/[$,]/g, ''));
    const amtB = parseFloat(String(b.prize_amt || '0').replace(/[$,]/g, ''));
    return amtB - amtA;
  });

  const topPrize = sortedPrizes[0];
  const amount = parseFloat(String(topPrize.prize_amt || '0').replace(/[$,]/g, ''));
  const remaining = parseInt(topPrize.remaining) || 0;
  const probability = remaining / estimatedTotalTickets;
  const odds = remaining > 0 ? `1:${Math.round(1 / probability)}` : 'None left';

  return {
    amount,
    remaining,
    probability: parseFloat(probability.toFixed(8)),
    odds
  };
}

/**
 * Determine if a game is "hot" based on EV threshold
 *
 * @param {number} ev - Expected value
 * @param {number} threshold - Hot threshold (default 0.7)
 * @returns {boolean}
 */
function isHotTicket(ev, threshold = 0.7) {
  return ev >= threshold;
}

/**
 * Calculate value score (0-100) for ranking games
 * Considers EV, top prize availability, and price tier
 *
 * @param {number} ev - Expected value
 * @param {Object} topPrizeInfo - Top prize information
 * @param {number} price - Ticket price
 * @returns {number} Score from 0-100
 */
function calculateValueScore(ev, topPrizeInfo, price) {
  // EV component (60% weight): scale 0-1 EV to 0-60
  const evScore = Math.min(ev * 60, 60);

  // Top prize availability (30% weight): if top prize remains
  const topPrizeScore = topPrizeInfo.remaining > 0 ? 30 : 0;

  // Price tier bonus (10% weight): favor lower prices slightly
  const priceTiers = { 1: 10, 2: 9, 3: 8, 5: 7, 10: 6, 20: 5, 30: 4 };
  const priceScore = priceTiers[price] || 3;

  return Math.round(evScore + topPrizeScore + priceScore);
}

module.exports = {
  calculateEV,
  calculateBreakEvenOdds,
  estimateTotalTickets,
  getTopPrizeInfo,
  isHotTicket,
  calculateValueScore
};
