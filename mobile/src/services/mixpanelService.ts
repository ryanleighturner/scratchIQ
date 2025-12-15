import { Mixpanel } from "mixpanel-react-native";
import Constants from "expo-constants";

// Initialize Mixpanel instance
let mixpanel: Mixpanel | null = null;

/**
 * Initialize Mixpanel with your project token
 * Call this once in App.tsx on app startup
 */
export const initMixpanel = async (token: string): Promise<void> => {
  try {
    mixpanel = new Mixpanel(token, false);
    await mixpanel.init();
    console.log("Mixpanel initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Mixpanel:", error);
  }
};

/**
 * Get Mixpanel instance (only after initialization)
 */
export const getMixpanel = (): Mixpanel | null => {
  if (!mixpanel) {
    console.warn("Mixpanel not initialized. Call initMixpanel() first.");
  }
  return mixpanel;
};

/**
 * Track an event with optional properties
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>): void => {
  if (!mixpanel) {
    console.warn("Mixpanel not initialized");
    return;
  }

  try {
    mixpanel.track(eventName, properties);
  } catch (error) {
    console.error(`Failed to track event ${eventName}:`, error);
  }
};

/**
 * Identify user with a unique ID
 */
export const identifyUser = (userId: string): void => {
  if (!mixpanel) {
    console.warn("Mixpanel not initialized");
    return;
  }

  try {
    mixpanel.identify(userId);
  } catch (error) {
    console.error("Failed to identify user:", error);
  }
};

/**
 * Set user profile properties
 */
export const setUserProperties = (properties: Record<string, any>): void => {
  if (!mixpanel) {
    console.warn("Mixpanel not initialized");
    return;
  }

  try {
    mixpanel.getPeople().set(properties);
  } catch (error) {
    console.error("Failed to set user properties:", error);
  }
};

/**
 * Increment a numeric user property
 */
export const incrementUserProperty = (property: string, by: number = 1): void => {
  if (!mixpanel) {
    console.warn("Mixpanel not initialized");
    return;
  }

  try {
    mixpanel.getPeople().increment(property, by);
  } catch (error) {
    console.error(`Failed to increment property ${property}:`, error);
  }
};

/**
 * Register super properties that are sent with every event
 */
export const registerSuperProperties = (properties: Record<string, any>): void => {
  if (!mixpanel) {
    console.warn("Mixpanel not initialized");
    return;
  }

  try {
    mixpanel.registerSuperProperties(properties);
  } catch (error) {
    console.error("Failed to register super properties:", error);
  }
};

/**
 * Reset Mixpanel state (useful for logout)
 */
export const reset = (): void => {
  if (!mixpanel) {
    console.warn("Mixpanel not initialized");
    return;
  }

  try {
    mixpanel.reset();
  } catch (error) {
    console.error("Failed to reset Mixpanel:", error);
  }
};

// Common event names (to keep tracking consistent)
export const MixpanelEvents = {
  // App lifecycle
  APP_OPENED: "App Opened",
  APP_BACKGROUNDED: "App Backgrounded",

  // Onboarding
  ONBOARDING_STARTED: "Onboarding Started",
  ONBOARDING_COMPLETED: "Onboarding Completed",
  ONBOARDING_SKIPPED: "Onboarding Skipped",
  STATE_SELECTED: "State Selected",

  // Scanning
  SCAN_STARTED: "Scan Started",
  SCAN_COMPLETED: "Scan Completed",
  SCAN_FAILED: "Scan Failed",
  SCAN_SHARED: "Scan Shared",

  // Tickets
  TICKET_VIEWED: "Ticket Viewed",
  TICKET_FAVORITED: "Ticket Favorited",
  TICKET_UNFAVORITED: "Ticket Unfavorited",
  TICKETS_FILTERED: "Tickets Filtered",
  TICKETS_SORTED: "Tickets Sorted",

  // Navigation
  SCREEN_VIEWED: "Screen Viewed",
  TAB_CHANGED: "Tab Changed",

  // Referrals
  REFERRAL_MODAL_OPENED: "Referral Modal Opened",
  REFERRAL_SHARED: "Referral Shared",
  REFERRAL_LINK_COPIED: "Referral Link Copied",
  PROMO_CODE_REDEEMED: "Promo Code Redeemed",

  // Settings
  NOTIFICATIONS_TOGGLED: "Notifications Toggled",
  STATE_CHANGED: "State Changed",

  // Errors
  ERROR_OCCURRED: "Error Occurred",
};
