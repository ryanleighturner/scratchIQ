import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import StateSelectionModal from "./src/components/StateSelectionModal";
import OnboardingTutorial from "./src/components/OnboardingTutorial";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { useAppStore } from "./src/state/appStore";
import { updateUserPreferences } from "./src/api/supabase";
import {
  registerForPushNotifications,
  scheduleDailyHotTicketsCheck,
} from "./src/services/notificationService";
import {
  initMixpanel,
  identifyUser,
  setUserProperties,
  registerSuperProperties,
  trackEvent,
  MixpanelEvents,
} from "./src/services/mixpanelService";
import type { State } from "./src/types/database";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Sentry removed - not configured

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project.
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

export default function App() {
  const selectedState = useAppStore((s) => s.selectedState);
  const setSelectedState = useAppStore((s) => s.setSelectedState);
  const userId = useAppStore((s) => s.userId);
  const setUserId = useAppStore((s) => s.setUserId);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setPushToken = useAppStore((s) => s.setPushToken);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Initialize Mixpanel on app start
  useEffect(() => {
    const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
    if (token) {
      initMixpanel(token).then(() => {
        // Register super properties that are sent with every event
        registerSuperProperties({
          platform: Platform.OS,
          deviceModel: Device.modelName || "Unknown",
          deviceBrand: Device.brand || "Unknown",
          osVersion: Platform.Version,
        });

        // Track app opened
        trackEvent(MixpanelEvents.APP_OPENED);
      });
    } else {
      console.warn("Mixpanel token not found. Add EXPO_PUBLIC_MIXPANEL_TOKEN to .env");
    }
  }, []);

  // Initialize push notifications
  useEffect(() => {
    if (notificationsEnabled && selectedState) {
      initializeNotifications();
    }
  }, [notificationsEnabled, selectedState]);

  const initializeNotifications = async () => {
    try {
      // Register for push notifications
      const token = await registerForPushNotifications();
      if (token) {
        setPushToken(token);
        console.log("[App] Push token registered");
      }

      // Schedule daily hot tickets check if state is selected
      if (selectedState) {
        await scheduleDailyHotTicketsCheck(selectedState);
        console.log("[App] Daily hot tickets check scheduled for", selectedState);
      }
    } catch (error) {
      console.error("[App] Failed to initialize notifications:", error);
    }
  };

  useEffect(() => {
    // Check if user needs to see onboarding
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
      return;
    }

    // Check if user needs to select a state on first launch
    const initializeApp = async () => {
      // Generate user ID if it doesn't exist
      let uid = userId;
      if (!uid) {
        uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setUserId(uid);
      }

      // Identify user in Mixpanel
      identifyUser(uid);
      setUserProperties({
        userId: uid,
        selectedState: selectedState || "None",
      });

      // Show state selection modal if no state is selected
      if (!selectedState) {
        setShowStateModal(true);
      }
    };

    initializeApp();
  }, [hasCompletedOnboarding]);

  const handleOnboardingComplete = async (state: State) => {
    setShowOnboarding(false);
    completeOnboarding();

    // Track onboarding completion
    trackEvent(MixpanelEvents.ONBOARDING_COMPLETED, {
      selectedState: state,
    });

    // Set the state from onboarding
    setSelectedState(state);

    // After onboarding, initialize the app
    let uid = userId;
    if (!uid) {
      uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setUserId(uid);
    }

    // Save state to database
    try {
      if (uid) {
        await updateUserPreferences(uid, { selected_state: state });
      }
    } catch (error) {
      console.error("Failed to save state selection:", error);
    }
  };

  const handleStateSelection = async (state: State) => {
    try {
      setSelectedState(state);
      setShowStateModal(false);

      // Track state selection
      trackEvent(MixpanelEvents.STATE_SELECTED, {
        selectedState: state,
      });

      // Save to database
      if (userId) {
        await updateUserPreferences(userId, { selected_state: state });
      }
    } catch (error) {
      console.error("Failed to save state selection:", error);
    }
  };

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
          <OnboardingTutorial
            visible={showOnboarding}
            onComplete={handleOnboardingComplete}
          />
          <StateSelectionModal
            visible={showStateModal}
            onSelectState={handleStateSelection}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
