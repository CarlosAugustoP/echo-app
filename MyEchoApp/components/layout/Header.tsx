import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image, Pressable, Text, View } from "react-native";

import type { RootStackParamList } from "../../navigation/types";
import { useNotificationStore } from "../../stores/notificationStore";
import { useUserStore } from "../../stores/userStore";
import { Logo } from "../logo/logo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type HeaderVariant = "logo-left" | "logo-middle" | "logged-in";

type HeaderProps = {
  variant: HeaderVariant;
};

function ProfileAvatar() {
  const { currentUser } = useUserStore();
  const profilePictureUrl = currentUser?.profilePicture?.url;

  if (profilePictureUrl) {
    return (
      <Image
        source={{ uri: profilePictureUrl }}
        className="h-12 w-12 rounded-full"
        resizeMode="cover"
      />
    );
  }

  return (
    <View className="h-12 w-12 items-center justify-center rounded-full bg-[#DDEBDC]">
      <Ionicons name="person" size={22} color="#0B5A46" />
    </View>
  );
}

export function Header({ variant }: HeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { unreadCount } = useNotificationStore();
  const unreadBadgeLabel = unreadCount > 99 ? "99+" : `${unreadCount}`;

  const handleLogoPress = () => {
    navigation.navigate("AppHome");
  };

  if (variant === "logged-in") {
    return (
      <View className="w-full flex-row items-center justify-between bg-[#F8FAF9] px-4 py-5">
        <View className="flex-row items-center gap-3">
          <ProfileAvatar />
          <Pressable
            onPress={handleLogoPress}
            hitSlop={8}
            style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}
          >
            <Logo />
          </Pressable>
        </View>

        <Pressable
          className="h-12 w-12 items-center justify-center"
          style={({ pressed }) => (pressed ? { transform: [{ scale: 0.97 }] } : undefined)}
        >
          <View className="relative">
            <Ionicons name="notifications-outline" size={24} color="#7D8DA7" />
            {unreadCount > 0 ? (
              <View className="absolute -right-2 -top-2 min-w-[18px] items-center justify-center rounded-full bg-[#2F7D32] px-1 py-[1px]">
                <Text className="text-[10px] font-bold text-white">{unreadBadgeLabel}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>
    );
  }

  const logoPosition = variant === "logo-left" ? "justify-start" : "justify-center";

  return (
    <View className={`w-full flex-row items-center ${logoPosition} bg-headerMint px-4 py-7`}>
      <Pressable onPress={handleLogoPress} hitSlop={8} style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}>
        <Logo />
      </Pressable>
    </View>
  );
}

export type { HeaderVariant };
