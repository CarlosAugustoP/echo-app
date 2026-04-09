import { Text, View } from "react-native";

type ImpactSummaryCardProps = {
  impactedLives: string;
  helper: string;
  description: string;
};

export function ImpactSummaryCard({
  impactedLives,
  helper,
  description,
}: ImpactSummaryCardProps) {
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
