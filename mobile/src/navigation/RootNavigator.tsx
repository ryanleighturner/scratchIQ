import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Custom Tab Icons
import {
  InfoIcon,
  TicketsIcon,
  HomeIcon,
  FavoritesIcon,
  ProfileIcon,
} from "../components/TabIcons";

// Screens
import HomeScreen from "../screens/HomeScreen";
import ScanScreen from "../screens/ScanScreen";
import ScanResultsScreen from "../screens/ScanResultsScreen";
import TicketsScreen from "../screens/TicketsScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import AlertsScreen from "../screens/AlertsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import GameDetailScreen from "../screens/GameDetailScreen";
import DisclaimerScreen from "../screens/DisclaimerScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import TermsOfServiceScreen from "../screens/TermsOfServiceScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Scan"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          paddingTop: 8,
          paddingBottom: 28,
          height: 88,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Info",
          tabBarIcon: ({ color }) => (
            <InfoIcon color={color} size={48} />
          ),
        }}
      />
      <Tab.Screen
        name="Tickets"
        component={TicketsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <TicketsIcon color={color} size={48} />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <HomeIcon color={color} size={48} />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FavoritesIcon color={color} size={48} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <ProfileIcon color={color} size={48} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={HomeTabs} />
      <Stack.Screen
        name="GameDetail"
        component={GameDetailScreen}
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="ScanResults"
        component={ScanResultsScreen}
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Disclaimer"
        component={DisclaimerScreen}
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          presentation: "modal",
          headerShown: true,
          headerTitle: "Privacy Policy",
        }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{
          presentation: "modal",
          headerShown: true,
          headerTitle: "Terms of Service",
        }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          presentation: "modal",
        }}
      />
    </Stack.Navigator>
  );
}
