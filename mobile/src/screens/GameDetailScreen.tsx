import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getGameById, getPrizesForGame } from "../api/supabase";
import { LogoHeader } from "../components/LogoHeader";
import type { Game, Prize } from "../types/database";
import { trackEvent, MixpanelEvents } from "../services/mixpanelService";
import {
  formatScratchIQScore,
  formatBreakEvenOdds,
  formatMoney,
  getPrizeStatus,
  getWinChance,
} from "../utils/formatters";

export default function GameDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const gameId = route.params?.gameId;

  const [game, setGame] = useState<Game | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameData();
    trackEvent(MixpanelEvents.TICKET_VIEWED, {
      gameId: gameId,
    });
  }, [gameId]);

  const loadGameData = async () => {
    try {
      const [gameData, prizesData] = await Promise.all([
        getGameById(gameId),
        getPrizesForGame(gameId),
      ]);
      setGame(gameData);

      // Sort prizes from highest to lowest amount
      const sortedPrizes = [...prizesData].sort((a, b) => {
        // Remove $ and commas, convert to number
        const amountA = parseFloat(a.prize_amt.replace(/[$,]/g, ""));
        const amountB = parseFloat(b.prize_amt.replace(/[$,]/g, ""));
        return amountB - amountA; // Descending order
      });

      setPrizes(sortedPrizes);
    } catch (error) {
      console.log("[GameDetail] Failed to load game (offline mode)");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
        <Ionicons name="alert-circle-outline" size={60} color="#d1d5db" />
        <Text className="text-lg text-gray-500 mt-4 text-center">
          Game not found
        </Text>
      </SafeAreaView>
    );
  }

  // Calculate display values
  const scratchIQScore = formatScratchIQScore(game.ev);
  const prizeStatus = getPrizeStatus(game.prize_quality_score);
  const winChance = getWinChance(game.overall_odds);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <LogoHeader />
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-2 flex-row items-start justify-between">
          <Pressable
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center active:bg-gray-200"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          {game.url && (
            <Pressable
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center active:bg-gray-200"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Linking.openURL(game.url!);
              }}
            >
              <Ionicons name="open-outline" size={20} color="#111827" />
            </Pressable>
          )}
        </View>

        {/* Game Info */}
        <View className="px-6 mt-4">
          <View className="flex-row items-center gap-2 mb-3">
            {game.is_hot && <Ionicons name="flame" size={24} color="#f59e0b" />}
            <Text className="text-2xl font-bold text-gray-900 flex-1">
              {game.name}
            </Text>
          </View>

          {/* Stats Grid */}
          <View className="flex-row flex-wrap gap-2 mt-4">
            <View className="bg-green-100 px-3 py-2 rounded-xl">
              <Text className="text-green-700 text-lg font-bold">
                ${game.price}
              </Text>
              <Text className="text-green-600 text-xs mt-0.5">Price</Text>
            </View>

            {game.ev !== null && game.ev !== undefined && (
              <View className="bg-purple-100 px-3 py-2 rounded-xl">
                <Text className="text-purple-700 text-lg font-bold">
                  {scratchIQScore}/100
                </Text>
                <Text className="text-purple-600 text-xs mt-0.5">ScratchIQ Score</Text>
              </View>
            )}

            {game.prize_quality_score !== null && (
              <View className="bg-indigo-100 px-3 py-2 rounded-xl flex-row items-center">
                <Text className="text-indigo-700 text-lg font-bold mr-1">
                  {prizeStatus.emoji}
                </Text>
                <Text className="text-indigo-700 text-lg font-bold">
                  {game.prize_quality_score.toFixed(0)}
                </Text>
                <Text className="text-indigo-600 text-xs mt-0.5 ml-2">Prize Status</Text>
              </View>
            )}

            {game.overall_odds && (
              <View className="bg-blue-100 px-3 py-2 rounded-xl">
                <Text className="text-blue-700 text-lg font-bold">
                  {winChance}%
                </Text>
                <Text className="text-blue-600 text-xs mt-0.5">
                  Win Chance
                </Text>
              </View>
            )}

            {game.break_even_odds && (
              <View className="bg-pink-100 px-3 py-2 rounded-xl">
                <Text className="text-pink-700 text-lg font-bold">
                  {formatBreakEvenOdds(game.break_even_odds)}
                </Text>
                <Text className="text-pink-600 text-xs mt-0.5">Money-Back Odds</Text>
              </View>
            )}

            {game.is_hot && (
              <View className="bg-orange-100 px-3 py-2 rounded-xl flex-row items-center">
                <Ionicons name="flame" size={16} color="#f97316" />
                <Text className="text-orange-700 text-lg font-bold ml-1">
                  Hot
                </Text>
              </View>
            )}

            <View className="bg-gray-100 px-3 py-2 rounded-xl">
              <Text className="text-gray-700 text-lg font-bold">
                {game.state}
              </Text>
              <Text className="text-gray-600 text-xs mt-0.5">State</Text>
            </View>
          </View>

          {/* ScratchIQ Score Explanation */}
          {game.ev !== null && game.ev !== undefined && (
            <View className="mt-6 bg-gray-50 rounded-2xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={20} color="#6b7280" />
                <Text className="text-sm font-semibold text-gray-700 ml-2">
                  What is the ScratchIQ Score?
                </Text>
              </View>
              <Text className="text-sm text-gray-600 leading-5">
                ScratchIQ Score of {scratchIQScore}/100 is calculated based on current remaining prizes.
                A score of 70+ indicates excellent value. The score updates as prizes are claimed,
                giving you accurate {'"'}buy this NOW{'"'} recommendations.
              </Text>
            </View>
          )}
        </View>

        {/* Jackpot Info */}
        {game.top_prize_amount && (
          <View className="px-6 mt-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Jackpot
            </Text>
            <View className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5">
              <Text className="text-3xl font-bold text-indigo-900">
                {formatMoney(game.top_prize_amount)}
              </Text>
              {game.top_prize_remaining !== null && (
                <Text className="text-base text-indigo-700 mt-2">
                  {game.top_prize_remaining} prizes remaining
                </Text>
              )}
            </View>
          </View>
        )}

        {/* New Advanced Metrics Section */}
        {(game.real_time_overall_odds !== null ||
          game.top_prize_depletion !== null) && (
          <View className="px-6 mt-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Advanced Analytics
            </Text>

            {/* Real-Time Overall Odds */}
            {game.real_time_overall_odds !== null && (
              <View className="bg-green-50 rounded-2xl p-4 mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="stats-chart" size={20} color="#10b981" />
                    <Text className="text-base font-semibold text-green-900 ml-2">
                      Real-Time Win Odds
                    </Text>
                  </View>
                  <Text className="text-2xl font-bold text-green-900">
                    1:{game.real_time_overall_odds.toFixed(2)}
                  </Text>
                </View>
                <Text className="text-sm text-green-700">
                  Your current odds of winning ANY prize right now
                </Text>
                <Text className="text-xs text-green-600 mt-1">
                  Based on remaining tickets vs. remaining prizes
                </Text>
              </View>
            )}

            {/* Top Prize Depletion */}
            {game.top_prize_depletion !== null && (
              <View className="bg-amber-50 rounded-2xl p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="ribbon" size={20} color="#f59e0b" />
                    <Text className="text-base font-semibold text-amber-900 ml-2">
                      Top Prize Availability
                    </Text>
                  </View>
                  <Text className="text-2xl font-bold text-amber-900">
                    {(game.top_prize_depletion * 100).toFixed(0)}%
                  </Text>
                </View>
                <View className="h-3 bg-amber-200 rounded-full overflow-hidden mb-2">
                  <View
                    className={`h-full ${
                      game.top_prize_depletion >= 0.75
                        ? "bg-green-500"
                        : game.top_prize_depletion >= 0.25
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${game.top_prize_depletion * 100}%`,
                    }}
                  />
                </View>
                <Text className="text-sm text-amber-700">
                  {game.top_prize_depletion === 1.0
                    ? "100% of top prizes still available!"
                    : game.top_prize_depletion >= 0.5
                    ? "Good chance at top prizes"
                    : game.top_prize_depletion >= 0.25
                    ? "Limited top prizes remaining"
                    : "⚠️ Very few top prizes left"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Prize Breakdown */}
        {prizes.length > 0 && (
          <View className="px-6 mt-6 mb-8">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Prize Breakdown
            </Text>
            <View className="bg-gray-50 rounded-2xl overflow-hidden">
              {prizes.map((prize, index) => (
                <View
                  key={prize.id}
                  className={`flex-row items-center justify-between p-4 ${
                    index !== 0 ? "border-t border-gray-200" : ""
                  }`}
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {prize.prize_amt}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-0.5">
                      {prize.total} total prizes
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-bold text-gray-900">
                      {prize.remaining}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-0.5">
                      remaining
                    </Text>
                  </View>
                  <View className="ml-4 w-16">
                    <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <View
                        className={`h-full ${
                          prize.remaining / prize.total > 0.5
                            ? "bg-green-500"
                            : prize.remaining / prize.total > 0.25
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${(prize.remaining / prize.total) * 100}%`,
                        }}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
