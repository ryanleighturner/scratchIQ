import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../state/appStore";
import { getHotGames, getAllGames } from "../api/supabase";
import { LogoHeader } from "../components/LogoHeader";
import { checkForNewHotTickets } from "../services/notificationService";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const selectedState = useAppStore((s) => s.selectedState);
  const hotGames = useAppStore((s) => s.hotGames);
  const setHotGames = useAppStore((s) => s.setHotGames);
  const setAllGames = useAppStore((s) => s.setAllGames);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!selectedState) return; // Don't load data if no state selected

    try {
      setError(null);
      const [hot, all] = await Promise.all([
        getHotGames(selectedState),
        getAllGames(selectedState),
      ]);
      setHotGames(hot);
      setAllGames(all);

      // Check for NEW hot tickets and send notification if any found
      if (notificationsEnabled && hot.length > 0) {
        await checkForNewHotTickets(hot);
      }
    } catch (err) {
      setError("Failed to load games. Please check your connection.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedState]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <LogoHeader />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Error State */}
        {error && (
          <View className="mx-6 mt-4 p-4 bg-red-50 rounded-xl">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        )}

        {/* Hero Section */}
        <View className="mt-6 px-6">
          <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">
            Welcome to ScratchIQ
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-6">
            Make smarter lottery decisions with real-time data and mathematical
            analysis. Learn how we rank tickets below.
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-8">
          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 bg-indigo-600 rounded-2xl p-4 active:bg-indigo-700"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("Scan");
              }}
            >
              <View className="items-center">
                <Ionicons name="scan" size={28} color="white" />
                <Text className="text-white font-bold text-sm mt-2">
                  Scan Tickets
                </Text>
              </View>
            </Pressable>
            <Pressable
              className="flex-1 bg-purple-600 rounded-2xl p-4 active:bg-purple-700"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("Tickets");
              }}
            >
              <View className="items-center">
                <Ionicons name="search" size={28} color="white" />
                <Text className="text-white font-bold text-sm mt-2">
                  Browse All
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Understanding Metrics Section */}
        <View className="px-6 mb-8">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
              How We Rank Tickets
            </Text>
            <Text className="text-sm text-gray-600 mb-6 text-center">
              We use 4 metrics based on remaining prizes (current state)
            </Text>

            {/* Metrics */}
            <View className="gap-4">
              <MetricCard
                icon="IQ"
                title="ScratchIQ Score"
                subtitle="0-100 Scale"
                description="Value score based on current remaining prizes. 70+ = hot deal, 50-69 = average, below 50 = poor value"
                example="Score updates as prizes are claimed"
                color="#9333ea"
                bgColor="#faf5ff"
              />
              <MetricCard
                icon="PS"
                title="Prize Status"
                subtitle="Game Freshness"
                description="Emoji-coded indicator showing prize availability: 🟢 Fresh (80+), 🟡 Mixed (50-79), 🟠 Picked Over (20-49), 🔴 Almost Done"
                example="Quick visual health check"
                color="#6366f1"
                bgColor="#eef2ff"
              />
              <MetricCard
                iconName="flame"
                title="Hot Tickets"
                subtitle="Top 5% Nationally"
                description="Best ScratchIQ Scores available across the country right now"
                example="Filtered by current prize state"
                color="#f97316"
                bgColor="#fff7ed"
              />
              <MetricCard
                icon="%"
                title="Money-Back Odds"
                subtitle="Win-back chance"
                description="Percentage chance of winning back your ticket price based on remaining prizes"
                example="12.5% = Break-even probability"
                color="#ec4899"
                bgColor="#fdf2f8"
              />
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View className="px-6 pb-8">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Powerful Features
            </Text>
            <Text className="text-sm text-gray-600 mb-6 text-center">
              Everything you need to play smarter
            </Text>

            <View className="gap-4">
              <FeatureRow
                icon="calculator"
                title="Real-Time Calculations"
                description="Live scores updated daily based on current remaining prizes"
                color="#6366f1"
              />
              <FeatureRow
                icon="scan"
                title="AI Camera Scanner"
                description="Identify tickets instantly with your phone"
                color="#8b5cf6"
              />
              <FeatureRow
                icon="notifications"
                title="Smart Alerts"
                description="Get notified when hot tickets appear"
                color="#ec4899"
              />
              <FeatureRow
                icon="heart"
                title="Favorites & Tracking"
                description="Save and monitor your preferred tickets"
                color="#ef4444"
              />
            </View>
          </View>
        </View>

        {/* Social Media & Sharing Section */}
        <View className="px-6 pb-8">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Connect With Us
            </Text>
            <Text className="text-sm text-gray-600 mb-6 text-center">
              Follow us and share your wins to earn 50 free scans!
            </Text>

            {/* Social Media Buttons */}
            <View className="gap-4 mb-6">
              <Pressable
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  await Linking.openURL("https://www.tiktok.com/@scratchiq");
                }}
                className="bg-black rounded-2xl p-5 flex-row items-center active:opacity-80"
              >
                <View className="w-14 h-14 bg-white rounded-full items-center justify-center mr-4">
                  <Ionicons name="logo-tiktok" size={32} color="#000000" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg">TikTok</Text>
                  <Text className="text-white/80 text-sm">@ScratchIQ</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </Pressable>

              <Pressable
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  await Linking.openURL("https://www.instagram.com/scratchIQapp");
                }}
                className="bg-gradient-to-r rounded-2xl p-5 flex-row items-center active:opacity-80"
                style={{ backgroundColor: "#E4405F" }}
              >
                <View className="w-14 h-14 bg-white rounded-full items-center justify-center mr-4">
                  <Ionicons name="logo-instagram" size={32} color="#E4405F" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg">Instagram</Text>
                  <Text className="text-white/80 text-sm">@scratchIQapp</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </Pressable>
            </View>

            {/* Sharing Info */}
            <View className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5">
              <View className="flex-row items-start mb-3">
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#6366f1" }}>
                  <Ionicons name="gift" size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 mb-1">
                    Earn 50 Free Scans
                  </Text>
                  <Text className="text-sm text-gray-700 leading-5">
                    Post a winning ticket photo and tag us on TikTok or Instagram. We will send you a code for 50 free scans!
                  </Text>
                </View>
              </View>
              <View className="bg-white/60 rounded-lg p-3">
                <Text className="text-xs font-semibold text-gray-800 text-center">
                  Share your wins • Tag @scratchIQapp • Get your reward code
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  iconName,
  title,
  subtitle,
  description,
  example,
  color,
  bgColor,
}: {
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  description: string;
  example: string;
  color: string;
  bgColor: string;
}) {
  return (
    <View className="rounded-xl p-4" style={{ backgroundColor: bgColor }}>
      <View className="flex-row items-start mb-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: color }}
        >
          {iconName ? (
            <Ionicons name={iconName} size={18} color="white" />
          ) : (
            <Text className="text-white font-bold text-xs">{icon}</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">{title}</Text>
          <Text className="text-xs font-semibold" style={{ color }}>
            {subtitle}
          </Text>
        </View>
      </View>
      <Text className="text-sm text-gray-700 leading-5 mb-2">
        {description}
      </Text>
      <Text className="text-xs font-semibold text-gray-600">{example}</Text>
    </View>
  );
}

function FeatureRow({
  icon,
  title,
  description,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <View className="flex-row items-start">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3 mt-0.5"
        style={{ backgroundColor: `${color}15` }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-gray-900 mb-1">{title}</Text>
        <Text className="text-sm text-gray-600 leading-5">{description}</Text>
      </View>
    </View>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <View className="bg-gray-50 rounded-xl p-4">
      <View className="flex-row items-start">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 mb-1">
            {title}
          </Text>
          <Text className="text-sm text-gray-600 leading-5">{description}</Text>
        </View>
      </View>
    </View>
  );
}
