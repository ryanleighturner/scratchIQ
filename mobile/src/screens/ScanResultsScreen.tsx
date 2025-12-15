import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { Game } from "../types/database";
import { EmptyState } from "../components/EmptyState";
import { LogoHeader } from "../components/LogoHeader";
import { useAppStore } from "../state/appStore";
import {
  formatScratchIQScore,
  formatOverallOdds,
  formatBreakEvenOdds,
  getPrizeStatus,
  formatMoney,
  getWinChance,
} from "../utils/formatters";

export default function ScanResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [sortBy, setSortBy] = useState<"overall_odds" | "prize_quality_score" | "hot" | "break_even_odds">("overall_odds");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const identifiedTickets: string[] = route.params?.identifiedTickets || [];
  const matchedGames: Game[] = route.params?.matchedGames || [];

  const handleShare = async () => {
    try {
      const topGames = topRecommendations.slice(0, 3);
      const gamesList = topGames
        .map((g, i) => `${i + 1}. ${g.name} - $${g.price} (IQ Score: ${formatScratchIQScore(g.ev)})`)
        .join("\n");

      const message = `ScratchIQ Scan Results\n\nFound ${sortedGames.length} tickets!\n\nTop Recommendations:\n${gamesList}\n\nGet ScratchIQ to find the best lottery tickets!`;

      await Share.share({
        message,
        title: "My ScratchIQ Scan Results",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Sort matched games based on selected metric (same logic as TicketsScreen)
  const sortedGames = [...matchedGames].sort((a, b) => {
    if (sortBy === "overall_odds") {
      // Higher EV is better - sort descending (we're using ev field which maps to IQ Score)
      return (b.ev || 0) - (a.ev || 0);
    } else if (sortBy === "prize_quality_score") {
      return (b.prize_quality_score || 0) - (a.prize_quality_score || 0);
    } else if (sortBy === "hot") {
      // Hot first, then by ev (higher is better)
      if (a.is_hot === b.is_hot) {
        return (b.ev || 0) - (a.ev || 0);
      }
      return a.is_hot ? -1 : 1;
    } else if (sortBy === "break_even_odds") {
      // Sort by break-even odds as percentage - higher percentage is better
      const parseOddsToPercent = (odds: string | null) => {
        if (!odds) return -1; // Put nulls at the end

        // Handle "1:X.XX" format
        if (odds.includes(":")) {
          const parts = odds.split(":");
          if (parts.length === 2) {
            const ratio = parseFloat(parts[1]);
            if (!isNaN(ratio) && ratio !== 0) {
              return (1 / ratio) * 100; // Convert to percentage
            }
          }
        } else {
          // Handle decimal format (e.g., 0.1923)
          const decimal = parseFloat(odds);
          if (!isNaN(decimal)) {
            return decimal * 100; // Convert to percentage
          }
        }
        return -1;
      };
      // Sort descending - higher percentage is better
      return parseOddsToPercent(b.break_even_odds) - parseOddsToPercent(a.break_even_odds);
    }
    return 0;
  });

  // Get top 5 tickets based on current sort
  const topRecommendations = sortedGames
    .filter((g) => g.overall_odds !== null && g.overall_odds !== undefined)
    .slice(0, 5);

  // Show empty state if no games matched
  if (sortedGames.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <LogoHeader />
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">
              Scan Results
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              No tickets matched
            </Text>
          </View>
          <Pressable
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center active:bg-gray-200"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </Pressable>
        </View>
        <EmptyState
          icon="search-outline"
          title="No Matches Found"
          description="We could not find these tickets in the database for your state. Try scanning again with better lighting or check if your state is set correctly."
          actionLabel="Try Again"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <LogoHeader />
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">
              Scan Results
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Found {sortedGames.length} tickets in database
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center active:bg-indigo-200"
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={22} color="#6366f1" />
            </Pressable>
            <Pressable
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center active:bg-gray-200"
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color="#111827" />
            </Pressable>
          </View>
        </View>

        {/* Sort By Dropdown */}
        <View className="px-6 mt-4">
          <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase">
            Sort By
          </Text>
          <Pressable
            className={`flex-row items-center justify-between rounded-xl px-4 py-3 active:opacity-80 ${
              sortBy === "prize_quality_score"
                ? "bg-indigo-50"
                : sortBy === "overall_odds"
                ? "bg-purple-50"
                : sortBy === "hot"
                ? "bg-orange-50"
                : "bg-pink-50"
            }`}
            onPress={() => setShowSortDropdown(!showSortDropdown)}
          >
            <View className="flex-row items-center">
              <Ionicons
                name={
                  sortBy === "overall_odds"
                    ? "calculator"
                    : sortBy === "prize_quality_score"
                    ? "trophy"
                    : sortBy === "hot"
                    ? "flame"
                    : "speedometer"
                }
                size={18}
                color={
                  sortBy === "overall_odds"
                    ? "#9333ea"
                    : sortBy === "prize_quality_score"
                    ? "#6366f1"
                    : sortBy === "hot"
                    ? "#ea580c"
                    : "#ec4899"
                }
              />
              <Text className={`ml-2 text-sm font-semibold ${
                sortBy === "overall_odds"
                  ? "text-purple-700"
                  : sortBy === "prize_quality_score"
                  ? "text-indigo-700"
                  : sortBy === "hot"
                  ? "text-orange-700"
                  : "text-pink-700"
              }`}>
                {sortBy === "overall_odds"
                  ? "IQ Score"
                  : sortBy === "prize_quality_score"
                  ? "Prize Status"
                  : sortBy === "hot"
                  ? "Hot Tickets"
                  : "Money-Back Odds"}
              </Text>
            </View>
            <Ionicons
              name={showSortDropdown ? "chevron-up" : "chevron-down"}
              size={18}
              color="#9ca3af"
            />
          </Pressable>

          {/* Dropdown Options */}
          {showSortDropdown && (
            <View className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
              <Pressable
                className={`flex-row items-center px-3 py-2.5 active:bg-gray-50 ${
                  sortBy === "overall_odds" ? "bg-purple-50" : ""
                }`}
                onPress={() => {
                  setSortBy("overall_odds");
                  setShowSortDropdown(false);
                }}
              >
                <Ionicons
                  name="calculator"
                  size={18}
                  color={sortBy === "overall_odds" ? "#9333ea" : "#9ca3af"}
                />
                <Text
                  className={`ml-2 text-sm font-semibold ${
                    sortBy === "overall_odds" ? "text-purple-700" : "text-gray-900"
                  }`}
                >
                  IQ Score
                </Text>
                {sortBy === "overall_odds" && (
                  <Ionicons name="checkmark-circle" size={18} color="#9333ea" style={{ marginLeft: "auto" }} />
                )}
              </Pressable>

              <View className="h-px bg-gray-200" />

              <Pressable
                className={`flex-row items-center px-3 py-2.5 active:bg-gray-50 ${
                  sortBy === "prize_quality_score" ? "bg-indigo-50" : ""
                }`}
                onPress={() => {
                  setSortBy("prize_quality_score");
                  setShowSortDropdown(false);
                }}
              >
                <Ionicons
                  name="trophy"
                  size={18}
                  color={sortBy === "prize_quality_score" ? "#6366f1" : "#9ca3af"}
                />
                <Text
                  className={`ml-2 text-sm font-semibold ${
                    sortBy === "prize_quality_score" ? "text-indigo-700" : "text-gray-900"
                  }`}
                >
                  Prize Status
                </Text>
                {sortBy === "prize_quality_score" && (
                  <Ionicons name="checkmark-circle" size={18} color="#6366f1" style={{ marginLeft: "auto" }} />
                )}
              </Pressable>

              <View className="h-px bg-gray-200" />

              <Pressable
                className={`flex-row items-center px-3 py-2.5 active:bg-gray-50 ${
                  sortBy === "hot" ? "bg-orange-50" : ""
                }`}
                onPress={() => {
                  setSortBy("hot");
                  setShowSortDropdown(false);
                }}
              >
                <Ionicons
                  name="flame"
                  size={18}
                  color={sortBy === "hot" ? "#ea580c" : "#9ca3af"}
                />
                <Text
                  className={`ml-2 text-sm font-semibold ${
                    sortBy === "hot" ? "text-orange-700" : "text-gray-900"
                  }`}
                >
                  Hot Tickets
                </Text>
                {sortBy === "hot" && (
                  <Ionicons name="checkmark-circle" size={18} color="#ea580c" style={{ marginLeft: "auto" }} />
                )}
              </Pressable>

              <View className="h-px bg-gray-200" />

              <Pressable
                className={`flex-row items-center px-3 py-2.5 active:bg-gray-50 ${
                  sortBy === "break_even_odds" ? "bg-pink-50" : ""
                }`}
                onPress={() => {
                  setSortBy("break_even_odds");
                  setShowSortDropdown(false);
                }}
              >
                <Ionicons
                  name="speedometer"
                  size={18}
                  color={sortBy === "break_even_odds" ? "#ec4899" : "#9ca3af"}
                />
                <Text
                  className={`ml-2 text-sm font-semibold ${
                    sortBy === "break_even_odds" ? "text-pink-700" : "text-gray-900"
                  }`}
                >
                  Break-Even Odds
                </Text>
                {sortBy === "break_even_odds" && (
                  <Ionicons name="checkmark-circle" size={18} color="#ec4899" style={{ marginLeft: "auto" }} />
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Top Recommendations */}
        {topRecommendations.length > 0 && (
          <View className="mt-6 px-6">
            <View className="bg-green-50 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="trophy" size={24} color="#10b981" />
                <Text className="text-lg font-bold text-green-900 ml-2">
                  Top Recommendations
                </Text>
              </View>
            <Text className="text-sm text-green-700">
              Best {topRecommendations.length} tickets ranked by{" "}
              {sortBy === "overall_odds"
                ? "IQ Score"
                : sortBy === "prize_quality_score"
                ? "Prize Status"
                : sortBy === "hot"
                ? "Hot Tickets (Top 5%)"
                : "Money-Back Odds"}
            </Text>
            </View>

            <View className="gap-3 mb-6">
              {topRecommendations.map((game) => (
                <RecommendedGameCard key={game.id} game={game} />
              ))}
            </View>
          </View>
        )}

        {/* All Matched Tickets Section */}
        <View className="mt-2 px-6 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">
              All Scanned Tickets
            </Text>
            <View className="bg-indigo-100 px-3 py-1 rounded-full">
              <Text className="text-indigo-700 text-sm font-semibold">
                {sortedGames.length} found
              </Text>
            </View>
          </View>
          <View className="gap-3">
            {sortedGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </View>
        </View>

        {/* Identified but not matched */}
        {identifiedTickets.length > sortedGames.length && (
          <View className="mt-8 mx-6 mb-8 bg-gray-50 rounded-2xl p-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Not in Database:
            </Text>
            <Text className="text-sm text-gray-600">
              {identifiedTickets
                .filter(
                  (name) =>
                    !sortedGames.some((g) =>
                      g.name.toLowerCase().includes(name.toLowerCase())
                    )
                )
                .join(", ")}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="px-6 pb-8 gap-3">
          <Pressable
            className="bg-gray-900 rounded-2xl py-4 flex-row items-center justify-center active:opacity-80"
            onPress={() => navigation.navigate("Scan")}
          >
            <Ionicons name="scan" size={20} color="white" />
            <Text className="text-white text-base font-semibold ml-2">
              Scan Again
            </Text>
          </Pressable>

          <Pressable
            className="bg-white border-2 border-gray-200 rounded-2xl py-4 flex-row items-center justify-center active:opacity-60"
            onPress={() => {
              navigation.goBack();
              setTimeout(() => {
                navigation.navigate("MainTabs", { screen: "Tickets" });
              }, 100);
            }}
          >
            <Text className="text-gray-900 text-base font-semibold">
              View All Tickets
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecommendedGameCard({ game }: { game: Game }) {
  const navigation = useNavigation<any>();
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFav = useAppStore((s) => s.favoriteGameIds.includes(game.id));

  // Get formatted metrics (same as TicketsScreen)
  const prizeStatus = getPrizeStatus(game.prize_quality_score);
  const scratchIQScore = formatScratchIQScore(game.ev);

  return (
    <Pressable
      className="bg-white border-2 border-green-200 rounded-xl p-4 active:bg-green-50"
      onPress={() => navigation.navigate("GameDetail", { gameId: game.id })}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-1 mr-3">
          {/* Ticket Image */}
          {game.image_url ? (
            <Image
              source={{ uri: game.image_url }}
              className="w-16 h-20 rounded-lg mr-3"
              resizeMode="cover"
            />
          ) : (
            <View className="w-16 h-20 rounded-lg mr-3 bg-green-50 items-center justify-center">
              <Ionicons name="ticket" size={24} color="#10b981" />
            </View>
          )}

          {/* Game Info */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              {game.is_hot && (
                <Ionicons name="flame" size={18} color="#f59e0b" />
              )}
              <Text className="text-base font-bold text-gray-900 flex-1">
                {game.name}
              </Text>
            </View>
            <View className="flex-row items-center flex-wrap gap-2 mt-2">
              <View className="bg-green-100 px-3 py-1.5 rounded-lg">
                <Text className="text-green-700 text-sm font-bold">
                  ${game.price}
                </Text>
              </View>
              {game.prize_quality_score !== null && game.prize_quality_score !== undefined && (
                <View className="bg-indigo-100 px-3 py-1.5 rounded-lg flex-row items-center">
                  <Text className="text-indigo-700 text-sm font-bold mr-1">
                    {prizeStatus.emoji}
                  </Text>
                  <Text className="text-indigo-700 text-sm font-bold">
                    {prizeStatus.text}
                  </Text>
                </View>
              )}
              {game.ev !== null && game.ev !== undefined && (
                <View className="bg-purple-100 px-3 py-1.5 rounded-lg">
                  <Text className="text-purple-700 text-sm font-bold">
                    IQ Score: {scratchIQScore}
                  </Text>
                </View>
              )}
              {game.break_even_odds && (
                <View className="bg-pink-100 px-3 py-1.5 rounded-lg">
                  <Text className="text-pink-700 text-sm font-bold">
                    {formatBreakEvenOdds(game.break_even_odds)}
                  </Text>
                </View>
              )}
              {game.is_hot && (
                <View className="bg-orange-100 px-3 py-1.5 rounded-lg flex-row items-center">
                  <Ionicons name="flame" size={14} color="#f97316" />
                  <Text className="text-orange-700 text-sm font-bold ml-1">
                    Hot
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            className="active:opacity-50"
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(game.id);
            }}
          >
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={22}
              color={isFav ? "#ef4444" : "#9ca3af"}
            />
          </Pressable>
          <Ionicons name="chevron-forward" size={24} color="#10b981" />
        </View>
      </View>

      {game.top_prize_amount && (
        <View className="pt-3 mt-3 border-t border-green-100">
          <Text className="text-sm text-gray-700">
            Jackpot: {formatMoney(game.top_prize_amount)}
            {game.top_prize_remaining !== null &&
              ` • ${game.top_prize_remaining} left`}
            {game.overall_odds !== null && game.overall_odds !== undefined &&
              ` • Overall Odds: 1:${game.overall_odds.toFixed(2)}`}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function GameCard({ game }: { game: Game }) {
  const navigation = useNavigation<any>();
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFav = useAppStore((s) => s.favoriteGameIds.includes(game.id));

  // Get formatted metrics (same as TicketsScreen)
  const prizeStatus = getPrizeStatus(game.prize_quality_score);
  const scratchIQScore = formatScratchIQScore(game.ev);

  return (
    <Pressable
      className="bg-white border border-gray-200 rounded-xl p-4 active:bg-gray-50"
      onPress={() => navigation.navigate("GameDetail", { gameId: game.id })}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-1 mr-3">
          {/* Ticket Image */}
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

          {/* Game Info */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              {game.is_hot && (
                <Ionicons name="flame" size={18} color="#f59e0b" />
              )}
              <Text className="text-base font-semibold text-gray-900 flex-1">
                {game.name}
              </Text>
            </View>
            <View className="flex-row items-center flex-wrap gap-2 mt-2">
              <View className="bg-green-100 px-2 py-1 rounded">
                <Text className="text-green-700 text-xs font-semibold">
                  ${game.price}
                </Text>
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
              {game.break_even_odds && (
                <View className="bg-pink-100 px-2 py-1 rounded">
                  <Text className="text-pink-700 text-xs font-semibold">
                    {formatBreakEvenOdds(game.break_even_odds)}
                  </Text>
                </View>
              )}
              {game.is_hot && (
                <View className="bg-orange-100 px-2 py-1 rounded flex-row items-center">
                  <Ionicons name="flame" size={12} color="#f97316" />
                  <Text className="text-orange-700 text-xs font-semibold ml-1">
                    Hot
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            className="active:opacity-50"
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(game.id);
            }}
          >
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={22}
              color={isFav ? "#ef4444" : "#9ca3af"}
            />
          </Pressable>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
      </View>

      {game.top_prize_amount && (
        <View className="pt-3 mt-3 border-t border-gray-100">
          <Text className="text-sm text-gray-600">
            Jackpot: {formatMoney(game.top_prize_amount)}
            {game.top_prize_remaining !== null &&
              ` • ${game.top_prize_remaining} left`}
            {game.overall_odds !== null && game.overall_odds !== undefined &&
              ` • Overall Odds: 1:${game.overall_odds.toFixed(2)}`}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
