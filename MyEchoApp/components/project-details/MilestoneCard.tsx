import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { GoalDto } from "../../types/api";
import { formatEth, normalizePercentageProgress } from "./projectDetailsUtils";

type MilestoneCardProps = {
  goal: GoalDto;
  index: number;
  contractAddress?: string | null;
  onDonatePress?: () => void;
};

function formatMilestoneIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

function shortenContractAddress(contractAddress?: string | null) {
  const normalizedValue = contractAddress?.trim();

  if (!normalizedValue) {
    return "0x---";
  }

  if (normalizedValue.length <= 10) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, 4)}...${normalizedValue.slice(-3)}`;
}

function formatEthValue(value: number) {
  return formatEth(value).replace(" ETH", "");
}

export function MilestoneCard({ goal, index, contractAddress, onDonatePress }: MilestoneCardProps) {
  const progressValue = Number(goal.progress);
  const normalizedProgressValue = Number.isFinite(progressValue) ? progressValue : 0;
  const progressPercentage = normalizePercentageProgress(normalizedProgressValue);
  const goalTypeName = goal.goalType?.name?.trim() || "";
  const isMoneyGoal = goalTypeName.toUpperCase() === "MONEY";

  const targetAmount = Number(goal.targetAmount);
  const currentAmount = Number(goal.currentAmount);
  const hasFiniteTarget = Number.isFinite(targetAmount) && targetAmount > 0;
  const hasFiniteCurrent = Number.isFinite(currentAmount);
  const isCompleted = progressPercentage >= 100 || (hasFiniteTarget && hasFiniteCurrent && currentAmount >= targetAmount);

  const milestoneLabel = `MILESTONE ${formatMilestoneIndex(index)} \u2022 ${isCompleted ? "COMPLETADO" : "EM PROGRESSO"}`;
  const description = goal?.description?.trim() || goal?.goalType?.description?.trim();
  const itemLabel = goal.goalType?.description?.trim() || goal.title?.trim() || "Item";
  const priceReference = goal.costPerUnit ?? (hasFiniteCurrent && currentAmount > 0 ? currentAmount : normalizedProgressValue);
  const priceValue = Number(priceReference);
  const displayPrice = Number.isFinite(priceValue) ? formatEthValue(priceValue) : "0.00";
  const contractLabel = `BLOCKCHAIN VERIFICADA: ${shortenContractAddress(contractAddress)}`;

  const cardClassName = isCompleted
    ? "overflow-hidden rounded-[24px] bg-[#6E8F89]"
    : "overflow-hidden rounded-[24px] border border-[#E6E8E3] bg-[#FFFEFC]";
  const eyebrowClassName = isCompleted
    ? "text-[11px] font-medium uppercase tracking-[2px] text-[#E4ECE7]"
    : "text-[11px] font-medium uppercase tracking-[2px] text-[#2E7D32]";
  const titleClassName = isCompleted
    ? "mt-2 text-[15px] font-semibold leading-5 text-white"
    : "mt-3 text-[25px] font-semibold leading-[35px] text-[#242828]";
  const descriptionClassName = isCompleted
    ? "mt-3 text-[18px] font-light leading-[22px] text-[#40493D]"
    : "mt-4 text-[18px] font-light leading-[22px] text-[#40493D]";

  return (
    <View className={cardClassName}>
      <View className="px-5 pb-5 pt-5">
        <Text className={eyebrowClassName}>{milestoneLabel}</Text>
        <Text className={titleClassName}>{goal.title?.trim() || " "}</Text>
        <Text className={descriptionClassName}>{description}</Text>

        {!isCompleted ? (
          <>
            {isMoneyGoal ? (
              <View className="mt-8 overflow-hidden rounded-[26px] border border-[#DCE6FA] bg-[#F5F8FF]">
                <View className="px-5 py-5">
                  <View className="flex-row items-start justify-between gap-4">
                    <View className="flex-1">
                      <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-[#5975C2]">
                        Aporte flex\u00EDvel em ETH
                      </Text>
                      <Text className="mt-3 text-[34px] font-semibold leading-[36px] text-[#224488]">{`\u039E ${displayPrice}`}</Text>
                      <Text className="mt-3 text-[14px] leading-[20px] text-[#5B6E97]">
                        Essa etapa aceita contribui\u00E7\u00F5es abertas. Voc\u00EA escolhe o valor e injeta liquidez
                        direto para a ONG.
                      </Text>
                    </View>

                    <View className="rounded-[18px] bg-white px-4 py-4">
                      <MaterialCommunityIcons name="ethereum" size={28} color="#315FCB" />
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View className="mt-8 rounded-[2px] bg-[#F8F9F6] px-4 py-5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[16px] font-semibold text-[#414846]">Tipo de item</Text>
                  <Text className="text-[16px] font-semibold text-[#414846]">Pre\u00E7o por un.</Text>
                </View>

                <View className="mt-6 flex-row items-start justify-between gap-4">
                  <Text className="flex-1 text-[16px] leading-[24px] text-[#86908A]">{itemLabel}</Text>
                  <View className="items-end">
                    <Text className="text-[25px] font-normal leading-[30px] text-[#2B5BB5]">{`\u039E ${displayPrice}`}</Text>
                    <Text className="mt-1 text-[10px] text-[#8A918D]">{`${progressPercentage}% conclu\u00EDdo`}</Text>
                  </View>
                </View>
              </View>
            )}

            <Pressable
              disabled={!onDonatePress}
              className="mt-8 overflow-hidden rounded-[20px] border border-[#D9F0D8] bg-[#2E7D32] shadow-sm"
              onPress={onDonatePress}
              style={({ pressed }) => (pressed ? { opacity: 0.92, transform: [{ scale: 0.995 }] } : undefined)}
            >
              <View className="min-h-[94px] flex-row items-center justify-center gap-3 px-1 py-1">
                <Text className="text-[23px] font-semibold text-white">Ir para doa\u00E7\u00E3o</Text>
                <MaterialCommunityIcons name="hand-heart-outline" size={32} color="#FFFFFF" />
              </View>
            </Pressable>

            <View className="mt-8 flex-row items-center justify-center gap-2">
              <MaterialCommunityIcons name="check-decagram-outline" size={14} color="#315FCB" />
              <Text className="text-[9px] font-medium tracking-[2px] text-[#2B5BB5]">{contractLabel}</Text>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}
