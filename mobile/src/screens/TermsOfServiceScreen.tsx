import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <ScrollView className="flex-1 px-6 py-4">
        <Text className="text-3xl font-bold text-gray-900 mb-6">
          Terms of Service
        </Text>

        <Text className="text-sm text-gray-500 mb-6">
          Last Updated: November 14, 2025
        </Text>

        {/* Introduction */}
        <View className="mb-6">
          <Text className="text-base text-gray-700 leading-6">
            Welcome to ScratchIQ. By accessing or using our mobile application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.
          </Text>
        </View>

        {/* Acceptance of Terms */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            1. Acceptance of Terms
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            By downloading, installing, or using ScratchIQ, you agree to comply with and be legally bound by these Terms of Service and our Privacy Policy. These terms apply to all users of the app.
          </Text>
        </View>

        {/* Description of Service */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            2. Description of Service
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            ScratchIQ provides analysis and information about lottery scratch-off tickets, including:{"\n"}
            • Expected value calculations{"\n"}
            • Prize availability data{"\n"}
            • AI-powered ticket scanning{"\n"}
            • Ticket recommendations{"\n"}
            • Notification alerts for high-value tickets
          </Text>
        </View>

        {/* Age Requirement */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            3. Age Requirement
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            You must be at least 18 years old to use ScratchIQ. By using this app, you represent and warrant that you are 18 years of age or older. Lottery games are restricted to adults only.
          </Text>
        </View>

        {/* User Responsibilities */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            4. User Responsibilities
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            You agree to:{"\n"}
            • Use the app only for lawful purposes{"\n"}
            • Not misuse or abuse the app or its services{"\n"}
            • Comply with all applicable lottery laws and regulations{"\n"}
            • Not attempt to reverse engineer or hack the app{"\n"}
            • Not share your account credentials with others{"\n"}
            • Gamble responsibly and within your means
          </Text>
        </View>

        {/* No Guarantee of Results */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            5. No Guarantee of Results
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            ScratchIQ provides analysis and recommendations based on mathematical calculations and available data. However:{"\n"}
            • We do not guarantee any specific results or winnings{"\n"}
            • Expected value calculations are estimates only{"\n"}
            • Past performance does not guarantee future results{"\n"}
            • All lottery games involve risk and chance{"\n"}
            • You may lose money when purchasing lottery tickets
          </Text>
        </View>

        {/* Data Accuracy */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            6. Data Accuracy
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            While we strive to provide accurate and up-to-date information:{"\n"}
            • Data may contain errors or be outdated{"\n"}
            • Prize availability can change without notice{"\n"}
            • You should verify information with official lottery sources{"\n"}
            • We are not responsible for inaccuracies in third-party data
          </Text>
        </View>

        {/* Independent Service */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            7. Independent Service
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            ScratchIQ is an independent service and is not affiliated with, endorsed by, or connected to any state lottery organization. We do not sell lottery tickets or conduct lottery games.
          </Text>
        </View>

        {/* Intellectual Property */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            8. Intellectual Property
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            All content, features, and functionality of ScratchIQ, including but not limited to text, graphics, logos, and software, are owned by ScratchIQ and are protected by copyright, trademark, and other intellectual property laws.
          </Text>
        </View>

        {/* Limitation of Liability */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            9. Limitation of Liability
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            To the maximum extent permitted by law:{"\n"}
            • ScratchIQ and its developers shall not be liable for any direct, indirect, incidental, special, or consequential damages{"\n"}
            • This includes damages for loss of profits, data, or other intangible losses{"\n"}
            • Our total liability shall not exceed the amount you paid to use the app
          </Text>
        </View>

        {/* Termination */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            10. Termination
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            We reserve the right to terminate or suspend your access to ScratchIQ at any time, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
          </Text>
        </View>

        {/* Changes to Terms */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            11. Changes to Terms
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            We may modify these Terms of Service at any time. We will notify you of any changes by updating the &quot;Last Updated&quot; date. Your continued use of ScratchIQ after changes constitutes acceptance of the new terms.
          </Text>
        </View>

        {/* Governing Law */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            12. Governing Law
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            These Terms of Service shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
          </Text>
        </View>

        {/* Problem Gambling Resources */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            13. Responsible Gambling
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            If you or someone you know has a gambling problem, help is available:{"\n\n"}
            National Council on Problem Gambling{"\n"}
            1-800-GAMBLER (1-800-426-2537){"\n\n"}
            Please gamble responsibly and only with money you can afford to lose.
          </Text>
        </View>

        {/* Contact Information */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            14. Contact Us
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            If you have questions about these Terms of Service, please contact us at:{"\n\n"}
            Email: support@scratchiq.com{"\n"}
            Website: www.scratchiq.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
