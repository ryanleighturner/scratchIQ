import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { State, Game } from "../types/database";

interface AppState {
  // User settings
  userId: string;
  selectedState: State | null;
  notificationsEnabled: boolean;
  pushToken: string | null;
  isPro: boolean;
  hasCompletedOnboarding: boolean;

  // Subscription & Scans
  scansRemaining: number;
  totalScansUsed: number;
  subscriptionStatus: "free" | "subscribed" | "expired";
  subscriptionEndDate: string | null;
  referralCode: string | null;
  referredBy: string | null;
  totalReferrals: number;
  redeemedCodes: string[];

  // App data
  hotGames: Game[];
  allGames: Game[];
  recentScans: string[][];
  favoriteGameIds: string[];

  // Loading states
  isLoadingGames: boolean;

  // Actions
  setUserId: (userId: string) => void;
  setSelectedState: (state: State) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setPushToken: (token: string | null) => void;
  setIsPro: (isPro: boolean) => void;
  setHotGames: (games: Game[]) => void;
  setAllGames: (games: Game[]) => void;
  addRecentScan: (gameIds: string[]) => void;
  setIsLoadingGames: (loading: boolean) => void;
  toggleFavorite: (gameId: string) => void;
  isFavorite: (gameId: string) => boolean;
  completeOnboarding: () => void;

  // Subscription & Referral actions
  decrementScan: () => void;
  refundScan: () => void;
  addBonusScans: (count: number) => void;
  addReferral: () => void;
  setSubscriptionStatus: (status: "free" | "subscribed" | "expired", endDate?: string) => void;
  setReferralCode: (code: string) => void;
  setReferredBy: (code: string) => void;
  canScan: () => boolean;
  redeemCode: (code: string) => { success: boolean; message: string };
  resetApp: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      userId: "",
      selectedState: null,
      notificationsEnabled: true,
      pushToken: null,
      isPro: false,
      hasCompletedOnboarding: false,

      // Subscription & Scans initial state
      scansRemaining: 25,
      totalScansUsed: 0,
      subscriptionStatus: "free",
      subscriptionEndDate: null,
      referralCode: null,
      referredBy: null,
      totalReferrals: 0,
      redeemedCodes: [],

      hotGames: [],
      allGames: [],
      recentScans: [],
      favoriteGameIds: [],
      isLoadingGames: false,

      // Actions
      setUserId: (userId) => set({ userId }),
      setSelectedState: (state) => set({ selectedState: state }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setPushToken: (token) => set({ pushToken: token }),
      setIsPro: (isPro) => set({ isPro }),
      setHotGames: (games) => set({ hotGames: games }),
      setAllGames: (games) => set({ allGames: games }),
      addRecentScan: (gameIds) =>
        set((state) => ({
          recentScans: [gameIds, ...state.recentScans].slice(0, 10),
        })),
      setIsLoadingGames: (loading) => set({ isLoadingGames: loading }),
      toggleFavorite: (gameId) =>
        set((state) => {
          const isFav = state.favoriteGameIds.includes(gameId);
          return {
            favoriteGameIds: isFav
              ? state.favoriteGameIds.filter((id) => id !== gameId)
              : [...state.favoriteGameIds, gameId],
          };
        }),
      isFavorite: (gameId) => get().favoriteGameIds.includes(gameId),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      // Subscription & Referral actions
      decrementScan: () =>
        set((state) => ({
          scansRemaining: Math.max(0, state.scansRemaining - 1),
          totalScansUsed: state.totalScansUsed + 1,
        })),
      refundScan: () =>
        set((state) => ({
          scansRemaining: state.scansRemaining + 1,
          totalScansUsed: Math.max(0, state.totalScansUsed - 1),
        })),
      addBonusScans: (count) =>
        set((state) => ({
          scansRemaining: state.scansRemaining + count,
        })),
      addReferral: () =>
        set((state) => ({
          totalReferrals: state.totalReferrals + 1,
          scansRemaining: state.scansRemaining + 10,
        })),
      setSubscriptionStatus: (status, endDate) =>
        set({
          subscriptionStatus: status,
          subscriptionEndDate: endDate || null,
          scansRemaining: status === "subscribed" ? 999999 : get().scansRemaining,
        }),
      setReferralCode: (code) => set({ referralCode: code }),
      setReferredBy: (code) => set({ referredBy: code }),
      canScan: () => {
        const state = get();
        return state.subscriptionStatus === "subscribed" || state.scansRemaining > 0;
      },
      redeemCode: (code: string) => {
        const state = get();
        const normalizedCode = code.toLowerCase().trim();

        // Check if code already redeemed
        if (state.redeemedCodes.includes(normalizedCode)) {
          return { success: false, message: "Code already redeemed" };
        }

        // Check valid codes
        if (normalizedCode === "winning!") {
          set((s) => ({
            scansRemaining: s.scansRemaining + 50,
            redeemedCodes: [...s.redeemedCodes, normalizedCode],
          }));
          return { success: true, message: "50 scans added!" };
        }

        return { success: false, message: "Invalid code" };
      },
      resetApp: () => {
        set({
          userId: "",
          selectedState: null,
          notificationsEnabled: true,
          pushToken: null,
          isPro: false,
          hasCompletedOnboarding: false,
          scansRemaining: 25,
          totalScansUsed: 0,
          subscriptionStatus: "free",
          subscriptionEndDate: null,
          referralCode: null,
          referredBy: null,
          totalReferrals: 0,
          redeemedCodes: [],
          hotGames: [],
          allGames: [],
          recentScans: [],
          favoriteGameIds: [],
          isLoadingGames: false,
        });
      },
    }),
    {
      name: "scratchiq-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userId: state.userId,
        selectedState: state.selectedState,
        notificationsEnabled: state.notificationsEnabled,
        pushToken: state.pushToken,
        isPro: state.isPro,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        scansRemaining: state.scansRemaining,
        totalScansUsed: state.totalScansUsed,
        subscriptionStatus: state.subscriptionStatus,
        subscriptionEndDate: state.subscriptionEndDate,
        referralCode: state.referralCode,
        referredBy: state.referredBy,
        totalReferrals: state.totalReferrals,
        redeemedCodes: state.redeemedCodes,
        recentScans: state.recentScans,
        favoriteGameIds: state.favoriteGameIds,
      }),
    }
  )
);
