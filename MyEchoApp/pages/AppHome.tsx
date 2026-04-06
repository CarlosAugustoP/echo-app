import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { AppLayout } from "../components/layout/AppLayout";
import { AppHomeScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import { clearAccessToken } from "../services/authStorage";
import { clearCurrentUser, setCurrentUser, useUserStore } from "../stores/userStore";

export default function AppHomePage({ navigation }: AppHomeScreenProps) {
  const { currentUser } = useUserStore();
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  useEffect(() => {
    if (currentUser) {
      return;
    }

    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        setIsLoadingUser(true);
        const user = await apiClient.me();

        if (isMounted) {
          setCurrentUser(user);
        }
      } catch {
        if (isMounted) {
          navigation.replace("Signin");
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    };

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [currentUser, navigation]);

  const handleSignOut = async () => {
    await clearAccessToken();
    clearCurrentUser();
    navigation.replace("Signin");
  };

  return (
    <AppLayout headerVariant="logo-left">
      <View className="flex-1 justify-center gap-6">
        <View className="gap-3">
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-echoDarkGreen">
            Placeholder Home
          </Text>
          <Text className="text-4xl font-extrabold text-black">You are signed in</Text>
          <Text className="text-lg leading-7 text-slate-600">
            This is a temporary post-login screen. We can replace it with the real dashboard next.
          </Text>
          {isLoadingUser ? (
            <Text className="text-base text-slate-500">Loading your profile...</Text>
          ) : currentUser ? (
            <View className="mt-2 gap-2 rounded-2xl border border-[#D8E1DA] bg-white px-4 py-4">
              <Text className="text-base font-bold text-[#202428]">{currentUser.name}</Text>
              <Text className="text-sm text-slate-600">{currentUser.email}</Text>
              <Text className="text-sm text-slate-600">Wallet: {currentUser.walletAddress}</Text>
              <Text className="text-sm text-slate-600">Tax ID: {currentUser.taxId.value}</Text>
              <Text className="text-sm text-slate-600">Role code: {currentUser.role}</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          className="rounded-2xl border border-[#D8E1DA] bg-white px-6 py-4"
          onPress={handleSignOut}
        >
          <Text className="text-center text-base font-bold text-echoDarkGreen">Sign out</Text>
        </Pressable>
      </View>
    </AppLayout>
  );
}
