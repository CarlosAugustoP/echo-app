import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { SkeletonBlock } from "../common/Skeleton";
import { SectionTitle } from "./SectionTitle";

const defaultProjectImage = require("../../assets/adaptive-icon.png");

export type ProjectTheme = "education" | "forest" | "water";

export type ProjectData = {
  id?: string;
  title: string;
  progressLabel: string;
  goal: string;
  progress: number;
  imageUrl?: string | null;
  theme: ProjectTheme;
};

type ProjectCarouselProps = {
  title: string;
  projects: readonly ProjectData[];
  compact?: boolean;
  onProjectPress?: (project: ProjectData) => void;
  isLoading?: boolean;
};

function ProjectCard({
  title,
  progressLabel,
  goal,
  progress,
  imageUrl,
  theme,
  compact = false,
  onPress,
}: ProjectData & { compact?: boolean; onPress?: () => void }) {
  const progressColor = theme === "forest" ? "#4F923E" : theme === "water" ? "#4D88DB" : "#3263D0";
  const cardWidthClass = compact ? "w-[220px]" : "w-[290px]";
  const imageHeightClass = compact ? "h-[148px]" : "h-[170px]";
  const normalizedImageUrl = imageUrl?.trim();

  return (
    <Pressable
      onPress={onPress}
      className={`mr-3 rounded-[28px] bg-[#F2F4F3] p-4 ${cardWidthClass}`}
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.988 }] } : undefined)}
    >
      <View className={`overflow-hidden rounded-[22px] ${imageHeightClass}`}>
        {normalizedImageUrl ? (
          <Image source={{ uri: normalizedImageUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center bg-[#EEF2EE]">
            <Image
              source={defaultProjectImage}
              className="h-[74px] w-[74px]"
              resizeMode="contain"
              style={{ opacity: 0.18 }}
            />
          </View>
        )}
      </View>

    <View className="gap-3 px-1 pt-4">
        <Text className="text-[18px] font-bold text-[#202124]">{title}</Text>
        <View className="h-[5px] overflow-hidden rounded-full bg-[#E4E7E5]">
          <View className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: progressColor }} />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-[12px] font-bold" style={{ color: progressColor }}>
          {progressLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function ProjectCardSkeleton({ compact = false }: { compact?: boolean }) {
  const cardWidthClass = compact ? "w-[220px]" : "w-[290px]";
  const imageHeight = compact ? 148 : 170;

  return (
    <View className={`mr-3 rounded-[28px] bg-[#F2F4F3] p-4 ${cardWidthClass}`}>
      <SkeletonBlock height={imageHeight} borderRadius={22} />
      <View className="gap-3 px-1 pt-4">
        <SkeletonBlock height={20} width="72%" borderRadius={999} />
        <SkeletonBlock height={5} width="100%" borderRadius={999} />
        <View className="flex-row items-center justify-between gap-3">
          <SkeletonBlock height={12} width="38%" borderRadius={999} />
          <SkeletonBlock height={12} width="30%" borderRadius={999} />
        </View>
      </View>
    </View>
  );
}

export function ProjectCarousel({ title, projects, compact = false, onProjectPress, isLoading = false }: ProjectCarouselProps) {
  return (
    <View className="gap-4">
      <SectionTitle>{title}</SectionTitle>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        {isLoading
          ? Array.from({ length: compact ? 3 : 2 }).map((_, index) => (
              <ProjectCardSkeleton key={`project-skeleton-${index}`} compact={compact} />
            ))
          : projects.map((project) => (
              <ProjectCard
                key={project.id ?? `${project.title}-${project.goal}`}
                compact={compact}
                {...project}
                onPress={onProjectPress ? () => onProjectPress(project) : undefined}
              />
            ))}
      </ScrollView>
    </View>
  );
}
