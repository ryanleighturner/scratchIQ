// Supabase Database Types
export interface Game {
  id: string;              // Format: "{state}-{gameNumber}" (e.g., "ri-1445", "nj-1234")
  name: string;            // Game name (max 50 chars)
  price: number;           // Ticket price in dollars (1, 2, 3, 5, 10, 20, 30, etc.)
  state: string;           // 2-letter state code (e.g., "ny", "ca", "tx")
  url: string | null;      // Source URL where game data was scraped from
  image_url: string | null; // URL to game ticket image
  overall_odds: number | null; // Overall odds value (e.g., 3.84 for "1 in 3.84")
  ev: number | null;       // Expected value per dollar spent
  top_prize_amount: number | null; // Highest prize amount available
  top_prize_remaining: number | null; // Number of top prizes still unclaimed
  is_hot: boolean | null;  // True if overall_odds >= 0.7 (hot ticket)
  value_score: number | null; // Ranking score 0-100 (higher = better value) - DEPRECATED, use prize_quality_score
  prize_quality_score: number | null; // NEW: Prize quality score 0-100 (weighted average of prize availability)
  real_time_overall_odds: number | null; // NEW: Current odds of winning ANY prize (remaining_tickets / remaining_prizes)
  top_prize_depletion: number | null; // NEW: Percentage of top prizes still available (0-1, where 1.0 = 100%)
  break_even_odds: string | null; // Probability of winning >= ticket price (e.g., "1:7.94")
  win_back_ratio: number | null; // Ratio for breaking even (e.g., 5 = "1 in 5")
  total_tickets: bigint | null; // Estimated total tickets printed
  estimated_remaining_tickets: bigint | null; // Estimated tickets still in circulation
}

export interface Prize {
  id: number;              // Auto-increment primary key
  game_id: string;         // Foreign key to games.id
  prize_amt: string;       // Prize amount (e.g., "$75,000", "$100", "Free Ticket")
  total: number;           // Original number of prizes printed
  remaining: number;       // Number of prizes still unclaimed
  prize_rank: number;      // Tier ranking (0 = top prize)
}

export interface UserPreferences {
  user_id: string;
  selected_state: string;
  notifications_enabled: boolean;
  is_pro: boolean;
}

export interface UserScan {
  id: string;
  user_id: string;
  game_ids: string[];
  scanned_at: string;
}

export interface NotificationQueue {
  id: string;
  user_id: string;
  game_id: string | null;
  notification_type: string;
  title: string;
  body: string;
  sent: boolean;
}

export type State =
  | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "GA" | "ID" | "IL"
  | "IN" | "IA" | "KS" | "KY" | "LA" | "ME" | "MD" | "MA" | "MI" | "MN"
  | "MS" | "MO" | "NE" | "NH" | "NJ" | "NM" | "NY" | "NC" | "ND" | "OH"
  | "OK" | "OR" | "PA" | "RI" | "SC" | "SD" | "TN" | "TX" | "VT" | "VA"
  | "WA" | "WV" | "WI";

export const STATES: { value: State; label: string }[] = [
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "NE", label: "Nebraska" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
];
