import { Image, Pressable, ScrollView, Text, View } from "react-native";

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
  tag?: string;
  remaining?: string;
  theme: ProjectTheme;
};

type ProjectCarouselProps = {
  title: string;
  projects: readonly ProjectData[];
  compact?: boolean;
  onProjectPress?: (project: ProjectData) => void;
};

function ProjectCard({
  title,
  progressLabel,
  goal,
  progress,
  imageUrl,
  tag,
  remaining,
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
        {tag ? (
          <View className="absolute right-3 top-3 rounded-full bg-white px-3 py-2 shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
            <Text className="text-[12px] font-bold text-[#4A4134]">{tag}</Text>
          </View>
        ) : null}
        {remaining ? (
          <View className="absolute right-3 top-3 rounded-full bg-[#3F6E3C] px-3 py-2">
            <Text className="text-[10px] font-bold uppercase tracking-[0.2px] text-white">{remaining}</Text>
          </View>
        ) : null}
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
          <Text className="text-[12px] text-[#6D7470]">{goal}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function ProjectCarousel({ title, projects, compact = false, onProjectPress }: ProjectCarouselProps) {
  return (
    <View className="gap-4">
      <SectionTitle>{title}</SectionTitle>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        {projects.map((project) => (
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
