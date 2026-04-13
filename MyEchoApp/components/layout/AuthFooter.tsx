import type { ReactNode } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

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
  return (
    <View className="bg-transparent px-2 pb-5 pt-3">
      <View className="w-full self-center flex-row items-center justify-between rounded-[28px] bg-white px-3 py-2">
        {footerItems.map((item) => {
          const isActive = item.key === activeTab;

          return (
            <Pressable
              key={item.key}
              disabled
              className={`min-w-[72px] items-center justify-center rounded-[20px] px-3 py-3 ${
                isActive ? "bg-[#EEF6EE]" : ""
              }`}
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
