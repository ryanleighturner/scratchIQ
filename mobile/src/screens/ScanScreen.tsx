import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
  Linking,
  InteractionManager,
} from "react-native";
import { CameraView, CameraType, Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAppStore } from "../state/appStore";
import { searchGamesByName, saveScan } from "../api/supabase";
import { callGeminiVision } from "../api/gemini";
import type { Game, State } from "../types/database";
import { ErrorModal } from "../components/ErrorModal";
import { trackScanStarted, trackScanCompleted } from "../services/analyticsService";
import { trackEvent, MixpanelEvents } from "../services/mixpanelService";

export default function ScanScreen() {
  const navigation = useNavigation<any>();
  const selectedState = useAppStore((s) => s.selectedState);
  const userId = useAppStore((s) => s.userId);
  const addRecentScan = useAppStore((s) => s.addRecentScan);
  const canScan = useAppStore((s) => s.canScan);
  const decrementScan = useAppStore((s) => s.decrementScan);
  const refundScan = useAppStore((s) => s.refundScan);
  const scansRemaining = useAppStore((s) => s.scansRemaining);
  const subscriptionStatus = useAppStore((s) => s.subscriptionStatus);

  // Detect tablet (iPad or large Android devices)
  const { width, height } = Dimensions.get("window");
  const isTablet = Math.min(width, height) >= 600;

  // Calculate frame dimensions for corner brackets
  const frameWidth = width * 0.85;
  const frameHeight = height * 0.55;

  // Use manual permission state to avoid hook crash on mount
  const [permissionState, setPermissionState] = useState<{
    granted: boolean;
    canAskAgain: boolean;
    status: "undetermined" | "granted" | "denied";
  } | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraViewMounted, setCameraViewMounted] = useState(false);
  const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: "",
    message: "",
  });
  const cameraRef = useRef<any>(null);

  // Track screen focus to properly manage camera lifecycle
  // This prevents the iOS crash when navigating between tabs
  useFocusEffect(
    useCallback(() => {
      console.log("[Camera] Screen focused");
      // Small delay before showing camera to let screen transition complete
      const timer = setTimeout(() => {
        setIsScreenFocused(true);
      }, 100);

      return () => {
        console.log("[Camera] Screen blurred - unmounting camera");
        clearTimeout(timer);
        setIsScreenFocused(false);
        setCameraReady(false);
        setCameraViewMounted(false);
      };
    }, [])
  );

  // Track component mount state to prevent permission crashes
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      setCameraReady(false);
      setCameraViewMounted(false);
    };
  }, []);

  // Delay camera initialization after permission is granted to prevent crash
  // IMPORTANT: Also requires screen to be focused to prevent AVCaptureSession crash
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interactionHandle: ReturnType<typeof InteractionManager.runAfterInteractions> | null = null;

    if (permissionState?.granted && isMounted && isScreenFocused && !cameraReady) {
      // Wait for interactions to complete, then add additional delay
      interactionHandle = InteractionManager.runAfterInteractions(() => {
        // Give native camera module extra time to initialize in production
        // This delay is critical to prevent AVCaptureSession.startRunning() crash
        timeout = setTimeout(() => {
          if (isMounted && isScreenFocused) {
            console.log("[Camera] Initializing camera view after delay");
            setCameraReady(true);
          }
        }, 1000); // Increased to 1 second for more reliable TestFlight stability
      });
    }
    return () => {
      if (timeout) clearTimeout(timeout);
      if (interactionHandle) interactionHandle.cancel();
    };
  }, [permissionState?.granted, isMounted, isScreenFocused, cameraReady]);

  // Check camera permissions safely on mount with a delay
  useEffect(() => {
    let cancelled = false;
    let interactionHandle: ReturnType<typeof InteractionManager.runAfterInteractions> | null = null;

    const checkPermissions = async () => {
      try {
        // Wait for all interactions to complete first
        await new Promise<void>((resolve) => {
          interactionHandle = InteractionManager.runAfterInteractions(() => resolve());
        });

        if (cancelled) return;

        console.log("[Camera] Checking camera permissions...");
        const result = await Camera.getCameraPermissionsAsync();

        if (cancelled) return;

        console.log("[Camera] Permission result:", result.status);
        setPermissionState({
          granted: result.granted,
          canAskAgain: result.canAskAgain,
          status: result.status as "undetermined" | "granted" | "denied",
        });
      } catch (error) {
        console.error("[Camera] Error checking camera permissions:", error);
        if (!cancelled) {
          setPermissionState({
            granted: false,
            canAskAgain: true,
            status: "undetermined",
          });
        }
      }
    };

    checkPermissions();

    return () => {
      cancelled = true;
      if (interactionHandle) interactionHandle.cancel();
    };
  }, []);

  // Removed duplicate state selection - this is already handled in App.tsx during onboarding

  // Handle permission request safely - wrapped in try/catch to prevent TestFlight crashes
  const handleRequestPermission = useCallback(async () => {
    if (permissionRequested || !isMounted) return;

    setPermissionRequested(true);
    try {
      // Add a small delay to ensure the component is fully mounted
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!isMounted) {
        setPermissionRequested(false);
        return;
      }

      console.log("[Camera] Requesting camera permission...");
      const result = await Camera.requestCameraPermissionsAsync();

      if (!isMounted) return;

      console.log("[Camera] Permission result:", result);

      // Update our permission state
      setPermissionState({
        granted: result.granted,
        canAskAgain: result.canAskAgain,
        status: result.status as "undetermined" | "granted" | "denied",
      });

      // If permission was denied and canAskAgain is false, user needs to go to settings
      if (!result?.granted && result?.canAskAgain === false) {
        console.log("[Camera] Permission permanently denied, user must enable in settings");
      }
    } catch (error) {
      console.error("[Camera] Error requesting camera permission:", error);
    } finally {
      if (isMounted) {
        setPermissionRequested(false);
      }
    }
  }, [permissionRequested, isMounted]);

  // Open device settings
  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  // Render permission loading state
  const renderPermissionLoading = () => (
    <View className="flex-1 bg-black items-center justify-center">
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );

  // Render permission denied state
  const renderPermissionDenied = () => {
    const canAskAgain = permissionState?.canAskAgain !== false;

    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Ionicons name="camera-outline" size={80} color="#9ca3af" />
        <Text className="text-2xl font-bold text-gray-900 mt-6 text-center">
          Camera Access Required
        </Text>
        <Text className="text-base text-gray-600 mt-3 text-center">
          {canAskAgain
            ? "We need access to your camera to scan lottery tickets"
            : "Camera access was denied. Please enable it in your device settings to scan lottery tickets."
          }
        </Text>
        <Pressable
          className="bg-gray-900 rounded-2xl py-4 px-8 mt-8 active:opacity-80"
          onPress={canAskAgain ? handleRequestPermission : openSettings}
          disabled={permissionRequested}
        >
          {permissionRequested ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white text-lg font-semibold">
              {canAskAgain ? "Continue" : "Open Settings"}
            </Text>
          )}
        </Pressable>
      </View>
    );
  };

  // Check if permission is still loading - wait for component mount
  const isPermissionLoading = !permissionState || !isMounted;

  // Check if permission is denied
  const isPermissionDenied = permissionState && !permissionState.granted;

  const toggleCameraFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFlash((current) => !current);
  };

  const takePicture = async () => {
    if (!cameraRef.current || isAnalyzing) return;

    // Heavy haptic for camera button
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Check scan limit
    if (!canScan()) {
      setErrorModal({
        visible: true,
        title: "No Scans Remaining",
        message: "You've used all your free scans. Earn more by sharing with friends or posting on social media!",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      trackScanStarted();
      trackEvent(MixpanelEvents.SCAN_STARTED, {
        method: "camera",
        state: selectedState,
        scansRemaining: scansRemaining - 1,
        device: Platform.OS,
        isTablet: isTablet,
      });

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
        skipProcessing: false,
      });

      if (!photo || !photo.uri) {
        throw new Error("Failed to capture image");
      }

      // Resize and compress the image aggressively for speed (smaller = faster API calls)
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 384 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipulatedImage.base64) {
        throw new Error("Failed to process image");
      }

      // Decrement scan count
      decrementScan();

      await analyzeImage(manipulatedImage.base64);
    } catch (error) {
      console.error("Error taking picture:", error);
      refundScan(); // Refund the scan on failure
      trackEvent(MixpanelEvents.SCAN_FAILED, {
        method: "camera",
        error: String(error),
      });
      setErrorModal({
        visible: true,
        title: "Capture Failed",
        message: "Failed to capture image. Please try again with better lighting.",
      });
      setIsAnalyzing(false);
    }
  };

  const pickImageFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check scan limit
    if (!canScan()) {
      setErrorModal({
        visible: true,
        title: "No Scans Remaining",
        message: "You've used all your free scans. Earn more by sharing with friends or posting on social media!",
      });
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setErrorModal({
          visible: true,
          title: "Permission Required",
          message: "Please allow access to your photo library to upload images.",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.5,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const imageUri = result.assets[0].uri;

      setIsAnalyzing(true);
      trackEvent(MixpanelEvents.SCAN_STARTED, {
        method: "gallery",
        state: selectedState,
        scansRemaining: scansRemaining - 1,
      });

      // Resize and compress the image aggressively for speed (smaller = faster API calls)
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 384 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipulatedImage.base64) {
        throw new Error("Failed to process image");
      }

      // Decrement scan count
      decrementScan();

      await analyzeImage(manipulatedImage.base64);
    } catch (error) {
      console.error("Error picking image:", error);
      refundScan(); // Refund the scan on failure
      trackEvent(MixpanelEvents.SCAN_FAILED, {
        method: "gallery",
        error: String(error),
      });
      setErrorModal({
        visible: true,
        title: "Image Load Failed",
        message: "Failed to load image. Please select a different image and try again.",
      });
      setIsAnalyzing(false);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    const totalStartTime = Date.now();
    try {
      console.log("=== SCAN ANALYSIS START ===");
      console.log("Selected State from store:", selectedState);
      console.log("UserId from store:", userId);
      console.log("Image size:", base64Image.length, "characters");

      // Use Gemini 2.5 Flash for ultra-fast vision analysis
      const visionStartTime = Date.now();
      console.log("[Vision] Starting Gemini 2.5 Flash API call...");

      const responseText = await callGeminiVision(
        base64Image,
        "List all lottery ticket names visible. JSON array only: [\"name1\", \"name2\"]",
        400
      );

      const visionEndTime = Date.now();
      console.log(`[Vision] ✓ Gemini 2.5 Flash API completed in ${visionEndTime - visionStartTime}ms`);

      console.log("AI Response:", responseText);

      if (!responseText) {
        console.error("No response from AI");
        throw new Error("No response from AI");
      }

      // Parse the ticket names from the response
      const parseStartTime = Date.now();
      let ticketNames: string[] = [];
      try {
        // Remove markdown code blocks if present
        let cleanedResponse = responseText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

        // If response was cut off, try to close it
        if (cleanedResponse.includes("[") && !cleanedResponse.includes("]")) {
          cleanedResponse += "]";
          console.log("[Parse] Response appears truncated, attempting to close JSON array");
        }

        // Try to extract JSON array from the response (greedy match to get full array)
        const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            ticketNames = JSON.parse(jsonMatch[0]);
            console.log(`[Parse] Successfully parsed ${ticketNames.length} ticket names`);
          } catch (parseError) {
            // If JSON parse fails, try to salvage what we can
            console.log("[Parse] JSON parse failed, attempting manual extraction");
            const matches = cleanedResponse.match(/"([^"]+)"/g);
            if (matches) {
              ticketNames = matches.map(m => m.replace(/"/g, ""));
              console.log(`[Parse] Manually extracted ${ticketNames.length} ticket names`);
            }
          }
        } else {
          console.error("[Parse] No JSON array found in response:", cleanedResponse);
        }
      } catch (e) {
        console.error("Failed to parse ticket names:", e);
        console.error("Response text:", responseText);
      }
      const parseEndTime = Date.now();
      console.log(`[Parse] Ticket names parsed in ${parseEndTime - parseStartTime}ms`);

      if (ticketNames.length === 0) {
        setErrorModal({
          visible: true,
          title: "No Tickets Found",
          message: "Could not identify any lottery tickets in the image. Please try again with better lighting or a closer view.",
        });
        setIsAnalyzing(false);
        return;
      }

      console.log(`Identified ${ticketNames.length} tickets:`, ticketNames);

      // Search for matching games in the database
      if (!selectedState) {
        setErrorModal({
          visible: true,
          title: "State Required",
          message: "Please select your state in the Profile settings first.",
        });
        setIsAnalyzing(false);
        return;
      }

      const dbStartTime = Date.now();
      console.log(`[Database] Searching for ${ticketNames.length} tickets in ${selectedState}...`);
      const matchedGames = await searchGamesByName(ticketNames, selectedState);
      const dbEndTime = Date.now();
      console.log(`[Database] ✓ Found ${matchedGames.length} games in ${dbEndTime - dbStartTime}ms`);

      // Save the scan (non-blocking if network fails)
      if (userId && matchedGames.length > 0) {
        const saveStartTime = Date.now();
        const gameIds = matchedGames.map((g) => g.id);
        try {
          await saveScan(userId, gameIds);
          const saveEndTime = Date.now();
          console.log(`[Database] ✓ Saved scan in ${saveEndTime - saveStartTime}ms`);
        } catch (saveError) {
          console.log("[Database] Failed to save scan (offline mode), continuing anyway");
        }
        // Always add to local state, even if remote save fails
        addRecentScan(gameIds);
      }

      const totalEndTime = Date.now();
      const scanDuration = totalEndTime - totalStartTime;
      console.log(`=== SCAN ANALYSIS COMPLETE: ${scanDuration}ms total ===`);

      // Track scan completion
      trackScanCompleted(matchedGames.length, scanDuration);
      trackEvent(MixpanelEvents.SCAN_COMPLETED, {
        ticketsIdentified: ticketNames.length,
        matchedGames: matchedGames.length,
        durationMs: scanDuration,
        state: selectedState,
      });

      setIsAnalyzing(false);

      // Navigate to results
      navigation.navigate("ScanResults", {
        identifiedTickets: ticketNames,
        matchedGames: matchedGames,
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      refundScan(); // Refund the scan on failure
      trackEvent(MixpanelEvents.SCAN_FAILED, {
        error: String(error),
        state: selectedState,
      });
      setErrorModal({
        visible: true,
        title: "Analysis Failed",
        message: "Failed to analyze the image. Please check your internet connection and try again.",
      });
      setIsAnalyzing(false);
    }
  };

  // Handle permission states without early returns (prevents hook ordering issues)
  if (isPermissionLoading) {
    return renderPermissionLoading();
  }

  if (isPermissionDenied) {
    return renderPermissionDenied();
  }

  // Show loading while camera initializes after permission granted
  if (!cameraReady || !isScreenFocused) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-4 text-base">Initializing camera...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {cameraReady && isScreenFocused && (
        <CameraView
          ref={cameraRef}
          style={{
            flex: 1,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          facing={facing}
          enableTorch={flash}
          mode="picture"
          zoom={0}
          onCameraReady={() => {
            console.log("[Camera] Native camera ready");
            setCameraViewMounted(true);
          }}
        />
      )}

      {/* Show loading overlay until camera is fully ready */}
      {cameraReady && !cameraViewMounted && (
        <View className="absolute inset-0 bg-black items-center justify-center z-50">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="text-white mt-4 text-base">Starting camera...</Text>
        </View>
      )}

      {/* Top Overlay - outside CameraView */}
      <View
        className="absolute top-0 left-0 right-0 z-10 pt-16 px-6"
        pointerEvents="box-none"
      >
        <View className="flex-row items-center justify-between" pointerEvents="auto">
          {/* Close Button */}
          <Pressable
            className="w-10 h-10 items-center justify-center active:opacity-70"
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="close"
              size={28}
              color="white"
            />
          </Pressable>

          <Pressable
            className="w-10 h-10 items-center justify-center active:opacity-70"
            onPress={toggleFlash}
          >
            <Ionicons
              name={flash ? "flash" : "flash-off"}
              size={24}
              color="white"
            />
          </Pressable>
        </View>

        <View className="mt-2 items-center" pointerEvents="none">
          <Image
            source={require("../../assets/logo-1763244547866.png")}
            style={{ width: 300, height: 75 }}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Center Text - outside CameraView */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
        pointerEvents="none"
      >
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "500",
            textAlign: "center",
            paddingHorizontal: 32,
          }}
        >
          Scan Scratch-Off Display
        </Text>
      </View>

      {/* Bottom Controls - outside CameraView */}
      <View className="absolute bottom-0 left-0 right-0 z-10 pb-12 px-6" pointerEvents="box-none">
        <View className="flex-row items-center justify-around" pointerEvents="auto">
          <Pressable
            className="w-12 h-12 bg-black/50 rounded-full items-center justify-center active:bg-black/70"
            onPress={pickImageFromGallery}
            disabled={isAnalyzing}
          >
            <Ionicons name="images" size={28} color="white" />
          </Pressable>

          <Pressable
            className="w-20 h-20 bg-white rounded-full items-center justify-center border-4 border-white/30 active:scale-95"
            onPress={takePicture}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <View className="w-16 h-16 bg-white rounded-full border-2 border-black" />
            )}
          </Pressable>

          <Pressable
            className="w-12 h-12 bg-black/50 rounded-full items-center justify-center active:bg-black/70"
            onPress={toggleCameraFacing}
            disabled={isAnalyzing}
          >
            <Ionicons name="camera-reverse" size={28} color="white" />
          </Pressable>
        </View>

        {isAnalyzing && (
          <View className="mt-4 bg-black/50 rounded-2xl p-3" pointerEvents="none">
            <Text className="text-white text-sm text-center font-medium">
              Analyzing tickets with AI...
            </Text>
          </View>
        )}
      </View>

      {/* Error Modal */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ visible: false, title: "", message: "" })}
        actionText={errorModal.title === "No Scans Remaining" ? "Earn More Scans" : undefined}
        onAction={errorModal.title === "No Scans Remaining" ? () => {
          setErrorModal({ visible: false, title: "", message: "" });
          navigation.navigate("Profile");
        } : undefined}
      />
    </View>
  );
}
