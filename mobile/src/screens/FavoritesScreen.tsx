import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../state/appStore";
import { getGamesByIds } from "../api/supabase";
import { EmptyState } from "../components/EmptyState";
import { LogoHeader } from "../components/LogoHeader";
import {
  checkFavoritesForNotifications,
  getPreviousFavoriteEVs,
} from "../services/notificationService";
import type { Game } from "../types/database";
import {
  formatScratchIQScore,
  formatMoney,
  getPrizeStatus,
} from "../utils/formatters";

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const favoriteGameIds = useAppStore((s) => s.favoriteGameIds);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, [favoriteGameIds]);

  const loadFavorites = async () => {
    if (favoriteGameIds.length === 0) {
      setFavoriteGames([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const games = await getGamesByIds(favoriteGameIds);
      setFavoriteGames(games);

      // Check for ScratchIQ Score improvements and send notifications if enabled
      if (notificationsEnabled) {
        const previousEVs = await getPreviousFavoriteEVs();
        await checkFavoritesForNotifications(games, previousEVs);
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  if (favoriteGames.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <LogoHeader />
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-900">Favorites</Text>
          <Text className="text-sm text-gray-500 mt-1">Your bookmarked tickets</Text>
        </View>
        <EmptyState
          icon="heart-outline"
          title="No Favorites Yet"
          description="Bookmark your favorite lottery tickets to track them here. Tap the heart icon on any game card to add it."
          actionLabel="Browse Tickets"
          onAction={() => navigation.navigate("Tickets")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <LogoHeader />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-900">Favorites</Text>
          <Text className="text-sm text-gray-500 mt-1">
            {favoriteGames.length} bookmarked {favoriteGames.length === 1 ? "ticket" : "tickets"}
          </Text>
        </View>

        <View className="px-6 mt-4 gap-3 pb-8">
          {favoriteGames.map((game) => (
            <FavoriteGameCard key={game.id} game={game} onToggleFavorite={toggleFavorite} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FavoriteGameCard({ game, onToggleFavorite }: { game: Game; onToggleFavorite: (id: string) => void }) {
  const navigation = useNavigation<any>();

  // Get prize status for display
  const prizeStatus = getPrizeStatus(game.prize_quality_score);
  const scratchIQScore = formatScratchIQScore(game.ev);

  return (
    <Pressable
      className="bg-white border border-gray-200 rounded-xl p-4 active:bg-gray-50"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate("GameDetail", { gameId: game.id });
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-1 mr-3">
          {game.image_url ? (
            <Image
              source={{ uri: game.image_url }}
              className="w-16 h-20 rounded-lg mr-3"
              resizeMode="cover"
            />
          ) : (
            <View className="w-16 h-20 rounded-lg mr-3 bg-gray-100 items-center justify-center">
              <Ionicons name="ticket" size={24} color="#9ca3af" />
            </View>
          )}

          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 mb-1">{game.name}</Text>
            <View className="flex-row items-center flex-wrap gap-2 mt-1">
              <View className="bg-green-100 px-2 py-1 rounded">
                <Text className="text-green-700 text-xs font-semibold">${game.price}</Text>
              </View>
              {game.prize_quality_score !== null && game.prize_quality_score !== undefined && (
                <View className="bg-indigo-100 px-2 py-1 rounded flex-row items-center">
                  <Text className="text-indigo-700 text-xs font-semibold mr-1">
                    {prizeStatus.emoji}
                  </Text>
                  <Text className="text-indigo-700 text-xs font-semibold">
                    {prizeStatus.text}
                  </Text>
                </View>
              )}
              {game.ev !== null && game.ev !== undefined && (
                <View className="bg-purple-100 px-2 py-1 rounded">
                  <Text className="text-purple-700 text-xs font-semibold">
                    IQ Score: {scratchIQScore}
                  </Text>
                </View>
              )}
              {game.is_hot && (
                <View className="bg-orange-100 px-2 py-1 rounded flex-row items-center">
                  <Ionicons name="flame" size={12} color="#f97316" />
                  <Text className="text-orange-700 text-xs font-semibold ml-1">Hot</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <Pressable
          className="ml-2 active:opacity-50"
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onToggleFavorite(game.id);
          }}
        >
          <Ionicons name="heart" size={24} color="#ef4444" />
        </Pressable>
      </View>

      {game.top_prize_amount && (
        <View className="mt-3 pt-3 border-t border-gray-100">
          <Text className="text-sm text-gray-600">
            Jackpot: {formatMoney(game.top_prize_amount)}
            {game.top_prize_remaining !== null && ` • ${game.top_prize_remaining} left`}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
