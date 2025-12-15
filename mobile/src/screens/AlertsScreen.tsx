import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LogoHeader } from "../components/LogoHeader";

export default function AlertsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <LogoHeader />
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-900">Alerts</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Get notified when high-value tickets are available
          </Text>
        </View>

        <ScrollView className="flex-1">
          {/* Coming Soon State */}
          <View className="flex-1 items-center justify-center px-8 py-16">
            <View className="w-20 h-20 bg-indigo-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="notifications-outline" size={40} color="#6366f1" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-3 text-center">
              Smart Alerts Coming Soon
            </Text>
            <Text className="text-base text-gray-600 text-center mb-6 leading-6">
              We are working on intelligent notifications that will alert you when:
            </Text>

            <View className="w-full gap-4">
              <FeatureItem
                icon="trophy"
                text="High EV tickets become available in your area"
              />
              <FeatureItem
                icon="trending-up"
                text="Expected value improves for tracked games"
              />
              <FeatureItem
                icon="gift"
                text="Top prizes are claimed affecting odds"
              />
              <FeatureItem
                icon="location"
                text="New scratch-off games launch in your state"
              />
            </View>

            <View className="mt-8 bg-indigo-50 rounded-2xl p-4 w-full">
              <Text className="text-sm text-indigo-900 text-center">
                <Text className="font-semibold">Pro Tip:</Text> Enable notifications in your
                Profile to be first to know when this feature launches!
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View className="flex-row items-start bg-gray-50 rounded-xl p-4">
      <View className="w-8 h-8 bg-indigo-100 rounded-full items-center justify-center mr-3 mt-0.5">
        <Ionicons name={icon} size={16} color="#6366f1" />
      </View>
      <Text className="flex-1 text-sm text-gray-700 leading-5">{text}</Text>
    </View>
  );
}
