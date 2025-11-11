/**
 * App configuration
 * Update API_BASE_URL with your backend server URL
 */

export const API_BASE_URL = 'http://localhost:3001/api';

// For testing on physical device, use your computer's IP:
// export const API_BASE_URL = 'http://192.168.1.XXX:3001/api';

// For production:
// export const API_BASE_URL = 'https://your-production-server.com/api';

export const FREE_TIER_SCANS = 3;

export const STATES = [
  { label: 'North Carolina', value: 'nc', supported: true },
  // Add more states when support is added
  // { label: 'Florida', value: 'fl', supported: false },
  // { label: 'Georgia', value: 'ga', supported: false },
];

export const BUDGET_TIERS = [
  { label: '$1', value: 1 },
  { label: '$2', value: 2 },
  { label: '$3', value: 3 },
  { label: '$5', value: 5 },
  { label: '$10', value: 10 },
  { label: '$20', value: 20 },
  { label: '$30', value: 30 },
];

export const HOT_TICKET_THRESHOLD = 0.7;

export const DISCLAIMER_TEXT = `
⚠️ DISCLAIMER

ScratchIQ provides expected value (EV) estimates based on publicly available data from state lottery websites. These are statistical estimates only.

• Gambling involves risk and most players lose money
• EV < 1.0 means the house has an edge
• Past performance does not guarantee future results
• Play responsibly and within your means
• Must be 18+ to play lottery games

For help with gambling addiction:
National Problem Gambling Helpline: 1-800-522-4700
`.trim();
