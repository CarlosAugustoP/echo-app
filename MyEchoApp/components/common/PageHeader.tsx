import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  backLabel?: string;
  onBackPress?: () => void;
  rightSlot?: ReactNode;
};

export function PageHeader({
  title,
  eyebrow,
  description,
  backLabel,
  onBackPress,
  rightSlot,
}: PageHeaderProps) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <View className="flex-1 gap-3">
        {onBackPress ? (
          <Pressable
            className="flex-row items-center gap-2 self-start"
            onPress={onBackPress}
            style={({ pressed }) => (pressed ? { opacity: 0.72 } : undefined)}
          >
            <Ionicons name="arrow-back" size={16} color="#7D8A86" />
            <Text className="text-md font-semibold uppercase tracking-[1px] text-[#206223]">{backLabel || "Voltar"}</Text>
          </Pressable>
        ) : null}

        <View className="gap-2">
          {eyebrow ? (
            <Text className="text-[12px] font-semibold uppercase tracking-[1.2px] text-[#7D8A86]">{eyebrow}</Text>
          ) : null}
          <Text className="text-[32px] font-semibold leading-9 text-[#202124]">{title}</Text>
          {description ? <Text className="text-[14px] leading-6 text-[#6F7A75]">{description}</Text> : null}
        </View>
      </View>

      {rightSlot ? rightSlot : null}
    </View>
  );
}
