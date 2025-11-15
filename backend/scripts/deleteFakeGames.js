/**
 * Script to delete fake games from the database
 * Usage: node scripts/deleteFakeGames.js
 */

require('dotenv').config();
const database = require('../services/database');

const FAKE_GAMES = [
  'Cash spectacular',
  'Diamond millions',
  'Triple 777'
];

async function deleteFakeGames() {
  console.log('Starting deletion of fake games...\n');

  try {
    // Get all NC games first to see what we have
    const allGames = await database.getGames('nc', {});
    console.log(`Found ${allGames.length} total NC games in database`);

    // Find matching games (case-insensitive)
    const gamesToDelete = allGames.filter(game =>
      FAKE_GAMES.some(fakeName =>
        game.name.toLowerCase().includes(fakeName.toLowerCase()) ||
        fakeName.toLowerCase().includes(game.name.toLowerCase())
      )
    );

    if (gamesToDelete.length === 0) {
      console.log('\nNo matching fake games found to delete.');
      return;
    }

    console.log(`\nFound ${gamesToDelete.length} game(s) to delete:`);
    gamesToDelete.forEach(game => {
      console.log(`  - ${game.name} (ID: ${game.id})`);
    });

    // Delete the games
    const gameIds = gamesToDelete.map(g => g.id);

    const { error: prizesError } = await database.supabase
      .from('prizes')
      .delete()
      .in('game_id', gameIds);

    if (prizesError) {
      console.error('Error deleting prizes:', prizesError.message);
      throw prizesError;
    }

    const { error: gamesError } = await database.supabase
      .from('games')
      .delete()
      .in('id', gameIds);

    if (gamesError) {
      console.error('Error deleting games:', gamesError.message);
      throw gamesError;
    }

    console.log(`\n✓ Successfully deleted ${gamesToDelete.length} fake game(s) and their prizes`);

    // Verify deletion
    const remainingGames = await database.getGames('nc', {});
    console.log(`\nRemaining NC games in database: ${remainingGames.length}`);

  } catch (error) {
    console.error('\n✗ Error during deletion:', error.message);
    process.exit(1);
  }
}

// Run the script
deleteFakeGames()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
