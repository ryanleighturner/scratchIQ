import React, { useEffect } from "react";
import { View, Text } from "react-native";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY;

export default function TestApiScreen() {
  useEffect(() => {
    console.log("=== API KEY TEST ===");
    console.log("Google API Key exists:", !!GOOGLE_API_KEY);
    console.log("Google API Key length:", GOOGLE_API_KEY?.length || 0);
    console.log("Google API Key first 10 chars:", GOOGLE_API_KEY?.substring(0, 10));
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="text-lg font-bold">API Key Check</Text>
      <Text className="text-sm mt-4">Check console logs</Text>
      <Text className="text-xs mt-2 text-gray-600">
        Key exists: {GOOGLE_API_KEY ? "Yes" : "No"}
      </Text>
      <Text className="text-xs text-gray-600">
        Key length: {GOOGLE_API_KEY?.length || 0}
      </Text>
    </View>
  );
}
