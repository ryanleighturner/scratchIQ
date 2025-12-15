/**
 * Retry logic for failed API calls
 * Implements exponential backoff with jitter
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.message?.includes("Network request failed")) return true;
    if (error.message?.includes("timeout")) return true;
    if (error.status >= 500 && error.status < 600) return true;
    return false;
  },
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  // Add jitter (±25% random variation)
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) {
        console.log(`[Retry] Success after ${attempt} retry(ies)`);
      }
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        console.log("[Retry] Error not retryable, throwing immediately");
        throw error;
      }

      // Check if we have retries left
      if (attempt >= opts.maxRetries) {
        console.log(`[Retry] Max retries (${opts.maxRetries}) reached`);
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      console.log(
        `[Retry] Attempt ${attempt + 1}/${opts.maxRetries + 1} failed, retrying in ${delay}ms...`
      );
      console.log(`[Retry] Error:`, (error as Error).message || error);

      await sleep(delay);
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Wrapper for API calls with automatic retry
 */
export async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<T> {
  return withRetry(async () => {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as any;
      error.status = response.status;
      throw error;
    }

    return response.json();
  }, retryOptions);
}

/**
 * Check if device is online
 */
export async function checkConnectivity(): Promise<boolean> {
  try {
    // Try to fetch a small resource to check connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch("https://www.google.com/generate_204", {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log("[Connectivity] Device appears to be offline");
    return false;
  }
}
