import React from "react";
import { Image as ExpoImage, ImageContentFit } from "expo-image";
import { StyleSheet } from "react-native";

interface CachedImageProps {
  source: { uri: string } | number;
  className?: string;
  style?: any;
  resizeMode?: "cover" | "contain" | "stretch";
  placeholder?: string;
}

/**
 * CachedImage component using expo-image for automatic caching
 * Images are cached to disk and memory for faster subsequent loads
 */
export function CachedImage({
  source,
  className,
  style,
  resizeMode = "cover",
  placeholder,
}: CachedImageProps) {
  // Parse Nativewind className into style object
  const parseClassName = (cn?: string) => {
    if (!cn) return {};
    const styles: any = {};

    // Match width (w-X)
    const widthMatch = cn.match(/w-(\d+)/);
    if (widthMatch) {
      styles.width = parseInt(widthMatch[1]) * 4; // Tailwind uses 4px units
    }

    // Match height (h-X)
    const heightMatch = cn.match(/h-(\d+)/);
    if (heightMatch) {
      styles.height = parseInt(heightMatch[1]) * 4;
    }

    return styles;
  };

  const parsedStyle = parseClassName(className);

  return (
    <ExpoImage
      source={source}
      style={[parsedStyle, style]}
      contentFit={resizeMode as ImageContentFit}
      transition={200}
      cachePolicy="memory-disk"
      placeholder={placeholder}
      placeholderContentFit="cover"
    />
  );
}
