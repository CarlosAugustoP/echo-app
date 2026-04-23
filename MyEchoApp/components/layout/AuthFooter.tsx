import type { ReactNode } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Alert, Platform, Pressable, Text, View } from "react-native";

import type { RootStackParamList } from "../../navigation/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type AuthFooterTab = "inicio" | "historico" | "dashboard" | "perfil";

type AuthFooterProps = {
  activeTab: AuthFooterTab;
};

const footerItems: Array<{
  key: AuthFooterTab;
  label: string;
  icon: (isActive: boolean) => ReactNode;
}> = [
  {
    key: "inicio",
    label: "INICIO",
    icon: (isActive) => (
      <Ionicons name={isActive ? "home" : "home-outline"} size={24} color={isActive ? "#2F7D32" : "#91A2BF"} />
    ),
  },
  {
    key: "historico",
    label: "HISTORICO",
    icon: (isActive) => (
      <Ionicons name={isActive ? "receipt" : "receipt-outline"} size={22} color={isActive ? "#2F7D32" : "#91A2BF"} />
    ),
  },
  {
    key: "dashboard",
    label: "DASHBOARD",
    icon: (isActive) => (
      <MaterialCommunityIcons
        name={isActive ? "chart-box" : "chart-box-outline"}
        size={24}
        color={isActive ? "#2F7D32" : "#91A2BF"}
      />
    ),
  },
  {
    key: "perfil",
    label: "PERFIL",
    icon: (isActive) => (
      <Ionicons name={isActive ? "person" : "person-outline"} size={22} color={isActive ? "#2F7D32" : "#91A2BF"} />
    ),
  },
];

export function AuthFooter({ activeTab }: AuthFooterProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();

  const showUnavailableMessage = (label: string) => {
    const title = `${label} em breve`;
    const message = `A navegação para ${label.toLowerCase()} ainda não está disponível nesta versão.`;

    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  const handleTabPress = (tab: AuthFooterTab) => {
    if (tab === activeTab) {
      return;
    }

    if (tab === "inicio") {
      if (route.name !== "AppHome") {
        navigation.navigate("AppHome");
      }

      return;
    }

    if (tab === "historico") {
      if (route.name !== "DonationHistory") {
        navigation.navigate("DonationHistory");
      }

      return;
    }

    if (tab === "perfil") {
      if (route.name !== "Profile") {
        navigation.navigate("Profile");
      }

      return;
    }

    const labelsByTab: Record<Exclude<AuthFooterTab, "inicio" | "historico" | "perfil">, string> = {
      dashboard: "Dashboard",
    };

    showUnavailableMessage(labelsByTab[tab as keyof typeof labelsByTab]);
  };

  return (
    <View className="bg-transparent px-2 pb-5 pt-3">
      <View className="w-full self-center flex-row items-center justify-between rounded-[28px] bg-white px-3 py-2">
        {footerItems.map((item) => {
          const isActive = item.key === activeTab;

          return (
            <Pressable
              key={item.key}
              onPress={() => handleTabPress(item.key)}
              className={`min-w-[72px] items-center justify-center rounded-[20px] px-3 py-3 ${
                isActive ? "bg-[#EEF6EE]" : ""
              }`}
              style={({ pressed }) => (pressed && !isActive ? { opacity: 0.72 } : undefined)}
            >
              {item.icon(isActive)}
              <Text
                className={`mt-1 text-[10px] font-semibold uppercase leading-[10px] tracking-[1px] ${
                  isActive ? "text-[#2F7D32]" : "text-[#91A2BF]"
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export type { AuthFooterTab };
