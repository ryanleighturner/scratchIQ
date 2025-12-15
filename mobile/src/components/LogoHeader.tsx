import React from "react";
import { View } from "react-native";
import { CachedImage } from "./CachedImage";

export function LogoHeader() {
  return (
    <View className="px-6 pt-4 pb-3 items-center bg-white">
      <CachedImage
        source={require("../../assets/logo-1763244547866.png")}
        style={{ width: 280, height: 60 }}
        resizeMode="contain"
      />
    </View>
  );
}
