import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Game, Prize, State } from "../types/database";

/**
 * Offline cache service for storing game data locally
 * Allows app to work without network connection
 */

const CACHE_KEYS = {
  HOT_GAMES: (state: string) => `cache_hot_games_${state}`,
  ALL_GAMES: (state: string) => `cache_all_games_${state}`,
  GAME_DETAIL: (gameId: string) => `cache_game_${gameId}`,
  GAME_PRIZES: (gameId: string) => `cache_prizes_${gameId}`,
  LAST_UPDATED: (state: string) => `cache_updated_${state}`,
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Check if cached data is still fresh
 */
async function isCacheFresh(state: string): Promise<boolean> {
  try {
    const lastUpdated = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATED(state));
    if (!lastUpdated) return false;

    const age = Date.now() - parseInt(lastUpdated);
    return age < CACHE_DURATION;
  } catch (error) {
    console.error("[Cache] Error checking cache freshness:", error);
    return false;
  }
}

/**
 * Cache hot games for a state
 */
export async function cacheHotGames(state: string, games: Game[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.HOT_GAMES(state), JSON.stringify(games));
    await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATED(state), Date.now().toString());
    console.log(`[Cache] Cached ${games.length} hot games for ${state}`);
  } catch (error) {
    console.error("[Cache] Error caching hot games:", error);
  }
}

/**
 * Get cached hot games for a state
 */
export async function getCachedHotGames(state: string): Promise<Game[] | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.HOT_GAMES(state));
    if (!cached) {
      console.log(`[Cache] No cached hot games found for ${state}`);
      return null;
    }

    const games: Game[] = JSON.parse(cached);
    console.log(`[Cache] Retrieved ${games.length} cached hot games for ${state}`);
    return games;
  } catch (error) {
    console.error("[Cache] Error retrieving cached hot games:", error);
    return null;
  }
}

/**
 * Cache all games for a state
 */
export async function cacheAllGames(state: string, games: Game[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.ALL_GAMES(state), JSON.stringify(games));
    console.log(`[Cache] Cached ${games.length} all games for ${state}`);
  } catch (error) {
    console.error("[Cache] Error caching all games:", error);
  }
}

/**
 * Get cached all games for a state
 */
export async function getCachedAllGames(state: string): Promise<Game[] | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.ALL_GAMES(state));
    if (!cached) {
      console.log(`[Cache] No cached all games found for ${state}`);
      return null;
    }

    const games: Game[] = JSON.parse(cached);
    console.log(`[Cache] Retrieved ${games.length} cached all games for ${state}`);
    return games;
  } catch (error) {
    console.error("[Cache] Error retrieving cached all games:", error);
    return null;
  }
}

/**
 * Cache individual game details
 */
export async function cacheGameDetail(game: Game): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.GAME_DETAIL(game.id), JSON.stringify(game));
    console.log(`[Cache] Cached game detail for ${game.name}`);
  } catch (error) {
    console.error("[Cache] Error caching game detail:", error);
  }
}

/**
 * Get cached game details
 */
export async function getCachedGameDetail(gameId: string): Promise<Game | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.GAME_DETAIL(gameId));
    if (!cached) {
      console.log(`[Cache] No cached game detail found for ${gameId}`);
      return null;
    }

    const game: Game = JSON.parse(cached);
    console.log(`[Cache] Retrieved cached game detail for ${game.name}`);
    return game;
  } catch (error) {
    console.error("[Cache] Error retrieving cached game detail:", error);
    return null;
  }
}

/**
 * Clear all cached data for a state
 */
export async function clearCacheForState(state: string): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      CACHE_KEYS.HOT_GAMES(state),
      CACHE_KEYS.ALL_GAMES(state),
      CACHE_KEYS.LAST_UPDATED(state),
    ]);
    console.log(`[Cache] Cleared cache for ${state}`);
  } catch (error) {
    console.error("[Cache] Error clearing cache:", error);
  }
}

/**
 * Get cache age in hours
 */
export async function getCacheAge(state: string): Promise<number | null> {
  try {
    const lastUpdated = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATED(state));
    if (!lastUpdated) return null;

    const ageMs = Date.now() - parseInt(lastUpdated);
    return ageMs / (1000 * 60 * 60); // Convert to hours
  } catch (error) {
    console.error("[Cache] Error getting cache age:", error);
    return null;
  }
}

/**
 * Cache prizes for a game
 */
export async function cacheGamePrizes(gameId: string, prizes: Prize[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.GAME_PRIZES(gameId), JSON.stringify(prizes));
    console.log(`[Cache] Cached ${prizes.length} prizes for game ${gameId}`);
  } catch (error) {
    console.error("[Cache] Error caching game prizes:", error);
  }
}

/**
 * Get cached prizes for a game
 */
export async function getCachedGamePrizes(gameId: string): Promise<Prize[] | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.GAME_PRIZES(gameId));
    if (!cached) {
      console.log(`[Cache] No cached prizes found for game ${gameId}`);
      return null;
    }

    const prizes: Prize[] = JSON.parse(cached);
    console.log(`[Cache] Retrieved ${prizes.length} cached prizes for game ${gameId}`);
    return prizes;
  } catch (error) {
    console.error("[Cache] Error retrieving cached game prizes:", error);
    return null;
  }
}
