import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { GoalDto } from "../../types/api";
import { formatEth, normalizePercentageProgress } from "./projectDetailsUtils";

type MilestoneCardProps = {
  goal: GoalDto;
};

export function MilestoneCard({ goal }: MilestoneCardProps) {
  const progressValue = Number(goal.progress);
  const normalizedProgressValue = Number.isFinite(progressValue) ? progressValue : 0;
  const goalTypeName = goal.goalType?.name?.trim() || "";
  const isMoneyGoal = goalTypeName.toUpperCase() === "MONEY";
  const progressLabel = isMoneyGoal
    ? formatEth(normalizedProgressValue)
    : `${normalizePercentageProgress(normalizedProgressValue)}% reached`;
  const progressPercentage = normalizePercentageProgress(normalizedProgressValue);
  const donationPrompt = isMoneyGoal
    ? "Ajude a ONG diretamente com quanto você quiser."
    : progressPercentage < 100
      ? `Sua doacao ajuda a levar esta meta aos ${100 - progressPercentage}% restantes`
      : "Meta concluida. Sua doacao pode impulsionar as proximas etapas.";

  return (
    <View className="overflow-hidden rounded-[22px] border border-[#D6E7D6] bg-white">
      <View className="px-4 pb-4 pt-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#9BA3AF]">
              {goal.goalType?.name?.trim() || "Milestone"}
            </Text>
            <Text className="mt-2 text-[18px] font-semibold leading-6 text-[#202124]">{goal.title?.trim() || " "}</Text>
          </View>
          <View className="rounded-full bg-[#EEF6EE] px-3 py-2">
            <Text className="text-[11px] font-bold uppercase tracking-[0.4px] text-[#2F7D32]">Doe agora</Text>
          </View>
        </View>

        <Text className="mt-2 text-[13px] leading-5 text-[#667085]">
          {goal.goalType?.description?.trim() || " "}
        </Text>

        <View className="mt-4 rounded-[18px] bg-[#F6FAF6] px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-semibold text-[#2F7D32]">{progressLabel}</Text>
            {isMoneyGoal ? (
              <Text className="text-[12px] font-semibold text-[#202124]">Apoio direto</Text>
            ) : null}
          </View>
          {isMoneyGoal ? null : (
            <View className="mt-3 h-2 overflow-hidden rounded-full bg-[#E4E7E5]">
              <View className="h-full rounded-full bg-[#2F7D32]" style={{ width: `${progressPercentage}%` }} />
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-center justify-between bg-[#206223] px-4 py-3">
        <Text className="flex-1 text-[13px] font-medium leading-5 text-white">{donationPrompt}</Text>
        <MaterialCommunityIcons name="arrow-right-circle" size={20} color="#FFFFFF" />
      </View>
    </View>
  );
}
