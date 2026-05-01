import { Image, Pressable, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { SkeletonBlock } from "../common/Skeleton";

const fallbackProjectImage = require("../../assets/adaptive-icon.png");
type Variant = "small" | "normal";

type ProjectCardProps = {
  title: string;
  progress: number;
  imageUrl: string | null;
  hasPendingDonations?: boolean;
  onViewProject: () => void;
  onAllocateDonations: () => void;
  variant?: Variant;
};

type ProjectCardSkeletonProps = {
  showPendingBadge?: boolean;
};

export function ProjectCard({
  title,
  progress,
  imageUrl,
  hasPendingDonations = false,
  onViewProject,
  onAllocateDonations,
  variant = "normal",
}: ProjectCardProps) {
  return (
    <View
      className="overflow-hidden rounded-[30px] border border-[#E8EFE8] bg-white px-4 py-4"
      style={{
        shadowColor: "#DDE5DD",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
        elevation: 3,
      }}
    >
      <View className="rounded-[24px] bg-[#F6F8F4] px-3 py-3">
        {hasPendingDonations && variant === "small" ? (
          <View className="mb-3 self-start rounded-full border border-[#F2D7A6] bg-[#FFF7E8] px-2.5 py-1">
            <Text className="text-[9px] font-bold uppercase tracking-[0.6px] text-[#B7791F]">Doações Pendentes</Text>
          </View>
        ) : hasPendingDonations ? (
          <View className="mb-3 self-start rounded-full border border-[#F2D7A6] bg-[#FFF7E8] px-3 py-1.5">
            <Text className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#B7791F]">Doações Pendentes</Text>
          </View>
        ) : null}

        <View className="flex-row items-start gap-4">
          <View
            className={`${variant === "small" ? "h-[70px] w-[70px]" : "h-[92px] w-[92px]"} overflow-hidden rounded-[22px] bg-[#E8EEF0]`}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <View className="h-full w-full items-center justify-center bg-[#EEF2EE]">
                <Image source={fallbackProjectImage} className="h-[38px] w-[38px]" resizeMode="contain" style={{ opacity: 0.2 }} />
              </View>
            )}
          </View>

          <View className="flex-1 pt-1">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className={`${variant === "small" ? "text-[16px]" : "text-[20px]"} font-semibold leading-6 text-[#202124]`}>
                  {title}
                </Text>
              </View>

              <View className="items-end">
                <Text
                  className={`${variant === "small" ? "text-[9px]" : "text-[11px]"} font-semibold uppercase tracking-[0.7px] text-[#8A968D]`}
                >
                  Progresso
                </Text>
                <Text
                  className={`${variant === "small" ? "mt-0.5 text-[16px]" : "mt-1 text-[20px]"} font-semibold text-[#202124]`}
                >
                  {`${progress}%`}
                </Text>
              </View>
            </View>

            <View className="mt-5">
              <View className="h-[8px] overflow-hidden rounded-full bg-[#E3E8E2]">
                <View className="h-full rounded-full bg-[#2F7D32]" style={{ width: `${progress}%` }} />
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-3">
        <Pressable
          onPress={onViewProject}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-[18px] border border-[#DFE8E0] bg-[#FCFDFC] px-4 py-3.5"
          style={({ pressed }) => (pressed ? { opacity: 0.82 } : undefined)}
        >
          <Ionicons name="arrow-forward" size={16} color="#2F7D32" />
          <Text className="text-[13px] font-semibold text-[#2F7D32]">Ver projeto</Text>
        </Pressable>

        <Pressable
          onPress={onAllocateDonations}
          className="flex-row items-center justify-center gap-2 rounded-[18px] bg-[#2F7D32] px-4 py-3.5"
          style={({ pressed }) => (pressed ? { opacity: 0.88 } : undefined)}
        >
          <MaterialCommunityIcons name="hand-heart-outline" size={16} color="#FFFFFF" />
          <Text className="text-[13px] font-semibold text-white">Alocar</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ProjectCardSkeleton({ showPendingBadge = false }: ProjectCardSkeletonProps) {
  return (
    <View
      className="overflow-hidden rounded-[30px] border border-[#E8EFE8] bg-white px-4 py-4"
      style={{
        shadowColor: "#DDE5DD",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
        elevation: 3,
      }}
    >
      <View className="rounded-[24px] bg-[#F6F8F4] px-3 py-3">
        {showPendingBadge ? <SkeletonBlock width={132} height={28} borderRadius={999} /> : null}

        <View className={`flex-row items-start gap-4 ${showPendingBadge ? "mt-3" : ""}`}>
          <SkeletonBlock width={92} height={92} borderRadius={22} />
          <View className="flex-1 pt-1">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-2">
                <SkeletonBlock width="84%" height={22} borderRadius={999} />
                <SkeletonBlock width="56%" height={22} borderRadius={999} />
              </View>
              <View className="items-end gap-2">
                <SkeletonBlock width={68} height={12} borderRadius={999} />
                <SkeletonBlock width={34} height={22} borderRadius={999} />
              </View>
            </View>

            <View className="mt-5">
              <SkeletonBlock width="100%" height={8} borderRadius={999} />
            </View>
          </View>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-3">
        <SkeletonBlock width="100%" height={50} borderRadius={18} className="flex-1" />
        <SkeletonBlock width={108} height={50} borderRadius={18} />
      </View>
    </View>
  );
}
