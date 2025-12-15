import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Modal, Dimensions, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { STATES } from "../types/database";
import type { State } from "../types/database";
import {
  trackOnboardingStarted,
  trackOnboardingCompleted,
  trackOnboardingSkipped,
} from "../services/analyticsService";

const { width } = Dimensions.get("window");

interface OnboardingProps {
  visible: boolean;
  onComplete: (selectedState: State) => void;
}

const slides = [
  {
    icon: "scan" as const,
    title: "Welcome to ScratchIQ",
    description: "Find the best lottery scratch-off tickets using real-time data and smart analytics",
    color: "#6366f1",
  },
  {
    icon: "camera" as const,
    title: "Instant Scanning",
    description: "Point your camera at ticket displays to instantly analyze and compare all available tickets",
    color: "#8b5cf6",
  },
  {
    icon: "heart" as const,
    title: "Track Favorites",
    description: "Bookmark your favorite tickets and get notified when they become hot picks with better odds",
    color: "#ec4899",
  },
  {
    icon: "calculator" as const,
    title: "Smart Rankings",
    description: "We analyze Real Time Odds, prize availability, and break-even chances to show you the best value tickets",
    color: "#10b981",
  },
];

export default function OnboardingTutorial({ visible, onComplete }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const progress = useSharedValue(0);

  // Track onboarding started when visible
  useEffect(() => {
    if (visible) {
      trackOnboardingStarted();
    }
  }, [visible]);

  const handleNext = () => {
    if (currentIndex < slides.length + 1) {
      // +1 for state selection + disclaimer
      setCurrentIndex(currentIndex + 1);
      progress.value = withSpring(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    // Skip directly to state selection
    trackOnboardingSkipped();
    setCurrentIndex(slides.length);
  };

  const handleStateSelection = (state: State) => {
    setSelectedState(state);
  };

  const handleStateConfirm = () => {
    if (selectedState) {
      // Move to disclaimer screen
      setCurrentIndex(slides.length + 1);
    }
  };

  const handleComplete = () => {
    if (selectedState) {
      trackOnboardingCompleted(selectedState);
      onComplete(selectedState);
    }
  };

  const isStateSelectionScreen = currentIndex === slides.length;
  const isDisclaimerScreen = currentIndex === slides.length + 1;
  const currentSlide = slides[currentIndex] || slides[0]; // Fallback to first slide
  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View className="flex-1 bg-white">
        {isDisclaimerScreen ? (
          // Disclaimer Screen
          <>
            {/* Header */}
            <View className="pt-16 px-8 pb-6 bg-amber-500">
              <View className="items-center mb-4">
                <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
                  <Ionicons name="alert-circle" size={40} color="white" />
                </View>
                <Text className="text-3xl font-bold text-white text-center mb-2">
                  Important Notice
                </Text>
                <Text className="text-amber-100 text-center text-base">
                  Please read before continuing
                </Text>
              </View>
            </View>

            {/* Disclaimer Content */}
            <ScrollView className="flex-1 px-8 pt-6" showsVerticalScrollIndicator={true}>
              {/* Informational Purposes */}
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="information-circle" size={24} color="#6366f1" />
                  <Text className="text-lg font-bold text-gray-900 ml-2">
                    For Informational Purposes Only
                  </Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  All data, odds, and prize information are unofficial and provided for informational purposes only. Always verify with your state lottery for official information.
                </Text>
              </View>

              {/* Responsible Gaming */}
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="warning" size={24} color="#f59e0b" />
                  <Text className="text-lg font-bold text-gray-900 ml-2">
                    Play Responsibly
                  </Text>
                </View>
                <Text className="text-base text-gray-700 leading-6 mb-3">
                  You must be 18+ to play. Never spend more than you can afford to lose.
                </Text>
                <View className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <Text className="text-base text-gray-900 font-semibold mb-2">
                    If you or someone you know has a gambling problem:
                  </Text>
                  <Text className="text-base text-gray-700 leading-6 mb-1">
                    Call the National Problem Gambling Helpline
                  </Text>
                  <Text className="text-xl font-bold text-amber-700 mb-1">
                    1-800-GAMBLER
                  </Text>
                  <Text className="text-sm text-gray-600">
                    (1-800-426-2537) • Available 24/7 • Free & confidential
                  </Text>
                </View>
              </View>

              {/* No Guarantees */}
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="calculator" size={24} color="#8b5cf6" />
                  <Text className="text-lg font-bold text-gray-900 ml-2">
                    No Guarantee of Results
                  </Text>
                </View>
                <Text className="text-base text-gray-700 leading-6">
                  Real Time Odds calculations are statistical estimates based on remaining prizes and do not guarantee any outcome. All lottery games have a house edge - players lose money on average over time.
                </Text>
              </View>

              {/* Bottom Spacing */}
              <View className="h-4" />
            </ScrollView>

            {/* Accept Button */}
            <View className="px-8 pb-12 pt-4 border-t border-gray-200 bg-white">
              <Pressable
                className="bg-indigo-600 rounded-2xl py-4 items-center active:opacity-80"
                onPress={handleComplete}
              >
                <Text className="text-white text-lg font-bold">
                  I Understand
                </Text>
              </Pressable>
            </View>
          </>
        ) : isStateSelectionScreen ? (
          // State Selection Screen
          <>
            {/* Header */}
            <View className="pt-16 px-8 pb-6 bg-indigo-600">
              <View className="items-center mb-4">
                <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
                  <Ionicons name="location" size={40} color="white" />
                </View>
                <Text className="text-3xl font-bold text-white text-center mb-2">
                  Select Your State
                </Text>
                <Text className="text-indigo-100 text-center text-base">
                  {"Choose your state to see lottery tickets available in your area"}
                </Text>
              </View>
            </View>

            {/* State List */}
            <View className="flex-1">
              <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={true}>
                {STATES.map((state) => (
                  <Pressable
                    key={state.value}
                    className={`flex-row items-center justify-between p-4 rounded-xl mb-3 ${
                      selectedState === state.value
                        ? "bg-indigo-50 border-2 border-indigo-500"
                        : "bg-gray-50 border-2 border-transparent"
                    } active:opacity-70`}
                    onPress={() => handleStateSelection(state.value)}
                  >
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                          selectedState === state.value ? "bg-indigo-100" : "bg-gray-200"
                        }`}
                      >
                        <Ionicons
                          name="location"
                          size={20}
                          color={selectedState === state.value ? "#6366f1" : "#9ca3af"}
                        />
                      </View>
                      <Text
                        className={`ml-3 text-base font-semibold ${
                          selectedState === state.value ? "text-indigo-700" : "text-gray-900"
                        }`}
                      >
                        {state.label}
                      </Text>
                    </View>
                    {selectedState === state.value && (
                      <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Continue Button */}
            <View className="px-8 pb-12 pt-4 border-t border-gray-200 bg-white">
              <Pressable
                className={`rounded-2xl py-4 items-center ${
                  selectedState
                    ? "bg-indigo-600 active:opacity-80"
                    : "bg-gray-300"
                }`}
                onPress={handleStateConfirm}
                disabled={!selectedState}
              >
                <Text className="text-white text-lg font-bold">
                  Continue
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          // Tutorial Slides
          <>
            {/* Skip Button */}
            {!isLastSlide && (
              <View className="absolute top-12 right-6 z-10">
                <Pressable onPress={handleSkip} className="active:opacity-70">
                  <Text className="text-gray-500 font-semibold text-base">Skip</Text>
                </Pressable>
              </View>
            )}

            {/* Content */}
            <View className="flex-1 items-center justify-center px-8">
              {/* Icon */}
              <View
                className="w-32 h-32 rounded-full items-center justify-center mb-8"
                style={{ backgroundColor: `${currentSlide.color}20` }}
              >
                <Ionicons name={currentSlide.icon} size={64} color={currentSlide.color} />
              </View>

              {/* Title */}
              <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
                {currentSlide.title}
              </Text>

              {/* Description */}
              <Text className="text-lg text-gray-600 text-center leading-7">
                {currentSlide.description}
              </Text>
            </View>

            {/* Bottom Section */}
            <View className="pb-12 px-8">
              {/* Progress Dots */}
              <View className="flex-row items-center justify-center mb-8 gap-2">
                {slides.map((_, index) => (
                  <View
                    key={index}
                    className="rounded-full"
                    style={{
                      width: currentIndex === index ? 24 : 8,
                      height: 8,
                      backgroundColor: currentIndex === index ? currentSlide.color : "#d1d5db",
                    }}
                  />
                ))}
              </View>

              {/* Next Button */}
              <Pressable
                className="rounded-2xl py-4 items-center active:opacity-80"
                style={{ backgroundColor: currentSlide.color }}
                onPress={handleNext}
              >
                <Text className="text-white text-lg font-bold">
                  {isLastSlide ? "Continue" : "Next"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
