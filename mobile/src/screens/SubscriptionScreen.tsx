import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../state/appStore";

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const scansRemaining = useAppStore((s) => s.scansRemaining);
  const subscriptionStatus = useAppStore((s) => s.subscriptionStatus);
  const setSubscriptionStatus = useAppStore((s) => s.setSubscriptionStatus);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    setIsProcessing(true);

    // TODO: Integrate with Apple In-App Purchase
    // For now, simulate subscription
    setTimeout(() => {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      setSubscriptionStatus("subscribed", endDate.toISOString());
      setIsProcessing(false);
      navigation.goBack();
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Pressable
            className="w-10 h-10 items-center justify-center active:opacity-50"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color="#000" />
          </Pressable>
        </View>

        {/* Hero Section */}
        <View className="px-6 pb-6">
          <View className="w-20 h-20 bg-indigo-100 rounded-full items-center justify-center self-center mb-4">
            <Ionicons name="infinite" size={40} color="#6366f1" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 text-center mb-3">
            Unlimited Scans
          </Text>
          <Text className="text-base text-gray-600 text-center">
            Get unlimited ticket scans and never miss a hot ticket opportunity
          </Text>
        </View>

        {/* Current Status */}
        <View className="mx-6 mb-6 bg-gray-50 rounded-2xl p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-500 mb-1">Scans Remaining</Text>
              <Text className="text-2xl font-bold text-gray-900">
                {subscriptionStatus === "subscribed" ? "∞" : scansRemaining}
              </Text>
            </View>
            {subscriptionStatus !== "subscribed" && (
              <View className="bg-orange-100 px-3 py-1.5 rounded-lg">
                <Text className="text-orange-700 text-sm font-semibold">
                  Free Plan
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Features */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            What You Get
          </Text>

          <FeatureItem
            icon="infinite"
            title="Unlimited Scans"
            description="Scan as many lottery displays as you want, no limits"
          />
          <FeatureItem
            icon="notifications"
            title="Priority Notifications"
            description="Get instant alerts when hot tickets become available"
          />
          <FeatureItem
            icon="analytics"
            title="Advanced Analytics"
            description="Track your scanning history and winning patterns"
          />
          <FeatureItem
            icon="star"
            title="Premium Support"
            description="Get priority customer support and feature requests"
          />
        </View>

        {/* How to Get Free Scans */}
        <View className="mx-6 mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            🎁 Get Free Scans
          </Text>

          <View className="mb-3">
            <View className="flex-row items-start">
              <View className="w-8 h-8 bg-indigo-600 rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold text-sm">+20</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">
                  Share a Winning Ticket
                </Text>
                <Text className="text-sm text-gray-600">
                  Post a photo of your winning ticket and tag @ScratchIQ on social media
                </Text>
              </View>
            </View>
          </View>

          <View>
            <View className="flex-row items-start">
              <View className="w-8 h-8 bg-purple-600 rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold text-sm">+20</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">
                  Refer a Friend
                </Text>
                <Text className="text-sm text-gray-600">
                  Share your referral code and get 20 scans when they download the app
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View className="px-6 mb-8">
          <View className="bg-indigo-600 rounded-3xl p-6">
            <View className="flex-row items-baseline justify-center mb-2">
              <Text className="text-5xl font-bold text-white">$1.99</Text>
              <Text className="text-xl text-white/80 ml-2">/month</Text>
            </View>
            <Text className="text-center text-white/90 text-sm mb-6">
              Cancel anytime. No commitment.
            </Text>

            <Pressable
              className="bg-white rounded-2xl py-4 active:opacity-80"
              onPress={handleSubscribe}
              disabled={isProcessing || subscriptionStatus === "subscribed"}
            >
              <Text className="text-indigo-600 text-center font-bold text-lg">
                {isProcessing
                  ? "Processing..."
                  : subscriptionStatus === "subscribed"
                  ? "Currently Subscribed"
                  : "Subscribe Now"}
              </Text>
            </Pressable>
          </View>

          <Text className="text-center text-gray-500 text-xs mt-4">
            Subscription renews automatically. Manage in App Store settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start mb-4">
      <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color="#6366f1" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 mb-1">
          {title}
        </Text>
        <Text className="text-sm text-gray-600 leading-5">{description}</Text>
      </View>
    </View>
  );
}
