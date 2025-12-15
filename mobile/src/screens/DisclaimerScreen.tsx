import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LogoHeader } from "../components/LogoHeader";

export default function DisclaimerScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <LogoHeader />
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center border-b border-gray-200">
        <Pressable onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </Pressable>
        <Text className="text-2xl font-bold text-gray-900">
          Legal Disclaimer
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Information Accuracy */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Information Accuracy
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            The data, odds, prizes, and game information displayed in this app
            are unofficial and provided for informational purposes only. While
            we strive to keep information current and accurate, always verify
            with your state&apos;s official lottery website for the most up-to-date
            and authoritative information before purchasing any lottery tickets.
          </Text>
        </View>

        {/* Responsible Gambling */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Responsible Gambling
          </Text>
          <Text className="text-base text-gray-700 leading-6 mb-3">
            • Age Requirement: You must be 18 years or older (19+ in Nebraska,
            21+ in Arizona) to purchase lottery tickets
          </Text>
          <Text className="text-base text-gray-700 leading-6 mb-3">
            • Play Responsibly: Lottery tickets should be played for
            entertainment only. Never spend more than you can afford to lose
          </Text>
          <Text className="text-base text-gray-700 leading-6 mb-3">
            • Problem Gambling Help: If you or someone you know has a gambling
            problem, help is available:
          </Text>
          <Text className="text-base text-gray-700 leading-6 ml-4 mb-2">
            - National Problem Gambling Helpline: 1-800-GAMBLER
            (1-800-426-2537)
          </Text>
          <Text className="text-base text-gray-700 leading-6 ml-4">
            - Available 24/7, free and confidential
          </Text>
        </View>

        {/* No Guarantee */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            No Guarantee of Results
          </Text>
          <Text className="text-base text-gray-700 leading-6 mb-3">
            • Expected value (EV) calculations are statistical estimates based
            on available prize data and do not guarantee any specific outcome
          </Text>
          <Text className="text-base text-gray-700 leading-6 mb-3">
            • Past performance and remaining prizes do not predict future
            results
          </Text>
          <Text className="text-base text-gray-700 leading-6 mb-3">
            • All lottery games have a house edge - players lose money on
            average over time
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            • This app provides analysis tools but does not increase your
            chances of winning
          </Text>
        </View>

        {/* Independent Service */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Independent Service
          </Text>
          <Text className="text-base text-gray-700 leading-6 mb-3">
            • ScratchIQ is an independent analysis service and is not
            affiliated with, endorsed by, or associated with any state lottery
            organization, government agency, or official lottery operator
          </Text>
          <Text className="text-base text-gray-700 leading-6 mb-3">
            • All state lottery names, game names, and trademarks remain the
            property of their respective owners and are used for informative and
            nominative purposes only
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            • Use of these trademarks does not imply endorsement by the
            trademark holders
          </Text>
        </View>

        {/* No Ticket Sales */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            No Ticket Sales
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            ScratchIQ does not sell lottery tickets. To purchase tickets, visit
            authorized lottery retailers in your state or your state&apos;s official
            lottery website.
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
