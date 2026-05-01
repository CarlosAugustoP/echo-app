import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { GoalDraft } from "./types";
import { formatGoalTypeLabel, getGoalTypeTone, isMoneyGoalType } from "./utils";

export function SavedGoalCard({ goal }: { goal: GoalDraft }) {
  const tone = getGoalTypeTone(goal.goalType.name);
  const isMoneyGoal = isMoneyGoalType(goal.goalType.name);

  return (
    <View className="overflow-hidden rounded-[20px] border border-[#E8ECE7] bg-white px-4 py-4">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-8 w-8 items-center justify-center rounded-[10px]" style={{ backgroundColor: tone.backgroundColor }}>
            <MaterialCommunityIcons name={tone.iconName} size={18} color={tone.iconColor} />
          </View>
          <Text className="text-[11px] font-bold uppercase tracking-[1.2px]" style={{ color: tone.textColor }}>
            {formatGoalTypeLabel(goal.goalType.name)}
          </Text>
        </View>

        <View className="rounded-full bg-[#EEF6EE] px-3 py-1">
          <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#2F7D32]">Salva</Text>
        </View>
      </View>

      <Text className="mt-4 text-[20px] font-semibold leading-7 text-[#202124]">{goal.title}</Text>
      <Text className="mt-2 text-[13px] leading-5 text-[#6F7A75]">{goal.description}</Text>

      {isMoneyGoal ? (
        <View className="mt-4 rounded-[16px] bg-[#F7F3FF] px-4 py-3">
          <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#7C6AAE]">Transferencia direta</Text>
          <Text className="mt-2 text-[13px] leading-5 text-[#5F5B72]">
            Os fundos desta meta entram direto para a ONG e podem financiar custos de apoio do projeto, como equipe,
            passagens, logistica, execucao operacional e outras despesas indiretas necessarias para a entrega final.
          </Text>
        </View>
      ) : (
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-[16px] bg-[#F7F8F7] px-4 py-3">
            <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#86908A]">Quantidade</Text>
            <Text className="mt-2 text-[16px] font-semibold text-[#202124]">{goal.targetAmount}</Text>
          </View>

          <View className="flex-1 rounded-[16px] bg-[#F7F8F7] px-4 py-3">
            <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#86908A]">ETH por unidade</Text>
            <Text className="mt-2 text-[16px] font-semibold text-[#202124]">{goal.costPerUnit}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
