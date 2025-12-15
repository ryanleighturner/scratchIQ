import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

/**
 * Initialize Sentry for crash reporting and error tracking
 */
export function initializeSentry() {
  // Only initialize in production or if explicitly enabled
  const isProduction = !__DEV__;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  // Skip if no DSN is configured or in development
  if (!isProduction || !dsn) {
    console.log("[Sentry] Skipped initialization (development mode or no DSN)");
    return;
  }

  try {
    Sentry.init({
      dsn,
      debug: false,
      tracesSampleRate: 0.5, // Capture 50% of transactions
      environment: "production",
      release: Constants.expoConfig?.version || "1.0.0",
      dist: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString() || "1",
      enableNative: true,
      enableNativeCrashHandling: true,
      attachStacktrace: true,
    });
    console.log("[Sentry] Initialized for production");
  } catch (error) {
    // Silently fail - don't crash app if Sentry fails to initialize
    console.warn("[Sentry] Failed to initialize:", error);
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId: string, state?: string) {
  Sentry.setUser({
    id: userId,
    ...(state && { state }),
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Set custom context/tags
 */
export function setSentryTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext("additional_info", context);
  }
  Sentry.captureException(error);
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: "info",
    data,
  });
}
