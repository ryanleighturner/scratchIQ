import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../state/appStore";
import { getAllGames } from "../api/supabase";
import type { Game } from "../types/database";
import { STATES } from "../types/database";
import { TicketListSkeleton } from "../components/SkeletonLoader";
import { LogoHeader } from "../components/LogoHeader";
import { trackEvent, MixpanelEvents } from "../services/mixpanelService";
import {
  formatScratchIQScore,
  formatOverallOdds,
  formatBreakEvenOdds,
  getPrizeStatus,
  formatMoney,
  getWinChance,
} from "../utils/formatters";

export default function TicketsScreen() {
  const navigation = useNavigation<any>();
  const selectedState = useAppStore((s) => s.selectedState);
  const setSelectedState = useAppStore((s) => s.setSelectedState);
  const allGames = useAppStore((s) => s.allGames);
  const setAllGames = useAppStore((s) => s.setAllGames);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPrice, setFilterPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"overall_odds" | "prize_quality_score" | "hot" | "break_even_odds">("overall_odds");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);

  useEffect(() => {
    if (allGames.length === 0) {
      loadGames();
    }
  }, []);

  // Auto-reload when state changes
  useEffect(() => {
    if (selectedState) {
      loadGames();
    }
  }, [selectedState]);

  const loadGames = async () => {
    if (!selectedState) return; // Don't load if no state selected

    try {
      setLoading(true);
      const games = await getAllGames(selectedState);

      // Debug: Log hot games
      const hotGames = games.filter(g => g.is_hot);
      console.log(`[TicketsScreen] Loaded ${games.length} games, ${hotGames.length} are hot`);
      if (hotGames.length > 0) {
        console.log('[TicketsScreen] Sample hot game:', hotGames[0].name, 'is_hot:', hotGames[0].is_hot);
      }

      setAllGames(games);
    } catch (error) {
      console.error("Failed to load games:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGames();
  };

  const filteredGames = allGames
    .filter((game) => {
      if (searchQuery && !game.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterPrice !== null && game.price !== filterPrice) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "overall_odds") {
        // Higher EV is better - sort descending (we're using ev field which maps to ScratchIQ Score)
        // Note: overall_odds field name is legacy, we actually sort by ev for ScratchIQ Score
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

  const priceOptions = [1, 2, 3, 5, 10, 20, 30, 50];

  if (loading && allGames.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <LogoHeader />
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-900">All Tickets</Text>
          <Text className="text-sm text-gray-500 mt-1">Loading games...</Text>
        </View>
        <View className="px-6 mt-4">
          <TicketListSkeleton count={5} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <LogoHeader />
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {filteredGames.length} game{filteredGames.length !== 1 ? "s" : ""} available
              </Text>
            </View>

            {/* State Picker Button */}
            <Pressable
              className="ml-4 bg-indigo-100 px-4 py-2 rounded-xl flex-row items-center active:bg-indigo-200"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowStatePicker(true);
              }}
            >
              <Ionicons name="location" size={18} color="#6366f1" />
              <Text className="text-indigo-700 font-bold text-base ml-1">
                {selectedState}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6366f1" className="ml-1" />
            </Pressable>
          </View>
        </View>

        {filteredGames.length === 0 ? (
          /* Empty State */
          <View className="flex-1 items-center justify-center px-8">
            <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="ticket-outline" size={48} color="#9ca3af" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
              {filterPrice !== null ? "No Tickets Found" : "Coming Soon"}
            </Text>
            <Text className="text-base text-gray-600 text-center mb-6">
              {filterPrice !== null
                ? `No ${selectedState} tickets available at $${filterPrice}`
                : "The full ticket catalog will be available in a future update"}
            </Text>
            {filterPrice !== null && (
              <Pressable
                className="bg-indigo-600 px-6 py-3 rounded-xl active:bg-indigo-700"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setFilterPrice(null);
                }}
              >
                <Text className="text-white font-bold text-base">
                  Clear Filter
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          /* Games List */
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Search Bar */}
            <View className="px-6 mt-4">
              <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Search tickets..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSearchQuery("");
                    Keyboard.dismiss();
                  }}>
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Sort By Dropdown */}
            <View className="px-6 mt-4">
              <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                Sort By
              </Text>
              <View>
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
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowSortDropdown(!showSortDropdown);
                  }}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name={
                        sortBy === "prize_quality_score"
                          ? "trophy"
                          : sortBy === "overall_odds"
                          ? "calculator"
                          : sortBy === "hot"
                          ? "flame"
                          : "speedometer"
                      }
                      size={20}
                      color={
                        sortBy === "prize_quality_score"
                          ? "#6366f1"
                          : sortBy === "overall_odds"
                          ? "#9333ea"
                          : sortBy === "hot"
                          ? "#ea580c"
                          : "#ec4899"
                      }
                    />
                    <Text className={`ml-2 text-base font-semibold ${
                      sortBy === "prize_quality_score"
                        ? "text-indigo-700"
                        : sortBy === "overall_odds"
                        ? "text-purple-700"
                        : sortBy === "hot"
                        ? "text-orange-700"
                        : "text-pink-700"
                    }`}>
                      {sortBy === "prize_quality_score"
                        ? "Prize Status"
                        : sortBy === "overall_odds"
                        ? "ScratchIQ Score"
                        : sortBy === "hot"
                        ? "Hot Tickets (Top 5%)"
                        : "Money-Back Odds"}
                    </Text>
                  </View>
                  <Ionicons
                    name={showSortDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#9ca3af"
                  />
                </Pressable>

                {/* Dropdown Options */}
                {showSortDropdown && (
                  <View className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <Pressable
                      className={`flex-row items-center px-4 py-3 active:bg-gray-50 ${
                        sortBy === "prize_quality_score" ? "bg-indigo-50" : ""
                      }`}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setSortBy("prize_quality_score");
                        setShowSortDropdown(false);
                        trackEvent(MixpanelEvents.TICKETS_SORTED, {
                          sortBy: "prize_quality_score",
                          state: selectedState,
                        });
                      }}
                    >
                      <Ionicons
                        name="trophy"
                        size={20}
                        color={sortBy === "prize_quality_score" ? "#6366f1" : "#9ca3af"}
                      />
                      <View className="flex-1 ml-3">
                        <Text
                          className={`text-base font-semibold ${
                            sortBy === "prize_quality_score"
                              ? "text-indigo-600"
                              : "text-gray-900"
                          }`}
                        >
                          Prize Status
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                          Emoji-coded game freshness (0-100)
                        </Text>
                      </View>
                      {sortBy === "prize_quality_score" && (
                        <Ionicons name="checkmark-circle" size={22} color="#6366f1" />
                      )}
                    </Pressable>

                    <View className="h-px bg-gray-200" />

                    <Pressable
                      className={`flex-row items-center px-4 py-3 active:bg-gray-50 ${
                        sortBy === "overall_odds" ? "bg-purple-50" : ""
                      }`}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setSortBy("overall_odds");
                        setShowSortDropdown(false);
                        trackEvent(MixpanelEvents.TICKETS_SORTED, {
                          sortBy: "overall_odds",
                          state: selectedState,
                        });
                      }}
                    >
                      <Ionicons
                        name="calculator"
                        size={20}
                        color={sortBy === "overall_odds" ? "#9333ea" : "#9ca3af"}
                      />
                      <View className="flex-1 ml-3">
                        <Text
                          className={`text-base font-semibold ${
                            sortBy === "overall_odds" ? "text-purple-600" : "text-gray-900"
                          }`}
                        >
                          ScratchIQ Score
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                          0-100 scale based on remaining prizes
                        </Text>
                      </View>
                      {sortBy === "overall_odds" && (
                        <Ionicons name="checkmark-circle" size={22} color="#9333ea" />
                      )}
                    </Pressable>

                    <View className="h-px bg-gray-200" />

                    <Pressable
                      className={`flex-row items-center px-4 py-3 active:bg-gray-50 ${
                        sortBy === "hot" ? "bg-orange-50" : ""
                      }`}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setSortBy("hot");
                        setShowSortDropdown(false);
                        trackEvent(MixpanelEvents.TICKETS_SORTED, {
                          sortBy: "hot",
                          state: selectedState,
                        });
                      }}
                    >
                      <Ionicons
                        name="flame"
                        size={20}
                        color={sortBy === "hot" ? "#ea580c" : "#9ca3af"}
                      />
                      <View className="flex-1 ml-3">
                        <Text
                          className={`text-base font-semibold ${
                            sortBy === "hot" ? "text-orange-600" : "text-gray-900"
                          }`}
                        >
                          Hot Tickets (Top 5%)
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                          Top 5% RTO nationally
                        </Text>
                      </View>
                      {sortBy === "hot" && (
                        <Ionicons name="checkmark-circle" size={22} color="#ea580c" />
                      )}
                    </Pressable>

                    <View className="h-px bg-gray-200" />

                    <Pressable
                      className={`flex-row items-center px-4 py-3 active:bg-gray-50 ${
                        sortBy === "break_even_odds" ? "bg-pink-50" : ""
                      }`}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setSortBy("break_even_odds");
                        setShowSortDropdown(false);
                      }}
                    >
                      <Ionicons
                        name="speedometer"
                        size={20}
                        color={sortBy === "break_even_odds" ? "#ec4899" : "#9ca3af"}
                      />
                      <View className="flex-1 ml-3">
                        <Text
                          className={`text-base font-semibold ${
                            sortBy === "break_even_odds"
                              ? "text-pink-600"
                              : "text-gray-900"
                          }`}
                        >
                          Money-Back Odds
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                          Chance of winning back ticket price
                        </Text>
                      </View>
                      {sortBy === "break_even_odds" && (
                        <Ionicons name="checkmark-circle" size={22} color="#ec4899" />
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* Price Filters */}
            <View className="mt-4">
              <View className="px-6 mb-2 flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-gray-500 uppercase">
                  Filter by Price
                </Text>
                {filterPrice !== null && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setFilterPrice(null);
                    }}
                  >
                    <Text className="text-xs font-semibold text-indigo-600">
                      Clear Filter
                    </Text>
                  </Pressable>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="px-6"
              >
                <View className="flex-row gap-2">
                  {priceOptions.map((price) => (
                    <Pressable
                      key={price}
                      className={`px-4 py-2 rounded-xl ${
                        filterPrice === price
                          ? "bg-green-600"
                          : "bg-gray-100"
                      } active:opacity-70`}
                      onPress={() =>
                        {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setFilterPrice(filterPrice === price ? null : price);
                        }
                      }
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          filterPrice === price ? "text-white" : "text-gray-700"
                        }`}
                      >
                        ${price}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Games List */}
            <View className="px-6 pb-6 pt-4 gap-3">
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* State Picker Modal */}
      <Modal
        visible={showStatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatePicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowStatePicker(false)}
        >
          <Pressable
            className="bg-white rounded-2xl mx-6 w-80 max-w-full"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900">
                  Select Your State
                </Text>
                <Pressable onPress={() => setShowStatePicker(false)}>
                  <Ionicons name="close-circle" size={24} color="#9ca3af" />
                </Pressable>
              </View>

              <Text className="text-sm text-gray-500 mb-4">
                Choose your state to see lottery games available in your area
              </Text>

              <ScrollView
                className="max-h-96"
                showsVerticalScrollIndicator={true}
              >
                <View className="gap-2">
                  {STATES.map((state) => (
                    <Pressable
                      key={state.value}
                      className={`flex-row items-center justify-between p-4 rounded-xl border ${
                        selectedState === state.value
                          ? "bg-indigo-50 border-indigo-500"
                          : "bg-white border-gray-200"
                      } active:opacity-70`}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setSelectedState(state.value);
                        setShowStatePicker(false);
                      }}
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name="location"
                          size={20}
                          color={selectedState === state.value ? "#6366f1" : "#9ca3af"}
                        />
                        <Text
                          className={`ml-3 text-base font-semibold ${
                            selectedState === state.value
                              ? "text-indigo-700"
                              : "text-gray-900"
                          }`}
                        >
                          {state.label}
                        </Text>
                      </View>
                      {selectedState === state.value && (
                        <Ionicons name="checkmark-circle" size={22} color="#6366f1" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function GameCard({ game }: { game: Game }) {
  const navigation = useNavigation<any>();
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFav = useAppStore((s) => s.favoriteGameIds.includes(game.id));

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
              <Text className="text-base font-bold text-gray-900 flex-1">
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
