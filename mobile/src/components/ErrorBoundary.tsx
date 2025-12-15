import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: React.ReactNode;
  fallback?: (error: Error, resetError: () => void) => React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <View className="flex-1 bg-white items-center justify-center px-6">
          <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
            Something Went Wrong
          </Text>

          <Text className="text-base text-gray-600 mb-6 text-center">
            We encountered an unexpected error. Please try again.
          </Text>

          <ScrollView className="max-h-32 w-full mb-6 bg-gray-50 rounded-xl p-4">
            <Text className="text-xs text-gray-500 font-mono">
              {this.state.error.message}
            </Text>
          </ScrollView>

          <Pressable
            className="bg-indigo-600 rounded-xl py-4 px-8 active:opacity-80"
            onPress={this.resetError}
          >
            <Text className="text-white text-lg font-semibold">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
