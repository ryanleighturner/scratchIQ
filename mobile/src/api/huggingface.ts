/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Hugging Face router API to use vision-language models.

Available vision models via router.huggingface.co:
- zai-org/GLM-4.5V (cutting-edge reasoning vision language model)
- CohereLabs/aya-vision-32b (32B parameter multilingual vision model)
- CohereLabs/command-a-vision-07-2025:cohere (Cohere vision model)
*/

interface HuggingFaceMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface HuggingFaceResponse {
  generated_text?: string;
  error?: string;
}

/**
 * Call Hugging Face Router API for text generation and vision-language tasks
 * @param messages - The conversation messages (can include text and images)
 * @param model - The model to use (default: zai-org/GLM-4.5V for vision support)
 * @param apiKey - Your Hugging Face API token
 * @param maxTokens - Maximum number of tokens to generate (default: 4096)
 * @param temperature - Temperature for generation (default: 0.7)
 * @param doSample - Whether to use sampling (default: true)
 * @returns The generated text response
 */
export const callHuggingFaceAPI = async (
  messages: HuggingFaceMessage[],
  model: string = "zai-org/GLM-4.5V",
  apiKey?: string,
  maxTokens: number = 4096,
  temperature: number = 0.7,
  doSample: boolean = true
): Promise<string> => {
  const token = apiKey || process.env.EXPO_PUBLIC_HUNGINGFACE_API_KEY;

  if (!token) {
    throw new Error(
      "Hugging Face API key not found. Please add EXPO_PUBLIC_HUNGINGFACE_API_KEY to your environment variables via the ENV tab in Vibecode app."
    );
  }

  const startTime = Date.now();
  console.log(`[HuggingFace] Starting API call to ${model}...`);

  try {
    // Use OpenAI-compatible chat completions format for router
    const requestBody = {
      model: model,
      messages: formatMessagesForQwen(messages),
      max_tokens: maxTokens, // Configurable token limit
      temperature: temperature,
      do_sample: doSample,
    };

    const fetchStartTime = Date.now();
    const response = await fetch(
      `https://router.huggingface.co/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );
    const fetchEndTime = Date.now();
    console.log(`[HuggingFace] Fetch completed in ${fetchEndTime - fetchStartTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const parseStartTime = Date.now();
    const data = await response.json();
    const parseEndTime = Date.now();
    console.log(`[HuggingFace] Response parsed in ${parseEndTime - parseStartTime}ms`);

    // Handle different response formats
    if (data.choices && data.choices[0]?.message) {
      const message = data.choices[0].message;
      // Check for reasoning_content (used by reasoning models like GLM-4.5V)
      // When finish_reason is "length", the model hit the token limit during reasoning
      if (message.reasoning_content && !message.content) {
        // Model was still reasoning and didn't produce final answer
        // Extract the last complete thought or return a helpful message
        const reasoning = message.reasoning_content.trim();
        // Try to extract any JSON or final answer from the reasoning
        const jsonMatch = reasoning.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return jsonMatch[0];
        }
        throw new Error("Model is still reasoning. Please try again with a simpler prompt or use a different model.");
      }
      // Standard content response
      if (message.content) {
        const totalTime = Date.now() - startTime;
        console.log(`[HuggingFace] ✓ Total API call completed in ${totalTime}ms`);
        return message.content;
      }
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      const totalTime = Date.now() - startTime;
      console.log(`[HuggingFace] ✓ Total API call completed in ${totalTime}ms`);
      return data[0].generated_text;
    } else if (data.generated_text) {
      const totalTime = Date.now() - startTime;
      console.log(`[HuggingFace] ✓ Total API call completed in ${totalTime}ms`);
      return data.generated_text;
    } else if (data.error) {
      throw new Error(`Hugging Face API error: ${data.error}`);
    }

    console.error("Unexpected response:", JSON.stringify(data, null, 2));
    throw new Error("Unexpected response format from Hugging Face API");
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[HuggingFace] ✗ API call failed after ${totalTime}ms:`, error);
    throw error;
  }
};

/**
 * Format messages for Qwen models
 * For vision models, properly formats the content with images
 */
const formatMessagesForQwen = (messages: HuggingFaceMessage[]): any => {
  // For vision models, return the messages in OpenAI format which Hugging Face supports
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};
