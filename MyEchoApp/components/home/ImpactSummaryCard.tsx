import { Text, View } from "react-native";

import { SkeletonBlock } from "../common/Skeleton";

type ImpactSummaryCardProps = {
  impactedLives: string;
  helper: string;
  description: string;
  isLoading?: boolean;
};

export function ImpactSummaryCard({
  impactedLives,
  helper,
  description,
  isLoading = false,
}: ImpactSummaryCardProps) {
  if (isLoading) {
    return (
      <View className="rounded-[28px] border border-[#E8EDE8] bg-white px-5 py-5">
        <SkeletonBlock height={10} width="28%" borderRadius={999} />
        <View className="mt-3 flex-row items-end gap-2">
          <SkeletonBlock height={56} width={92} borderRadius={20} />
          <SkeletonBlock height={16} width={56} borderRadius={999} />
        </View>
        <View className="mt-3 gap-2">
          <SkeletonBlock height={13} width="96%" borderRadius={999} />
          <SkeletonBlock height={13} width="72%" borderRadius={999} />
        </View>
        <View className="mt-4">
          <SkeletonBlock height={32} width={132} borderRadius={999} />
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-[28px] border border-[#E8EDE8] bg-white px-5 py-5">
      <Text className="text-[10px] font-semibold uppercase text-[#707A6C]">LIVES IMPACTED</Text>
      <View className="mt-1 flex-row items-end gap-2">
        <Text className="text-[52px] leading-[56px] text-[#206223]">{impactedLives}</Text>
        <Text className="mb-2 text-[14px] font-semibold text-[#6B736E]">{helper}</Text>
      </View>
      <Text className="mt-1 text-[13px] leading-5 text-[#40493D]">{description}</Text>
      <View className="mt-4 self-start rounded-full bg-[#E8F4E7] px-3 py-2">
        <Text className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#4E8B44]">+ MEASURED IMPACT</Text>
      </View>
    </View>
  );
}
