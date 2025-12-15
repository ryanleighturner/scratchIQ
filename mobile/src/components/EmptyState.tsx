import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
        <Ionicons name={icon} size={40} color="#9ca3af" />
      </View>

      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
        {title}
      </Text>

      <Text className="text-base text-gray-600 text-center mb-6">
        {description}
      </Text>

      {actionLabel && onAction && (
        <Pressable
          className="bg-indigo-600 rounded-xl py-3 px-6 active:opacity-80"
          onPress={onAction}
        >
          <Text className="text-white text-base font-semibold">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
