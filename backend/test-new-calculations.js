/**
 * Test script for new analytical calculations
 * Tests Overall Win Probability and Adjusted Top Prize Probability
 */

const {
  calculateOverallWinProbability,
  calculateAdjustedTopPrizeProbability
} = require('./utils/evCalculator');

console.log('=== Testing New Analytical Calculations ===\n');

// Test 1: Overall Win Probability
console.log('--- Test 1: Overall Win Probability ---');

const testCases1 = [
  '1 in 4.12',
  '4.12',
  4.12,
  '1 in 3.5',
  'Overall odds: 1 in 5.0',
  null,
  ''
];

testCases1.forEach((odds, i) => {
  console.log(`\nCase ${i + 1}: ${JSON.stringify(odds)}`);
  const result = calculateOverallWinProbability(odds);
  console.log('Result:', JSON.stringify(result, null, 2));
});

// Test 2: Adjusted Top Prize Probability
console.log('\n\n--- Test 2: Adjusted Top Prize Probability ---');

const samplePrizes = [
  {
    prize_amt: '$1,000,000',
    total: 5,
    remaining: 3
  },
  {
    prize_amt: '$10,000',
    total: 50,
    remaining: 30
  },
  {
    prize_amt: '$1,000',
    total: 500,
    remaining: 250
  },
  {
    prize_amt: '$100',
    total: 5000,
    remaining: 2000
  },
  {
    prize_amt: '$20',
    total: 50000,
    remaining: 20000
  }
];

console.log('\nSample Game:');
console.log('- Top prize: $1,000,000 (3 of 5 remaining)');
console.log('- Total initial prizes: 55,555');
console.log('- Total remaining prizes: 22,283');
console.log('- Estimated 4M total tickets\n');

const result2 = calculateAdjustedTopPrizeProbability(samplePrizes, 4000000);
console.log('Results:');
console.log(JSON.stringify(result2, null, 2));

// Calculate expected improvement
const initialProb = 3 / 4000000;
const claimRate = 1 - (22283 / 55555);
const remainingTickets = 4000000 * (1 - claimRate);
const adjustedProb = 3 / remainingTickets;
const improvement = adjustedProb / initialProb;

console.log('\n--- Manual Verification ---');
console.log(`Initial probability: ${initialProb.toFixed(8)} (1:${Math.round(1/initialProb).toLocaleString()})`);
console.log(`Claim rate: ${(claimRate * 100).toFixed(2)}%`);
console.log(`Remaining tickets: ~${Math.round(remainingTickets).toLocaleString()}`);
console.log(`Adjusted probability: ${adjustedProb.toFixed(8)} (1:${Math.round(1/adjustedProb).toLocaleString()})`);
console.log(`Improvement factor: ${improvement.toFixed(2)}x`);

// Test 3: Game with no prizes left
console.log('\n\n--- Test 3: Game with No Top Prizes Left ---');

const noPrizesLeft = [
  {
    prize_amt: '$500,000',
    total: 10,
    remaining: 0
  },
  {
    prize_amt: '$1,000',
    total: 100,
    remaining: 50
  }
];

const result3 = calculateAdjustedTopPrizeProbability(noPrizesLeft, 4000000);
console.log('Results:', JSON.stringify(result3, null, 2));

// Test 4: Complete game example
console.log('\n\n--- Test 4: Complete Game Analysis ---');

const completeGame = {
  name: 'Holiday Cash $100s',
  price: 10,
  overall_odds: '1 in 4.12',
  prizes: samplePrizes
};

const overallWin = calculateOverallWinProbability(completeGame.overall_odds);
const adjustedTop = calculateAdjustedTopPrizeProbability(completeGame.prizes, 4000000);

console.log('\nGame:', completeGame.name);
console.log('Price: $' + completeGame.price);
console.log('\nOverall Win Probability:');
console.log('  - Display:', overallWin.display);
console.log('  - Percentage:', overallWin.percentage);
console.log('  - Meaning: You have a', overallWin.percentage, 'chance to win ANY prize');

console.log('\nAdjusted Top Prize:');
console.log('  - Odds:', adjustedTop.adjustedOdds);
console.log('  - Claim Rate:', adjustedTop.claimRatePercentage);
console.log('  - Improvement:', adjustedTop.improvement);
console.log('  - Remaining:', adjustedTop.topPrizeRemaining, 'of', adjustedTop.topPrizeTotal);
console.log('  - Est. tickets left:', adjustedTop.estimatedRemainingTickets.toLocaleString());

console.log('\n=== Tests Complete ===\n');
