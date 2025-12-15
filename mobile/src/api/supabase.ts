import { createClient } from "@supabase/supabase-js";
import type { Game, Prize, UserPreferences, UserScan } from "../types/database";
import { withRetry, checkConnectivity } from "../utils/retry";
import {
  cacheHotGames,
  getCachedHotGames,
  cacheAllGames,
  getCachedAllGames,
  cacheGameDetail,
  getCachedGameDetail,
  cacheGamePrizes,
  getCachedGamePrizes,
} from "../services/offlineCache";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env");
  console.error("Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Game queries with offline support and retry logic
export const getHotGames = async (state: string) => {
  try {
    // Try to fetch with retry logic
    const data = await withRetry(async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("state", state.toLowerCase())
        .eq("is_hot", true)
        .order("overall_odds", { ascending: false });

      if (error) throw error;
      return data as Game[];
    });

    // Cache successful response
    await cacheHotGames(state, data);

    // Also cache individual game details for offline access
    for (const game of data) {
      await cacheGameDetail(game);
    }

    return data;
  } catch (error) {
    // If network fails, try to use cached data
    console.log("[Supabase] Network error, attempting to use cached data");
    const cached = await getCachedHotGames(state);
    if (cached) {
      console.log("[Supabase] Using cached hot games (offline mode)");
      return cached;
    }
    throw error;
  }
};

export const getAllGames = async (state: string) => {
  try {
    // Try to fetch with retry logic
    const data = await withRetry(async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("state", state.toLowerCase())
        .order("overall_odds", { ascending: false });

      if (error) throw error;
      return data as Game[];
    });

    // Cache successful response
    await cacheAllGames(state, data);

    // Also cache individual game details for offline access
    for (const game of data) {
      await cacheGameDetail(game);
    }

    return data;
  } catch (error) {
    // If network fails, try to use cached data
    console.log("[Supabase] Network error, attempting to use cached data");
    const cached = await getCachedAllGames(state);
    if (cached) {
      console.log("[Supabase] Using cached all games (offline mode)");
      return cached;
    }
    throw error;
  }
};

export const getGamesByIds = async (gameIds: string[]) => {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .in("id", gameIds)
    .order("overall_odds", { ascending: false });

  if (error) throw error;
  return data as Game[];
};

export const searchGamesByName = async (names: string[], state: string) => {
  const dbStartTime = Date.now();
  console.log("Searching for games:", names);
  console.log("In state:", state);

  let data: Game[] = [];

  try {
    const result = await supabase
      .from("games")
      .select("*")
      .eq("state", state.toLowerCase())
      .order("overall_odds", { ascending: false });

    const dbEndTime = Date.now();
    console.log(`[Supabase] Query took ${dbEndTime - dbStartTime}ms`);

    if (result.error) {
      console.log("[Supabase] Error fetching games, will attempt cache fallback");
      throw result.error;
    }

    data = result.data as Game[];
  } catch (error) {
    // If network fails, try to use cached data
    console.log("[Supabase] Network error in search, attempting to use cached data");
    const cached = await getCachedAllGames(state);
    if (cached) {
      console.log("[Supabase] Using cached games for search (offline mode)");
      data = cached;
    } else {
      throw error;
    }
  }

  console.log(`Found ${data?.length || 0} total games in ${state}`);

  if (!data || data.length === 0) {
    return [];
  }

  // Helper function to normalize ticket names for better matching
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ')     // Normalize spaces
      .trim();
  };

  // Helper function to extract significant words (ignore common words)
  const getSignificantWords = (str: string) => {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    return normalize(str)
      .split(' ')
      .filter(word => word.length > 2 && !commonWords.includes(word));
  };

  // Score-based matching
  const scoredMatches = data.map((game) => {
    let maxScore = 0;

    const gameWords = getSignificantWords(game.name);
    const gameNormalized = normalize(game.name);

    names.forEach((name) => {
      const nameWords = getSignificantWords(name);
      const nameNormalized = normalize(name);

      let score = 0;

      // Exact match (highest score)
      if (gameNormalized === nameNormalized) {
        score = 100;
      }
      // One contains the other
      else if (gameNormalized.includes(nameNormalized) || nameNormalized.includes(gameNormalized)) {
        score = 80;
      }
      // Check word-by-word matching
      else {
        const matchedWords = gameWords.filter(gw =>
          nameWords.some(nw => nw === gw || nw.includes(gw) || gw.includes(nw))
        );

        if (matchedWords.length > 0) {
          // Score based on percentage of words matched
          score = (matchedWords.length / Math.max(gameWords.length, nameWords.length)) * 70;
        }
      }

      maxScore = Math.max(maxScore, score);
    });

    return { game, score: maxScore };
  });

  // Filter games with score >= 50 (balanced threshold for accuracy)
  const filtered = scoredMatches
    .filter(item => item.score >= 50)
    .sort((a, b) => b.score - a.score)
    .map(item => {
      console.log(`Matched: "${item.game.name}" with score ${item.score.toFixed(1)}`);
      return item.game as Game;
    });

  console.log(`Matched ${filtered.length} games after filtering`);

  if (filtered.length === 0) {
    console.log("Sample database game names:", data.slice(0, 10).map(g => g.name));
  }

  return filtered;
};

export const getGameById = async (gameId: string) => {
  try {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (error) throw error;

    // Cache successful response
    await cacheGameDetail(data as Game);
    return data as Game;
  } catch (error) {
    // If network fails, try to use cached data
    console.log("[Supabase] Network error fetching game, attempting to use cached data");
    const cached = await getCachedGameDetail(gameId);
    if (cached) {
      console.log("[Supabase] Using cached game detail (offline mode)");
      return cached;
    }
    throw error;
  }
};

// Prize queries
export const getPrizesForGame = async (gameId: string) => {
  try {
    const { data, error } = await supabase
      .from("prizes")
      .select("*")
      .eq("game_id", gameId)
      .order("prize_rank", { ascending: true });

    if (error) throw error;

    // Cache successful response
    await cacheGamePrizes(gameId, data as Prize[]);
    return data as Prize[];
  } catch (error) {
    // If network fails, try to use cached data
    console.log("[Supabase] Network error fetching prizes, attempting to use cached data");
    const cached = await getCachedGamePrizes(gameId);
    if (cached) {
      console.log("[Supabase] Using cached prizes (offline mode)");
      return cached;
    }
    throw error;
  }
};

// User preferences
export const getUserPreferences = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // If user doesn't exist, create default preferences
    if (error.code === "PGRST116") {
      const { data: newData, error: insertError } = await supabase
        .from("user_preferences")
        .insert({
          user_id: userId,
          selected_state: "NC",
          notifications_enabled: true,
          is_pro: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return newData as UserPreferences;
    }
    throw error;
  }

  return data as UserPreferences;
};

export const updateUserPreferences = async (
  userId: string,
  updates: Partial<UserPreferences>
) => {
  // Use upsert to handle both insert and update cases
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: userId,
      ...updates,
    }, {
      onConflict: "user_id"
    })
    .select()
    .single();

  if (error) throw error;
  return data as UserPreferences;
};

// User scans
export const saveScan = async (userId: string, gameIds: string[]) => {
  const { data, error } = await supabase
    .from("user_scans")
    .insert({
      user_id: userId,
      game_ids: gameIds,
    })
    .select()
    .single();

  if (error) throw error;
  return data as UserScan;
};

export const getUserScans = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_scans")
    .select("*")
    .eq("user_id", userId)
    .order("scanned_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data as UserScan[];
};
