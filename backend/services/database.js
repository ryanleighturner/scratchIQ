/**
 * Database Service - Supabase integration
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.warn('Supabase credentials not found. Database operations will fail.');
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );
  }

  /**
   * Upsert games data (insert or update)
   */
  async upsertGames(games) {
    try {
      const gamesData = games.map(game => ({
        id: game.id,
        name: game.name,
        price: parseFloat(game.price),
        state: game.state || 'nc',
        ev: game.ev,
        top_prize_amount: game.top_prize_amount,
        top_prize_remaining: game.top_prize_remaining,
        is_hot: game.is_hot,
        value_score: game.value_score,
        odds_info: game.odds_info,
        url: game.url,
        updated_at: game.scraped_at || new Date().toISOString()
      }));

      const { data, error } = await this.supabase
        .from('games')
        .upsert(gamesData, { onConflict: 'id' });

      if (error) throw error;

      console.log(`✓ Upserted ${gamesData.length} games to database`);

      // Also upsert prizes
      await this.upsertPrizes(games);

      return data;
    } catch (error) {
      console.error('Error upserting games:', error.message);
      throw error;
    }
  }

  /**
   * Upsert prizes for games
   */
  async upsertPrizes(games) {
    try {
      const prizesData = [];

      games.forEach(game => {
        if (game.prizes && Array.isArray(game.prizes)) {
          game.prizes.forEach((prize, index) => {
            prizesData.push({
              game_id: game.id,
              prize_amt: prize.prize_amt,
              total: prize.total,
              remaining: prize.remaining,
              prize_rank: index,
              updated_at: game.scraped_at || new Date().toISOString()
            });
          });
        }
      });

      if (prizesData.length === 0) return;

      // Delete old prizes for these games
      const gameIds = games.map(g => g.id);
      await this.supabase
        .from('prizes')
        .delete()
        .in('game_id', gameIds);

      // Insert new prizes
      const { data, error } = await this.supabase
        .from('prizes')
        .insert(prizesData);

      if (error) throw error;

      console.log(`✓ Upserted ${prizesData.length} prizes to database`);

      return data;
    } catch (error) {
      console.error('Error upserting prizes:', error.message);
      throw error;
    }
  }

  /**
   * Get games by state and optional filters
   */
  async getGames(state, filters = {}) {
    try {
      let query = this.supabase
        .from('games')
        .select('*')
        .eq('state', state);

      // Apply filters
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.hotOnly) {
        query = query.eq('is_hot', true);
      }

      // Default sorting by value score
      query = query.order('value_score', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching games:', error.message);
      return [];
    }
  }

  /**
   * Get a single game with prizes
   */
  async getGameWithPrizes(gameId) {
    try {
      const { data: game, error: gameError } = await this.supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;

      const { data: prizes, error: prizesError } = await this.supabase
        .from('prizes')
        .select('*')
        .eq('game_id', gameId)
        .order('prize_rank', { ascending: true });

      if (prizesError) throw prizesError;

      return {
        ...game,
        prizes: prizes || []
      };
    } catch (error) {
      console.error('Error fetching game:', error.message);
      return null;
    }
  }

  /**
   * Get hot tickets (high EV games)
   */
  async getHotTickets(state, limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('games')
        .select('*')
        .eq('state', state)
        .eq('is_hot', true)
        .order('ev', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching hot tickets:', error.message);
      return [];
    }
  }

  /**
   * Track user scan
   */
  async trackUserScan(userId, gameIds) {
    try {
      const { data, error } = await this.supabase
        .from('user_scans')
        .insert({
          user_id: userId,
          game_ids: gameIds,
          scanned_at: new Date().toISOString()
        });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error tracking scan:', error.message);
      return null;
    }
  }

  /**
   * Get user scan count for today
   */
  async getUserScanCount(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await this.supabase
        .from('user_scans')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('scanned_at', today.toISOString());

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error getting scan count:', error.message);
      return 0;
    }
  }

  /**
   * Delete games by IDs
   */
  async deleteGamesByIds(gameIds) {
    try {
      // Delete prizes first
      const { error: prizesError } = await this.supabase
        .from('prizes')
        .delete()
        .in('game_id', gameIds);

      if (prizesError) throw prizesError;

      // Delete games
      const { error: gamesError } = await this.supabase
        .from('games')
        .delete()
        .in('id', gameIds);

      if (gamesError) throw gamesError;

      console.log(`✓ Deleted ${gameIds.length} game(s) and their prizes`);
      return true;
    } catch (error) {
      console.error('Error deleting games:', error.message);
      throw error;
    }
  }

  /**
   * Delete games by name patterns (case-insensitive)
   */
  async deleteGamesByName(state, namePatterns) {
    try {
      // Get all games for the state
      const allGames = await this.getGames(state, {});

      // Find games matching any of the name patterns
      const gamesToDelete = allGames.filter(game =>
        namePatterns.some(pattern =>
          game.name.toLowerCase().includes(pattern.toLowerCase())
        )
      );

      if (gamesToDelete.length === 0) {
        console.log('No games found matching the provided names');
        return { deleted: 0, games: [] };
      }

      const gameIds = gamesToDelete.map(g => g.id);
      await this.deleteGamesByIds(gameIds);

      return {
        deleted: gamesToDelete.length,
        games: gamesToDelete.map(g => ({ id: g.id, name: g.name }))
      };
    } catch (error) {
      console.error('Error deleting games by name:', error.message);
      throw error;
    }
  }

  /**
   * Check database health
   */
  async healthCheck() {
    try {
      const { data, error } = await this.supabase
        .from('games')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new DatabaseService();
