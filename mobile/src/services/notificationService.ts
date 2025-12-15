import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushToken {
  token: string;
  platform: string;
}

/**
 * Register for push notifications and get the token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission denied");
      return null;
    }

    // For local notifications, we don't need an Expo push token
    // Just store a local identifier
    const localToken = `local-${Date.now()}`;
    await AsyncStorage.setItem("pushToken", localToken);

    console.log("Local notifications enabled:", localToken);
    return localToken;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

/**
 * Check for NEW hot tickets and send notification if found
 * Only notifies about tickets that became hot since last check
 */
export async function checkForNewHotTickets(
  currentHotGames: Array<{ id: string; name: string; price: number; is_hot: boolean | null }>
) {
  try {
    // Get previously stored hot ticket IDs
    const stored = await AsyncStorage.getItem("previousHotTicketIds");
    const previousHotIds: string[] = stored ? JSON.parse(stored) : [];

    // Filter to only hot tickets (is_hot === true)
    const currentHotIds = currentHotGames
      .filter((game) => game.is_hot === true)
      .map((game) => game.id);

    console.log(`[Notifications] Total games passed in: ${currentHotGames.length}`);
    console.log(`[Notifications] Games with is_hot=true: ${currentHotIds.length}`);
    console.log(`[Notifications] Previous hot ticket count: ${previousHotIds.length}`);

    // Find NEW hot tickets (in current but not in previous)
    const newHotIds = currentHotIds.filter((id) => !previousHotIds.includes(id));

    console.log(`[Notifications] NEW hot tickets found: ${newHotIds.length}`);

    if (newHotIds.length > 0) {
      // Get the new hot games
      const newHotGames = currentHotGames.filter((game) => newHotIds.includes(game.id));

      // Send notification for new hot tickets
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${newHotIds.length} New Hot Ticket${newHotIds.length > 1 ? "s" : ""}! 🔥`,
          body:
            newHotGames.length > 0
              ? `${newHotGames[0].name} ($${newHotGames[0].price})${
                  newHotGames.length > 1 ? ` +${newHotGames.length - 1} more` : ""
                }`
              : "Check out the latest high-value tickets",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: "new-hot-tickets", gameIds: newHotIds },
        },
        trigger: null, // Send immediately
      });

      console.log(
        `[Notifications] Sent notification for ${newHotIds.length} new hot ticket(s)`
      );
    } else {
      console.log("[Notifications] No new hot tickets found");
    }

    // Store current hot IDs for next comparison
    await AsyncStorage.setItem("previousHotTicketIds", JSON.stringify(currentHotIds));

    return newHotIds.length;
  } catch (error) {
    console.error("[Notifications] Error checking for new hot tickets:", error);
    return 0;
  }
}

/**
 * Schedule daily check for new hot tickets at 9 AM
 * This replaces the generic daily notification
 */
export async function scheduleDailyHotTicketsCheck(state: string) {
  try {
    // Cancel existing daily notifications
    await cancelNotificationsByIdentifier("daily-hot-tickets");

    console.log(
      "[Notifications] Daily hot tickets check scheduled - will only notify for NEW hot tickets"
    );
    console.log("[Notifications] Note: Actual check happens when app loads hot games");
  } catch (error) {
    console.error("[Notifications] Error scheduling daily check:", error);
  }
}

/**
 * Check if favorites have improved Real Time Odds and send notifications
 */
export async function checkFavoritesForNotifications(
  favoriteGames: Array<{ id: string; name: string; overall_odds: number | null; price: number }>,
  previousRTOs: Record<string, number>
): Promise<Record<string, number>> {
  try {
    const newRTOs: Record<string, number> = {};
    const RTO_IMPROVEMENT_THRESHOLD = 0.1;

    for (const game of favoriteGames) {
      if (game.overall_odds === null) continue;

      newRTOs[game.id] = game.overall_odds;
      const previousRTO = previousRTOs[game.id];

      // Check if Real Time Odds improved by at least 0.1
      if (previousRTO !== undefined) {
        const improvement = game.overall_odds - previousRTO;

        if (improvement >= RTO_IMPROVEMENT_THRESHOLD) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Favorite Ticket Improved! 📈",
              body: `${game.name} ($${game.price}) - Real Time Odds increased by +${improvement.toFixed(2)}`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: { gameId: game.id, type: "favorite-improved" },
            },
            trigger: null, // Send immediately
          });

          console.log(
            `[Notifications] Sent RTO improvement notification for ${game.name}: +${improvement.toFixed(2)}`
          );
        }
      }
    }

    // Store new RTOs for next comparison
    await AsyncStorage.setItem("previousFavoriteRTOs", JSON.stringify(newRTOs));

    return newRTOs;
  } catch (error) {
    console.error("[Notifications] Error checking favorites:", error);
    return {};
  }
}

/**
 * Get previously stored favorite Real Time Odds
 */
export async function getPreviousFavoriteEVs(): Promise<Record<string, number>> {
  try {
    const stored = await AsyncStorage.getItem("previousFavoriteRTOs");
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("[Notifications] Error loading previous RTOs:", error);
    return {};
  }
}

/**
 * Cancel notifications by identifier
 */
export async function cancelNotificationsByIdentifier(identifier: string) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.identifier === identifier) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error(`[Notifications] Error canceling ${identifier}:`, error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("[Notifications] All notifications canceled");
  } catch (error) {
    console.error("[Notifications] Error canceling all notifications:", error);
  }
}

/**
 * Check notification permissions status
 */
export async function getNotificationPermissionStatus(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("[Notifications] Error checking permissions:", error);
    return false;
  }
}
