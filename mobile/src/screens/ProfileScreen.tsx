import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../state/appStore";
import { STATES } from "../types/database";
import { getUserPreferences, updateUserPreferences } from "../api/supabase";
import { LogoHeader } from "../components/LogoHeader";
import ReferralModal from "../components/ReferralModal";
import { ErrorModal } from "../components/ErrorModal";
import * as Device from "expo-device";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const userId = useAppStore((s) => s.userId);
  const setUserId = useAppStore((s) => s.setUserId);
  const selectedState = useAppStore((s) => s.selectedState);
  const setSelectedState = useAppStore((s) => s.setSelectedState);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const isPro = useAppStore((s) => s.isPro);
  const scansRemaining = useAppStore((s) => s.scansRemaining);
  const totalReferrals = useAppStore((s) => s.totalReferrals);
  const subscriptionStatus = useAppStore((s) => s.subscriptionStatus);
  const referralCode = useAppStore((s) => s.referralCode);
  const setReferralCode = useAppStore((s) => s.setReferralCode);
  const redeemCode = useAppStore((s) => s.redeemCode);
  const resetApp = useAppStore((s) => s.resetApp);

  const [deviceInfo, setDeviceInfo] = useState<string>("");
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [modalState, setModalState] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: "",
    message: "",
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    initializeUser();
    loadDeviceInfo();
  }, []);

  const initializeUser = async () => {
    try {
      // Generate a simple user ID if one doesn't exist
      let uid = userId;
      if (!uid) {
        uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setUserId(uid);
      }

      // Generate referral code if it doesn't exist
      if (!referralCode) {
        const refCode = `SCRATCH${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        setReferralCode(refCode);
      }

      // Load user preferences from Supabase
      const prefs = await getUserPreferences(uid);
      setSelectedState(prefs.selected_state as any);
      setNotificationsEnabled(prefs.notifications_enabled);
    } catch (error) {
      console.error("Failed to initialize user:", error);
    }
  };

  const loadDeviceInfo = async () => {
    const info = `${Device.modelName || "Unknown Device"} • ${Device.osName} ${Device.osVersion}`;
    setDeviceInfo(info);
  };

  const handleStateChange = async (stateValue: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setSelectedState(stateValue as any);
      setShowStatePicker(false);
      if (userId) {
        await updateUserPreferences(userId, { selected_state: stateValue });
      }
    } catch (error) {
      console.error("Failed to update state:", error);
    }
  };

  const getSelectedStateLabel = () => {
    const state = STATES.find((s) => s.value === selectedState);
    return state ? state.label : "Select State";
  };

  const handleNotificationToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      if (userId) {
        await updateUserPreferences(userId, {
          notifications_enabled: newValue,
        });
      }
    } catch (error) {
      console.error("Failed to update notifications:", error);
    }
  };

  const handleRedeemCode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!codeInput.trim()) {
      setModalState({
        visible: true,
        title: "Error",
        message: "Please enter a referral code",
      });
      return;
    }

    const result = redeemCode(codeInput);
    if (result.success) {
      setModalState({
        visible: true,
        title: "Success!",
        message: result.message,
      });
      setCodeInput("");
    } else {
      setModalState({
        visible: true,
        title: "Error",
        message: result.message,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <LogoHeader />
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Manage your preferences and settings
          </Text>
        </View>

        {/* Account Section */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Account
          </Text>
          <View className="bg-gray-50 rounded-2xl p-4">
            <View className="flex-row items-center">
              <View className="w-16 h-16 bg-indigo-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="person" size={32} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">
                  {isPro ? "Pro User" : "Free User"}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {userId ? `ID: ${userId.slice(0, 20)}...` : "Not signed in"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Scans & Referrals */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Scans & Referrals
          </Text>
          <View className="bg-gray-50 rounded-2xl">
            {/* Scans Counter */}
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Ionicons
                    name="scan"
                    size={22}
                    color="#6b7280"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base text-gray-900 font-medium">
                      Scans Remaining
                    </Text>
                    <Text className="text-sm text-gray-500 mt-0.5">
                      {totalReferrals} friends referred
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl font-bold text-indigo-600">
                  {scansRemaining}
                </Text>
              </View>
            </View>

            {/* Earn More Button */}
            <Pressable
              className="p-4 flex-row items-center justify-between active:bg-gray-100"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowReferralModal(true);
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name="gift"
                  size={22}
                  color="#6b7280"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base text-gray-900 font-medium">
                    Earn More Scans
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    Share with friends or post on social media
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
          </View>
        </View>

        {/* Redeem Code Section */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Redeem Code
          </Text>
          <View className="bg-gray-50 rounded-2xl p-4">
            <Text className="text-sm text-gray-600 mb-4">
              Post a winning ticket and tag us to get a code for 50 free scans!
            </Text>

            {/* TikTok Button */}
            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await Linking.openURL("https://www.tiktok.com/@scratchiq");
              }}
              className="flex-row items-center mb-4 bg-white rounded-xl p-4 active:bg-gray-100"
            >
              <View className="w-12 h-12 bg-black rounded-full items-center justify-center mr-3">
                <Ionicons name="logo-tiktok" size={28} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base text-gray-900 font-bold">
                  TikTok
                </Text>
                <Text className="text-sm text-gray-600">
                  @ScratchIQ
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>

            {/* Instagram Button */}
            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await Linking.openURL("https://www.instagram.com/scratchIQapp");
              }}
              className="flex-row items-center mb-4 bg-white rounded-xl p-4 active:bg-gray-100"
            >
              <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: "#E4405F" }}>
                <Ionicons name="logo-instagram" size={28} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base text-gray-900 font-bold">
                  Instagram
                </Text>
                <Text className="text-sm text-gray-600">
                  @scratchIQapp
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>

            <View className="flex-row items-center space-x-2">
              <TextInput
                className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
                placeholder="Enter referral code"
                placeholderTextColor="#9ca3af"
                value={codeInput}
                onChangeText={setCodeInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={handleRedeemCode}
                className="bg-indigo-600 rounded-lg px-6 py-3 active:bg-indigo-700"
              >
                <Text className="text-white font-semibold text-base">
                  Redeem
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* State Selection */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Location
          </Text>
          <View className="bg-gray-50 rounded-2xl overflow-hidden">
            <Pressable
              className="flex-row items-center justify-between p-4 active:bg-gray-100"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowStatePicker(!showStatePicker);
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="location-outline" size={22} color="#6b7280" />
                <Text className="ml-3 text-base text-gray-900 font-medium">
                  {getSelectedStateLabel()}
                </Text>
              </View>
              <Ionicons
                name={showStatePicker ? "chevron-up" : "chevron-down"}
                size={20}
                color="#9ca3af"
              />
            </Pressable>

            {/* State Picker ScrollView */}
            {showStatePicker && (
              <View className="border-t border-gray-200">
                <ScrollView
                  className="max-h-64"
                  showsVerticalScrollIndicator={true}
                >
                  {STATES.map((state, index) => (
                    <Pressable
                      key={state.value}
                      className={`flex-row items-center justify-between p-4 active:bg-gray-100 ${
                        index !== 0 ? "border-t border-gray-200" : ""
                      }`}
                      onPress={() => handleStateChange(state.value)}
                    >
                      <Text className="text-base text-gray-900">
                        {state.label}
                      </Text>
                      {selectedState === state.value && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#10b981"
                        />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Preferences */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Preferences
          </Text>
          <View className="bg-gray-50 rounded-2xl">
            <Pressable
              className="flex-row items-center justify-between p-4 active:bg-gray-100"
              onPress={handleNotificationToggle}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#6b7280"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base text-gray-900 font-medium">
                    Notifications
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    New hot tickets & favorite EV alerts
                  </Text>
                </View>
              </View>
              <View
                className={`w-12 h-7 rounded-full items-center ${
                  notificationsEnabled
                    ? "bg-green-500 justify-end"
                    : "bg-gray-300 justify-start"
                } flex-row px-1`}
              >
                <View className="w-5 h-5 bg-white rounded-full" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* App Info */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            About
          </Text>
          <View className="bg-gray-50 rounded-2xl">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-sm text-gray-500 mb-1">Version</Text>
              <Text className="text-base text-gray-900">1.0.0</Text>
            </View>
            <View className="p-4 border-b border-gray-200">
              <Text className="text-sm text-gray-500 mb-1">Device</Text>
              <Text className="text-base text-gray-900">{deviceInfo}</Text>
            </View>
            <Pressable
              className="p-4 flex-row items-center justify-between active:bg-gray-100"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setModalState({
                  visible: true,
                  title: "About ScratchIQ",
                  message: "ScratchIQ helps you make informed decisions about lottery scratch-off tickets using real-time prize data and expected value calculations.",
                });
              }}
            >
              <Text className="text-base text-gray-900">About ScratchIQ</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
          </View>
        </View>

        {/* Legal Section */}
        <View className="px-6 mb-8">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Legal
          </Text>
          <View className="bg-gray-50 rounded-2xl">
            <Pressable
              className="p-4 flex-row items-center justify-between border-b border-gray-200 active:bg-gray-100"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("Disclaimer" as never);
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="shield-outline" size={22} color="#6b7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-base text-gray-900 font-medium">
                    Terms & Disclaimer
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    Important legal information
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
            <Pressable
              className="p-4 flex-row items-center justify-between border-b border-gray-200 active:bg-gray-100"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("PrivacyPolicy" as never);
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="lock-closed-outline" size={22} color="#6b7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-base text-gray-900 font-medium">
                    Privacy Policy
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    How we handle your data
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
            <Pressable
              className="p-4 flex-row items-center justify-between active:bg-gray-100"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("TermsOfService" as never);
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="document-text-outline" size={22} color="#6b7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-base text-gray-900 font-medium">
                    Terms of Service
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    Usage terms and conditions
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
          </View>
        </View>

        {/* Reset App (Dev) */}
        <View className="px-6 mb-8">
          <Pressable
            className="bg-red-50 rounded-2xl p-4 flex-row items-center justify-center active:bg-red-100"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setShowResetConfirm(true);
            }}
          >
            <Ionicons name="refresh-outline" size={20} color="#ef4444" />
            <Text className="text-red-600 font-semibold ml-2">Reset App</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Referral Modal */}
      <ReferralModal
        visible={showReferralModal}
        onClose={() => setShowReferralModal(false)}
      />

      {/* Info/Error Modal */}
      <ErrorModal
        visible={modalState.visible}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState({ visible: false, title: "", message: "" })}
      />

      {/* Reset Confirmation Modal */}
      <ErrorModal
        visible={showResetConfirm}
        title="Reset App?"
        message="This will clear all your data and restart the app as if you just downloaded it. Your scans, favorites, and settings will be lost."
        onClose={() => setShowResetConfirm(false)}
        actionText="Reset"
        onAction={() => {
          setShowResetConfirm(false);
          resetApp();
        }}
      />
    </SafeAreaView>
  );
}
