/**
 * Gemini AI Service for Image Recognition
 * Uses Google's Gemini 2.0 Flash for recognizing lottery tickets
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not set. Image recognition will not work.');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    // Use Gemini 2.0 Flash for fast, efficient vision tasks
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Convert image file to base64
   */
  imageToBase64(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      return imageBuffer.toString('base64');
    } catch (error) {
      console.error('Error reading image:', error);
      return null;
    }
  }

  /**
   * Analyze lottery ticket wall image and extract game information
   *
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<Object>} - Detected games with IDs, names, and prices
   */
  async recognizeLotteryTickets(imagePath) {
    try {
      console.log('📸 Analyzing lottery ticket image with Gemini 2.0 Flash...');

      // Read image
      const imageBase64 = this.imageToBase64(imagePath);
      if (!imageBase64) {
        throw new Error('Failed to read image file');
      }

      // Create image part for Gemini
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg' // Adjust based on actual image type
        }
      };

      // Craft prompt for lottery ticket recognition
      const prompt = `You are analyzing a photograph of lottery scratch-off ticket displays.

Your task is to extract information about each scratch-off game visible in the image.

For each game you can clearly see, extract:
1. Game number (typically a 4-digit number like "2125" or "1843")
2. Game name (the title of the scratch-off game)
3. Ticket price (e.g., $1, $5, $10, $20, $30)

Return ONLY valid JSON in this exact format, with no other text:
{
  "games": [
    {
      "gameNumber": "2125",
      "gameName": "CASH SPECTACULAR",
      "price": 20
    },
    {
      "gameNumber": "1843",
      "gameName": "TRIPLE 777",
      "price": 5
    }
  ]
}

Important:
- Only include games you can clearly identify
- Game numbers should be 4 digits
- Prices should be numbers without the $ sign
- If you can't clearly read something, skip that game
- Return empty array if no games are visible
- Must be valid JSON`;

      // Call Gemini API
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log('Raw Gemini response:', text);

      // Parse JSON from response
      const parsed = this.parseGeminiResponse(text);

      console.log(`✓ Detected ${parsed.games?.length || 0} games`);
      return parsed;

    } catch (error) {
      console.error('Error in Gemini recognition:', error);
      return { games: [], error: error.message };
    }
  }

  /**
   * Parse Gemini response and extract JSON
   */
  parseGeminiResponse(text) {
    try {
      // Try direct JSON parse first
      return JSON.parse(text);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
                       text.match(/```\n([\s\S]*?)\n```/) ||
                       text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          return JSON.parse(jsonStr);
        } catch (e2) {
          console.error('Failed to parse extracted JSON:', e2);
        }
      }

      // Fallback: try to extract game info manually
      return this.fallbackExtraction(text);
    }
  }

  /**
   * Fallback extraction if JSON parsing fails
   */
  fallbackExtraction(text) {
    console.log('Using fallback extraction...');

    const games = [];

    // Try to find game numbers (4 digits)
    const gameNumbers = text.match(/\b\d{4}\b/g) || [];

    // Try to find prices
    const prices = text.match(/\$?(\d+)(?:\s*(?:dollars?|price))?/gi) || [];

    console.log('Fallback found:', { gameNumbers, prices });

    // Return structured data even if incomplete
    gameNumbers.forEach((num, i) => {
      games.push({
        gameNumber: num,
        gameName: `Game ${num}`,
        price: prices[i] ? parseInt(prices[i].replace(/\D/g, '')) : null
      });
    });

    return { games, fallback: true };
  }

  /**
   * Analyze image and return game IDs only (faster)
   */
  async extractGameIDs(imagePath) {
    try {
      const result = await this.recognizeLotteryTickets(imagePath);

      if (result.games && result.games.length > 0) {
        return result.games.map(g => g.gameNumber).filter(Boolean);
      }

      return [];
    } catch (error) {
      console.error('Error extracting game IDs:', error);
      return [];
    }
  }

  /**
   * Test the service with a sample image
   */
  async test(imagePath) {
    console.log('\n=== Gemini Service Test ===\n');
    console.log('Image path:', imagePath);
    console.log('');

    const result = await this.recognizeLotteryTickets(imagePath);

    console.log('\n=== Results ===');
    console.log(JSON.stringify(result, null, 2));

    return result;
  }
}

module.exports = new GeminiService();

// Allow testing as standalone script
if (require.main === module) {
  const imagePath = process.argv[2];

  if (!imagePath) {
    console.error('Usage: node gemini.js <path-to-image>');
    console.error('Example: node gemini.js ../test-images/lottery-wall.jpg');
    process.exit(1);
  }

  const service = require('./gemini');
  service.test(imagePath).then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}
