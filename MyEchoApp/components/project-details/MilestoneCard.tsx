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

  return (
    <View className="rounded-[22px] bg-white px-4 py-4">
      <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#9BA3AF]">
        {goal.goalType?.name?.trim() || "Milestone"}
      </Text>
      <Text className="mt-2 text-[18px] font-semibold leading-6 text-[#202124]">{goal.title?.trim() || " "}</Text>
      <Text className="mt-2 text-[13px] leading-5 text-[#667085]">
        {goal.goalType?.description?.trim() || " "}
      </Text>

      <View className="mt-4 gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-[12px] font-semibold text-[#2F7D32]">{progressLabel}</Text>
        </View>
        {isMoneyGoal ? null : (
          <View className="h-2 overflow-hidden rounded-full bg-[#E4E7E5]">
            <View className="h-full rounded-full bg-[#2F7D32]" style={{ width: `${progressPercentage}%` }} />
          </View>
        )}
      </View>
    </View>
  );
}
