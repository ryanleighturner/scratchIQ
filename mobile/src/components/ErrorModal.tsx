import React from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  actionText?: string;
  onAction?: () => void;
}

export function ErrorModal({
  visible,
  title,
  message,
  onClose,
  actionText,
  onAction,
}: ErrorModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
          {/* Error Icon */}
          <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center self-center mb-4">
            <Ionicons name="alert-circle" size={32} color="#ef4444" />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-3">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-base text-gray-600 text-center mb-6 leading-6">
            {message}
          </Text>

          {/* Buttons */}
          <View className="gap-3">
            {actionText && onAction && (
              <Pressable
                className="bg-indigo-600 rounded-2xl py-4 active:bg-indigo-700"
                onPress={() => {
                  onAction();
                  onClose();
                }}
              >
                <Text className="text-white text-center font-semibold text-base">
                  {actionText}
                </Text>
              </Pressable>
            )}
            <Pressable
              className="bg-gray-100 rounded-2xl py-4 active:bg-gray-200"
              onPress={onClose}
            >
              <Text className="text-gray-900 text-center font-semibold text-base">
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
