import React from "react";
import { Image } from "react-native";

interface IconProps {
  color: string;
  size: number;
}

export const InfoIcon: React.FC<IconProps> = ({ color, size }) => (
  <Image
    source={require("../../assets/info-1763244628095.png")}
    style={{ width: size, height: size, tintColor: color }}
    resizeMode="contain"
  />
);

export const TicketsIcon: React.FC<IconProps> = ({ color, size }) => (
  <Image
    source={require("../../assets/tickets-1763244615092.png")}
    style={{ width: size, height: size, tintColor: color }}
    resizeMode="contain"
  />
);

export const HomeIcon: React.FC<IconProps> = ({ color, size }) => (
  <Image
    source={require("../../assets/home-1763244584038.png")}
    style={{ width: size, height: size, tintColor: color }}
    resizeMode="contain"
  />
);

export const FavoritesIcon: React.FC<IconProps> = ({ color, size }) => (
  <Image
    source={require("../../assets/Favorites-1763244567635.png")}
    style={{ width: size, height: size, tintColor: color }}
    resizeMode="contain"
  />
);

export const ProfileIcon: React.FC<IconProps> = ({ color, size }) => (
  <Image
    source={require("../../assets/profile-1763244556447.png")}
    style={{ width: size, height: size, tintColor: color }}
    resizeMode="contain"
  />
);
