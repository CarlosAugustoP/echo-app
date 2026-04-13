import { Text, View } from "react-native";

type SectionCardProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function SectionCard({ eyebrow, title, description }: SectionCardProps) {
  const hasContent = Boolean((title ?? "").trim() || (description ?? "").trim() || (eyebrow ?? "").trim());

  return (
    <View className="rounded-[22px] bg-white px-4 py-4">
      {hasContent ? (
        <View className="gap-2">
          {eyebrow ? (
            <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#9BA3AF]">{eyebrow}</Text>
          ) : null}
          <Text className="text-[20px] font-semibold leading-6 text-[#202124]">{title || " "}</Text>
          <Text className="text-[13px] leading-5 text-[#667085]">{description || " "}</Text>
        </View>
      ) : (
        <View className="min-h-[96px] rounded-[18px] bg-white" />
      )}
    </View>
  );
}
