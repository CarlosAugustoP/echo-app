import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { GoalTypeDto } from "../../types/api";

import { formatGoalTypeLabel, getGoalTypeTone } from "./utils";

export function GoalTypeRow({
  goalType,
  onRemove,
}: {
  goalType: GoalTypeDto;
  onRemove: () => void;
}) {
  const tone = getGoalTypeTone(goalType.name);

  return (
    <View className="flex-row items-center gap-3 border-b border-[#EAEDEA] py-3 last:border-b-0">
      <View className="h-8 w-8 items-center justify-center rounded-[10px]" style={{ backgroundColor: tone.backgroundColor }}>
        <MaterialCommunityIcons name={tone.iconName} size={18} color={tone.iconColor} />
      </View>

      <Text className="flex-1 text-[11px] font-bold uppercase tracking-[1.3px]" style={{ color: tone.textColor }}>
        {formatGoalTypeLabel(goalType.name)}
      </Text>

      <Pressable
        onPress={onRemove}
        className="h-8 w-8 items-center justify-center"
        style={({ pressed }) => (pressed ? { opacity: 0.65 } : undefined)}
      >
        <Ionicons name="trash-outline" size={18} color="#7E8781" />
      </Pressable>
    </View>
  );
}
