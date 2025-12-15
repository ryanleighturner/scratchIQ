import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { cn } from "../utils/cn";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ width, height, borderRadius = 8, className }: SkeletonProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: "#e5e7eb",
          opacity,
          borderRadius,
        },
        width !== undefined && { width: width as number },
        height !== undefined && { height: height as number },
      ]}
      className={className}
    />
  );
}

export function GameCardSkeleton() {
  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-1 mr-3">
          <Skeleton width={64} height={80} borderRadius={8} className="mr-3" />
          <View className="flex-1">
            <Skeleton width="80%" height={16} borderRadius={4} className="mb-2" />
            <View className="flex-row gap-2 mt-2">
              <Skeleton width={50} height={24} borderRadius={4} />
              <Skeleton width={70} height={24} borderRadius={4} />
            </View>
          </View>
        </View>
        <Skeleton width={20} height={20} borderRadius={10} />
      </View>
      <View className="mt-3 pt-3 border-t border-gray-100">
        <Skeleton width="70%" height={14} borderRadius={4} />
      </View>
    </View>
  );
}

export function TicketListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function PrizeRowSkeleton() {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <View className="flex-1 mr-4">
        <Skeleton width="40%" height={18} borderRadius={4} className="mb-2" />
        <Skeleton width="100%" height={8} borderRadius={4} />
      </View>
      <Skeleton width={80} height={14} borderRadius={4} />
    </View>
  );
}
