import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Simple analytics service for tracking user events
 * Can be extended to send to analytics providers (Mixpanel, Amplitude, etc.)
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

const EVENTS_STORAGE_KEY = "analytics_events";
const MAX_STORED_EVENTS = 100;

/**
 * Track an event
 */
export async function trackEvent(eventName: string, properties?: Record<string, any>) {
  try {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };

    // Log to console in development
    if (__DEV__) {
      console.log(`[Analytics] ${eventName}`, properties || "");
    }

    // Store event locally
    await storeEvent(event);

    // TODO: Send to analytics provider (Mixpanel, Amplitude, etc.)
    // await sendToAnalyticsProvider(event);
  } catch (error) {
    console.error("[Analytics] Failed to track event:", error);
  }
}

/**
 * Store event locally for later analysis
 */
async function storeEvent(event: AnalyticsEvent) {
  try {
    const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
    const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];

    // Add new event
    events.push(event);

    // Keep only last MAX_STORED_EVENTS
    const trimmedEvents = events.slice(-MAX_STORED_EVENTS);

    await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(trimmedEvents));
  } catch (error) {
    console.error("[Analytics] Failed to store event:", error);
  }
}

/**
 * Get all stored events (for debugging)
 */
export async function getStoredEvents(): Promise<AnalyticsEvent[]> {
  try {
    const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("[Analytics] Failed to get stored events:", error);
    return [];
  }
}

/**
 * Clear all stored events
 */
export async function clearStoredEvents() {
  try {
    await AsyncStorage.removeItem(EVENTS_STORAGE_KEY);
  } catch (error) {
    console.error("[Analytics] Failed to clear events:", error);
  }
}

// Common event tracking functions

export function trackScreenView(screenName: string) {
  trackEvent("screen_view", { screen_name: screenName });
}

export function trackScanStarted() {
  trackEvent("scan_started");
}

export function trackScanCompleted(ticketsFound: number, scanDuration: number) {
  trackEvent("scan_completed", {
    tickets_found: ticketsFound,
    duration_ms: scanDuration,
  });
}

export function trackTicketFavorited(gameId: string, gameName: string) {
  trackEvent("ticket_favorited", { game_id: gameId, game_name: gameName });
}

export function trackTicketUnfavorited(gameId: string, gameName: string) {
  trackEvent("ticket_unfavorited", { game_id: gameId, game_name: gameName });
}

export function trackTicketViewed(gameId: string, gameName: string, price: number) {
  trackEvent("ticket_viewed", {
    game_id: gameId,
    game_name: gameName,
    price,
  });
}

export function trackStateChanged(oldState: string | null, newState: string) {
  trackEvent("state_changed", {
    old_state: oldState || "none",
    new_state: newState,
  });
}

export function trackShareResult() {
  trackEvent("share_result");
}

export function trackNotificationToggled(enabled: boolean) {
  trackEvent("notification_toggled", { enabled });
}

export function trackOnboardingStarted() {
  trackEvent("onboarding_started");
}

export function trackOnboardingCompleted(selectedState: string) {
  trackEvent("onboarding_completed", { selected_state: selectedState });
}

export function trackOnboardingSkipped() {
  trackEvent("onboarding_skipped");
}

export function trackSearchPerformed(query: string, resultsCount: number) {
  trackEvent("search_performed", {
    query,
    results_count: resultsCount,
  });
}
