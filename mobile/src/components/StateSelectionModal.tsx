import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { STATES } from "../types/database";
import type { State } from "../types/database";

interface StateSelectionModalProps {
  visible: boolean;
  onSelectState: (state: State) => void;
}

export default function StateSelectionModal({
  visible,
  onSelectState,
}: StateSelectionModalProps) {
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleStatePress = (state: State) => {
    setSelectedState(state);
  };

  const handleConfirm = () => {
    if (selectedState) {
      onSelectState(selectedState);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white rounded-3xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <View className="bg-indigo-600 p-6">
            <View className="items-center mb-2">
              <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-3">
                <Ionicons name="location" size={32} color="white" />
              </View>
              <Text className="text-2xl font-bold text-white text-center">
                Welcome to ScratchIQ
              </Text>
            </View>
            <Text className="text-indigo-100 text-center text-base">
              Select your state to get started
            </Text>
          </View>

          {/* State List */}
          <View className="max-h-96">
            <ScrollView
              ref={scrollViewRef}
              className="px-4 py-4"
              showsVerticalScrollIndicator={true}
            >
              {STATES.map((state, index) => (
                <Pressable
                  key={state.value}
                  className={`flex-row items-center justify-between p-4 rounded-xl mb-2 ${
                    selectedState === state.value
                      ? "bg-indigo-50 border-2 border-indigo-500"
                      : "bg-gray-50 border-2 border-transparent"
                  } active:opacity-70`}
                  onPress={() => handleStatePress(state.value)}
                >
                  <View className="flex-row items-center flex-1">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        selectedState === state.value
                          ? "bg-indigo-100"
                          : "bg-gray-200"
                      }`}
                    >
                      <Ionicons
                        name="location"
                        size={20}
                        color={
                          selectedState === state.value ? "#6366f1" : "#9ca3af"
                        }
                      />
                    </View>
                    <Text
                      className={`ml-3 text-base font-semibold ${
                        selectedState === state.value
                          ? "text-indigo-700"
                          : "text-gray-900"
                      }`}
                    >
                      {state.label}
                    </Text>
                  </View>
                  {selectedState === state.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#6366f1"
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Footer */}
          <View className="p-4 border-t border-gray-200">
            <Pressable
              className={`py-4 rounded-xl ${
                selectedState
                  ? "bg-indigo-600 active:bg-indigo-700"
                  : "bg-gray-300"
              }`}
              onPress={handleConfirm}
              disabled={!selectedState}
            >
              <Text className="text-white text-center text-lg font-bold">
                Continue
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
