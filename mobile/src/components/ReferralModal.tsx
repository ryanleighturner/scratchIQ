import React from "react";
import { View, Text, Pressable, Modal, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../state/appStore";
import * as Clipboard from "expo-clipboard";
import { trackEvent, MixpanelEvents } from "../services/mixpanelService";

interface ReferralModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReferralModal({ visible, onClose }: ReferralModalProps) {
  const scansRemaining = useAppStore((s) => s.scansRemaining);
  const totalReferrals = useAppStore((s) => s.totalReferrals);
  const addBonusScans = useAppStore((s) => s.addBonusScans);
  const userId = useAppStore((s) => s.userId);

  const referralLink = `https://scratchiq.app/ref/${userId}`;

  const handleShareApp = async () => {
    try {
      const result = await Share.share({
        message: `Check out ScratchIQ - the smartest way to find winning lottery tickets! Get 25 free scans when you sign up: ${referralLink}`,
        title: "Join me on ScratchIQ",
      });

      if (result.action === Share.sharedAction) {
        // User shared successfully
        addBonusScans(10);
        trackEvent(MixpanelEvents.REFERRAL_SHARED, {
          method: "native_share",
          scansEarned: 10,
        });
        onClose();
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(referralLink);
    addBonusScans(5);
    trackEvent(MixpanelEvents.REFERRAL_LINK_COPIED, {
      scansEarned: 5,
    });
    onClose();
  };

  const handleSocialPost = () => {
    // Reward user for posting on social media
    addBonusScans(10);
    trackEvent(MixpanelEvents.REFERRAL_SHARED, {
      method: "social_media_post",
      scansEarned: 10,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-900">
              Earn More Scans
            </Text>
            <Pressable onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#111827" />
            </Pressable>
          </View>

          {/* Scan Count */}
          <View className="bg-indigo-50 rounded-xl p-4 mb-6">
            <Text className="text-center text-sm text-gray-600 mb-1">
              Scans Remaining
            </Text>
            <Text className="text-center text-4xl font-bold text-indigo-600">
              {scansRemaining}
            </Text>
            <Text className="text-center text-xs text-gray-500 mt-1">
              {totalReferrals} friends referred
            </Text>
          </View>

          {/* Social Media Info */}
          <View className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              Post a winning ticket & tag us for 50 scans!
            </Text>
            <View className="flex-row items-center mb-2">
              <Ionicons name="logo-tiktok" size={18} color="#000000" />
              <Text className="text-sm text-gray-700 ml-2 font-medium">
                TikTok @ScratchIQ
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="logo-instagram" size={18} color="#E4405F" />
              <Text className="text-sm text-gray-700 ml-2 font-medium">
                Instagram @scratchIQapp
              </Text>
            </View>
          </View>

          {/* Options */}
          <View className="space-y-3 mb-6">
            {/* Share with Friend */}
            <Pressable
              onPress={handleShareApp}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 flex-row items-center justify-between active:opacity-80"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-white/20 rounded-full p-3 mr-4">
                  <Ionicons name="people" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">
                    Share with Friends
                  </Text>
                  <Text className="text-white/80 text-sm">
                    +10 scans per friend
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </Pressable>

            {/* Post on Social Media */}
            <Pressable
              onPress={handleSocialPost}
              className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-4 flex-row items-center justify-between active:opacity-80"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-white/20 rounded-full p-3 mr-4">
                  <Ionicons name="share-social" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">
                    Post on Social Media
                  </Text>
                  <Text className="text-white/80 text-sm">
                    +10 scans per post
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </Pressable>

            {/* Copy Referral Link */}
            <Pressable
              onPress={handleCopyLink}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 flex-row items-center justify-between active:opacity-80"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-white/20 rounded-full p-3 mr-4">
                  <Ionicons name="link" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">
                    Copy Referral Link
                  </Text>
                  <Text className="text-white/80 text-sm">
                    +5 scans per copy
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </Pressable>
          </View>

          {/* Info */}
          <View className="bg-gray-50 rounded-xl p-4">
            <Text className="text-xs text-gray-600 text-center">
              Share ScratchIQ with friends to earn unlimited scans! Each action
              gives you more chances to find winning tickets.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
