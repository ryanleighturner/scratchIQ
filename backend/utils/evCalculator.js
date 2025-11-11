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

/**
 * Calculate Overall Odds of Winning Any Prize
 * This gives the average chance of winning something (big or small) per ticket.
 *
 * Equation: Probability = 1 / O (where O is the stated overall odds)
 *
 * @param {string|number} overallOdds - Overall odds string (e.g., "1 in 4.12" or 4.12)
 * @returns {Object} Object with probability, odds ratio, and percentage
 */
function calculateOverallWinProbability(overallOdds) {
  if (!overallOdds) {
    return {
      probability: 0,
      oddsRatio: 0,
      percentage: '0%',
      display: 'N/A'
    };
  }

  let oddsValue;

  // Handle different formats: "1 in 4.12", "4.12", or number
  if (typeof overallOdds === 'string') {
    const match = overallOdds.match(/(?:1\s+in\s+)?([\d.]+)/i);
    if (match) {
      oddsValue = parseFloat(match[1]);
    } else {
      return {
        probability: 0,
        oddsRatio: 0,
        percentage: '0%',
        display: 'N/A'
      };
    }
  } else {
    oddsValue = parseFloat(overallOdds);
  }

  if (isNaN(oddsValue) || oddsValue === 0) {
    return {
      probability: 0,
      oddsRatio: 0,
      percentage: '0%',
      display: 'N/A'
    };
  }

  // Calculate probability: 1 / O
  const probability = 1 / oddsValue;
  const percentage = (probability * 100).toFixed(2) + '%';

  return {
    probability: parseFloat(probability.toFixed(6)),
    oddsRatio: oddsValue,
    percentage,
    display: `1 in ${oddsValue.toFixed(2)}`
  };
}

/**
 * Calculate Adjusted Probability of Top Prize
 * This refines top-prize odds by accounting for claimed tickets.
 *
 * Equation: Adjusted Prob = R_top / (T - Claimed Tickets)
 * Approximation: R_top / (T * (Remaining prizes / Initial prizes))
 *
 * @param {Array} prizes - Array of prize objects with {prize_amt, total, remaining}
 * @param {number} estimatedTotalTickets - Estimated total tickets in circulation
 * @returns {Object} Adjusted top prize probability info
 */
function calculateAdjustedTopPrizeProbability(prizes, estimatedTotalTickets = 4000000) {
  if (!prizes || prizes.length === 0) {
    return {
      adjustedProbability: 0,
      adjustedOdds: 'N/A',
      claimRate: 0,
      estimatedRemainingTickets: 0,
      improvement: '0x'
    };
  }

  // Sort by prize amount to find top prize
  const sortedPrizes = [...prizes].sort((a, b) => {
    const amtA = parseFloat(String(a.prize_amt || '0').replace(/[$,]/g, ''));
    const amtB = parseFloat(String(b.prize_amt || '0').replace(/[$,]/g, ''));
    return amtB - amtA;
  });

  const topPrize = sortedPrizes[0];
  const topPrizeRemaining = parseInt(topPrize.remaining) || 0;
  const topPrizeTotal = parseInt(topPrize.total) || topPrizeRemaining;

  // Calculate claim rate across all prizes
  let totalInitialPrizes = 0;
  let totalRemainingPrizes = 0;

  prizes.forEach(prize => {
    const total = parseInt(prize.total) || parseInt(prize.remaining) || 0;
    const remaining = parseInt(prize.remaining) || 0;
    totalInitialPrizes += total;
    totalRemainingPrizes += remaining;
  });

  // Estimate claim rate
  const claimRate = totalInitialPrizes > 0
    ? 1 - (totalRemainingPrizes / totalInitialPrizes)
    : 0;

  // Estimate remaining tickets in circulation
  const estimatedRemainingTickets = estimatedTotalTickets * (1 - claimRate);

  // Calculate adjusted probability
  let adjustedProbability = 0;
  let adjustedOdds = 'N/A';

  if (estimatedRemainingTickets > 0 && topPrizeRemaining > 0) {
    adjustedProbability = topPrizeRemaining / estimatedRemainingTickets;
    adjustedOdds = `1:${Math.round(1 / adjustedProbability).toLocaleString()}`;
  } else if (topPrizeRemaining === 0) {
    adjustedOdds = 'None left';
  }

  // Calculate improvement factor vs. original odds
  const originalProbability = topPrizeRemaining / estimatedTotalTickets;
  const improvementFactor = originalProbability > 0
    ? adjustedProbability / originalProbability
    : 1;

  return {
    adjustedProbability: parseFloat(adjustedProbability.toFixed(8)),
    adjustedOdds,
    claimRate: parseFloat(claimRate.toFixed(4)),
    claimRatePercentage: (claimRate * 100).toFixed(2) + '%',
    estimatedRemainingTickets: Math.round(estimatedRemainingTickets),
    improvement: improvementFactor.toFixed(2) + 'x',
    topPrizeRemaining,
    topPrizeTotal
  };
}

module.exports = {
  calculateEV,
  calculateBreakEvenOdds,
  estimateTotalTickets,
  getTopPrizeInfo,
  isHotTicket,
  calculateValueScore,
  calculateOverallWinProbability,
  calculateAdjustedTopPrizeProbability
};
