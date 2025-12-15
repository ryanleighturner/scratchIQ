/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Google Gemini API using Gemini 2.5 Flash for ultra-fast vision analysis.

Gemini 2.5 Flash is optimized for low-latency applications with vision capabilities.
*/

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Call Google Gemini 2.5 Flash API for ultra-fast vision analysis
 * @param imageBase64 - Base64 encoded image (without data:image/jpeg;base64, prefix)
 * @param prompt - Text prompt for the image
 * @param maxTokens - Maximum output tokens (default: 250)
 * @returns The generated text response
 */
export const callGeminiVision = async (
  imageBase64: string,
  prompt: string,
  maxTokens: number = 250
): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Google API key not found. Please add EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY to your environment variables."
    );
  }

  const startTime = Date.now();
  console.log("[Gemini] Starting Gemini 2.5 Flash API call...");

  try {
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.0,
        maxOutputTokens: maxTokens,
        thinkingConfig: {
          thinkingBudget: 0, // Disable thinking for maximum speed
        },
      },
    };

    const fetchStartTime = Date.now();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );
    const fetchEndTime = Date.now();
    console.log(`[Gemini] Fetch completed in ${fetchEndTime - fetchStartTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const parseStartTime = Date.now();
    const data: GeminiResponse = await response.json();
    const parseEndTime = Date.now();
    console.log(`[Gemini] Response parsed in ${parseEndTime - parseStartTime}ms`);

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const totalTime = Date.now() - startTime;
      console.log(`[Gemini] ✓ Total API call completed in ${totalTime}ms`);
      return data.candidates[0].content.parts[0].text;
    }

    console.error("Unexpected Gemini response:", JSON.stringify(data, null, 2));
    throw new Error("Unexpected response format from Gemini API");
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Gemini] ✗ API call failed after ${totalTime}ms:`, error);
    throw error;
  }
};
