/**
 * Formatting utilities for ScratchIQ metrics display
 * Based on backend changes to use remaining prizes (current state) instead of original totals
 */

/**
 * Get color for ScratchIQ Score (previously EV)
 * @param ev - Expected value from backend (0-1 scale)
 * @returns Hex color code
 */
export const getScoreColor = (ev: number | null): string => {
  if (ev === null) return "#9ca3af"; // Gray for missing data
  const score = ev * 100;
  if (score >= 70) return "#22c55e"; // Green - Hot deal
  if (score >= 50) return "#eab308"; // Yellow - Average
  return "#ef4444"; // Red - Poor value
};

/**
 * Convert EV (0-1) to ScratchIQ Score (0-100)
 * @param ev - Expected value from backend
 * @returns Score out of 100
 */
export const formatScratchIQScore = (ev: number | null): string => {
  if (ev === null) return "N/A";
  return Math.round(ev * 100).toString();
};

/**
 * Get prize status with emoji and text label
 * @param score - Prize quality score (0-100)
 * @returns Object with emoji, text, and color
 */
export const getPrizeStatus = (
  score: number | null
): { emoji: string; text: string; color: string } => {
  if (score === null || score === undefined) {
    return { emoji: "⚪", text: "Unknown", color: "#9ca3af" };
  }
  if (score >= 80) return { emoji: "🟢", text: "Fresh Game", color: "#22c55e" };
  if (score >= 50) return { emoji: "🟡", text: "Mixed", color: "#eab308" };
  if (score >= 20) return { emoji: "🟠", text: "Picked Over", color: "#f97316" };
  return { emoji: "🔴", text: "Almost Done", color: "#ef4444" };
};

/**
 * Format currency amounts with K/M suffixes
 * @param amount - Dollar amount
 * @returns Formatted string
 */
export const formatMoney = (amount: number | null): string => {
  if (amount === null || amount === undefined) return "$0";
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
};

/**
 * Calculate win chance percentage from overall odds
 * @param overallOdds - Overall odds value (e.g., 3.97)
 * @returns Percentage as number
 */
export const getWinChance = (overallOdds: number | null): number => {
  if (overallOdds === null || overallOdds === undefined || overallOdds === 0) return 0;
  return Math.round((1 / overallOdds) * 100);
};

/**
 * Format win chance as percentage string
 * @param overallOdds - Overall odds value
 * @returns Formatted percentage string
 */
export const formatWinChance = (overallOdds: number | null): string => {
  const percent = getWinChance(overallOdds);
  return `${percent}%`;
};

/**
 * Format break-even odds as percentage
 * Handles both "1:X.XX" format and decimal format
 * @param breakEvenOdds - Break-even odds string
 * @returns Formatted percentage string
 */
export const formatBreakEvenOdds = (breakEvenOdds: string | null): string => {
  if (!breakEvenOdds) return "N/A";

  // Handle "1:X.XX" format
  if (breakEvenOdds.includes(":")) {
    const parts = breakEvenOdds.split(":");
    if (parts.length === 2) {
      const odds = parseFloat(parts[1]);
      if (!isNaN(odds) && odds !== 0) {
        const percent = ((1 / odds) * 100).toFixed(1);
        return `${percent}%`;
      }
    }
  } else {
    // Handle decimal format (e.g., 0.1923)
    const decimal = parseFloat(breakEvenOdds);
    if (!isNaN(decimal)) {
      const percent = (decimal * 100).toFixed(1);
      return `${percent}%`;
    }
  }

  return breakEvenOdds;
};

/**
 * Get display text for ScratchIQ Score with color coding
 * @param ev - Expected value
 * @returns Object with score text and color
 */
export const getScratchIQScoreDisplay = (
  ev: number | null
): { text: string; color: string; fullText: string } => {
  const score = ev !== null ? Math.round(ev * 100) : 0;
  const color = getScoreColor(ev);
  return {
    text: `${score}/100`,
    color,
    fullText: `ScratchIQ Score: ${score}/100`,
  };
};

/**
 * Format overall odds for display
 * @param overallOdds - Overall odds value
 * @returns Formatted string like "1:3.84"
 */
export const formatOverallOdds = (overallOdds: number | null): string => {
  if (overallOdds === null || overallOdds === undefined) return "N/A";
  return `1:${overallOdds.toFixed(2)}`;
};
