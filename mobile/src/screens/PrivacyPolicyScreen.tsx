import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <ScrollView className="flex-1 px-6 py-4">
        <Text className="text-3xl font-bold text-gray-900 mb-6">
          Privacy Policy
        </Text>

        <Text className="text-sm text-gray-500 mb-6">
          Last Updated: November 14, 2025
        </Text>

        {/* Introduction */}
        <View className="mb-6">
          <Text className="text-base text-gray-700 leading-6">
            ScratchIQ (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </Text>
        </View>

        {/* Information We Collect */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            Information We Collect
          </Text>

          <Text className="text-lg font-semibold text-gray-800 mb-2">
            1. Information You Provide
          </Text>
          <Text className="text-base text-gray-700 leading-6 mb-3">
            • State Selection: Your chosen state for lottery data{"\n"}
            • Notification Preferences: Your settings for alerts{"\n"}
            • Favorites: Games you bookmark for tracking
          </Text>

          <Text className="text-lg font-semibold text-gray-800 mb-2">
            2. Automatically Collected Information
          </Text>
          <Text className="text-base text-gray-700 leading-6 mb-3">
            • Device Information: Device model, operating system{"\n"}
            • Usage Data: Features used, app performance metrics{"\n"}
            • Scan History: Images and results from ticket scans{"\n"}
            • Crash Reports: Anonymous error logs via Sentry
          </Text>

          <Text className="text-lg font-semibold text-gray-800 mb-2">
            3. Camera and Photo Library
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            We access your camera and photo library only to scan lottery tickets. Images are processed temporarily and not stored on our servers unless you explicitly save scan results.
          </Text>
        </View>

        {/* How We Use Your Information */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            How We Use Your Information
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            • Provide lottery ticket analysis and recommendations{"\n"}
            • Send notifications about high-value tickets{"\n"}
            • Improve app functionality and user experience{"\n"}
            • Analyze app usage and performance{"\n"}
            • Detect and prevent technical issues{"\n"}
            • Comply with legal obligations
          </Text>
        </View>

        {/* Data Storage and Security */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            Data Storage and Security
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            Your data is stored securely using industry-standard encryption. We use Supabase (PostgreSQL) for database storage and implement appropriate security measures to protect your information. However, no method of transmission over the internet is 100% secure.
          </Text>
        </View>

        {/* Third-Party Services */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            Third-Party Services
          </Text>
          <Text className="text-base text-gray-700 leading-6 mb-3">
            We use the following third-party services:
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            • Supabase: Database and user management{"\n"}
            • OpenAI: AI-powered ticket scanning{"\n"}
            • Sentry: Error tracking and monitoring{"\n"}
            • Expo: App development and push notifications
          </Text>
          <Text className="text-base text-gray-700 leading-6 mt-3">
            These services have their own privacy policies governing their use of your information.
          </Text>
        </View>

        {/* Data Retention */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            Data Retention
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            We retain your information for as long as your account is active or as needed to provide services. You can request deletion of your data at any time by contacting us.
          </Text>
        </View>

        {/* Your Rights */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            Your Rights
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            You have the right to:{"\n"}
            • Access your personal data{"\n"}
            • Request correction of inaccurate data{"\n"}
            • Request deletion of your data{"\n"}
            • Opt-out of notifications{"\n"}
            • Withdraw consent for data processing
          </Text>
        </View>

        {/* Children's Privacy */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            Children&apos;s Privacy
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            ScratchIQ is intended for users 18 years and older. We do not knowingly collect information from children under 18. If we discover we have collected information from a child under 18, we will delete it immediately.
          </Text>
        </View>

        {/* Changes to Privacy Policy */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            Changes to This Privacy Policy
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date.
          </Text>
        </View>

        {/* Contact Us */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            Contact Us
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            If you have questions about this Privacy Policy, please contact us at:{"\n\n"}
            Email: support@scratchiq.com{"\n"}
            Website: www.scratchiq.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
