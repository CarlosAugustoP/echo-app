import { Text, View } from "react-native";

import { LoadingSpinner } from "./LoadingSpinner";
import { SkeletonBlock } from "./Skeleton";

type StateCardProps = {
  kind: "loading" | "error";
  message: string;
  title?: string;
  minHeightClassName?: string;
};

export function StateCard({ kind, message, title, minHeightClassName }: StateCardProps) {
  if (kind === "loading") {
    return (
      <View className={`rounded-[22px] bg-white px-4 py-5 ${minHeightClassName ?? ""}`.trim()}>
        <View className="gap-3">
          <SkeletonBlock height={16} width="42%" borderRadius={999} />
          <SkeletonBlock height={14} width="88%" borderRadius={999} />
          <SkeletonBlock height={14} width="64%" borderRadius={999} />
          {message ? <Text className="pt-1 text-[13px] text-[#8A948E]">{message}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-[22px] border border-[#F2C9C9] bg-[#FFF4F4] px-4 py-4">
      {title ? <Text className="text-[15px] font-semibold text-[#A33A3A]">{title}</Text> : null}
      <Text className={`${title ? "mt-2 " : ""}text-[14px] leading-5 text-[#A33A3A]`}>{message}</Text>
    </View>
  );
}
