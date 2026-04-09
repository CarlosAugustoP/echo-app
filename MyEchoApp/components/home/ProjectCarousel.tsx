import { Image, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

import { SectionTitle } from "./SectionTitle";

export type ProjectTheme = "education" | "forest" | "water";

export type ProjectData = {
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
};

function EducationIllustration() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 280 180">
      <Rect x="0" y="0" width="280" height="180" rx="20" fill="#FCE8CD" />
      <Ellipse cx="60" cy="48" rx="28" ry="18" fill="#F3D7B5" opacity="0.65" />
      <Ellipse cx="228" cy="30" rx="26" ry="14" fill="#F5DFC2" opacity="0.6" />
      <Ellipse cx="140" cy="162" rx="86" ry="14" fill="#E7D0B4" />

      <Circle cx="88" cy="58" r="18" fill="#F4C9A2" />
      <Path d="M71 79c7-10 27-10 34 0v41H71z" fill="#D9774B" />
      <Path d="M52 103l34-9 21 18-36 9z" fill="#65836F" />
      <Path d="M86 94l34 9-14 18-34-9z" fill="#F8F1E3" />
      <Path d="M82 49c6-9 21-11 29-3" stroke="#3B2A2F" strokeWidth="6" strokeLinecap="round" />
      <Path d="M80 57c4 7 12 9 18 9" stroke="#3B2A2F" strokeWidth="3" strokeLinecap="round" />

      <Circle cx="140" cy="78" r="24" fill="#F6C6A4" />
      <Path d="M110 108c10-18 49-18 60 0v48h-60z" fill="#5B7262" />
      <Path d="M92 118l48-14 22 24-51 13z" fill="#E7D6B1" />
      <Path d="M140 104l48 14-19 23-51-13z" fill="#FFF7E8" />
      <Path
        d="M116 67c6-17 32-24 46-11 9 8 8 26 2 34-3-10-12-16-25-16-10 0-18 3-25 9 0-7-1-12 2-16z"
        fill="#2F2537"
      />

      <Circle cx="214" cy="66" r="18" fill="#F1C5A3" />
      <Path d="M194 88c8-10 32-10 40 0v36h-40z" fill="#6E8B74" />
      <Path d="M204 97l28-6 9 26-29 5z" fill="#C67954" />
      <Path d="M210 49c7-8 23-8 30 1" stroke="#53383C" strokeWidth="6" strokeLinecap="round" />
    </Svg>
  );
}

function ForestIllustration() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 280 180">
      <Rect x="0" y="0" width="280" height="180" rx="20" fill="#D7F0D9" />
      <Rect x="0" y="122" width="280" height="58" fill="#A4CC8E" />
      <Ellipse cx="144" cy="150" rx="70" ry="16" fill="#8E6E4E" />
      <Path d="M135 86c-11 0-22 8-26 18-4 9-4 20 0 28h62c4-8 4-19 0-28-4-10-15-18-26-18h-10z" fill="#7A5636" />
      <Rect x="132" y="86" width="16" height="42" rx="8" fill="#A6784F" />
      <Path d="M140 28c-28 14-39 40-36 58 20-8 31-2 36 7 8-17 23-25 43-21-4-22-15-39-43-44z" fill="#3D8748" />
      <Path d="M88 124c6-30 38-54 75-54" stroke="#F3F9EF" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
      <Circle cx="207" cy="54" r="24" fill="#EEF9EF" opacity="0.85" />
      <Path d="M199 104c-20 8-33 20-41 36" stroke="#4D8F52" strokeWidth="4" strokeLinecap="round" />
      <Path d="M165 114c16 7 25 17 33 30" stroke="#4D8F52" strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
}

function WaterIllustration() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 280 180">
      <Rect x="0" y="0" width="280" height="180" rx="20" fill="#DAEDFD" />
      <Circle cx="232" cy="40" r="20" fill="#EFF8FF" opacity="0.85" />
      <Path d="M0 112c26-16 57-18 92-6 38 13 70 13 105 0 30-12 57-12 83 0v74H0z" fill="#69A3E7" />
      <Path d="M0 128c24-10 51-10 82 0 43 14 85 14 126 0 28-9 53-9 72 0v58H0z" fill="#4C86CF" />
      <Path d="M137 38c-17 22-26 39-26 51 0 16 13 29 29 29s29-13 29-29c0-12-9-29-26-51-1-2-4-2-6 0z" fill="#3A83D6" />
      <Path d="M136 52c-8 12-11 22-11 31 0 10 8 18 18 18" stroke="#D7EBFF" strokeWidth="5" strokeLinecap="round" />
      <Ellipse cx="138" cy="149" rx="58" ry="10" fill="#356DAF" opacity="0.5" />
    </Svg>
  );
}

function ProjectIllustration({ theme }: { theme: ProjectTheme }) {
  if (theme === "education") {
    return <EducationIllustration />;
  }

  if (theme === "forest") {
    return <ForestIllustration />;
  }

  return <WaterIllustration />;
}

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
}: ProjectData & { compact?: boolean }) {
  const progressColor = theme === "forest" ? "#4F923E" : theme === "water" ? "#4D88DB" : "#3263D0";
  const cardWidthClass = compact ? "w-[220px]" : "w-[290px]";
  const imageHeightClass = compact ? "h-[148px]" : "h-[170px]";

  return (
    <Pressable
      className={`mr-3 rounded-[28px] bg-[#F2F4F3] p-4 ${cardWidthClass}`}
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.988 }] } : undefined)}
    >
      <View className={`overflow-hidden rounded-[22px] ${imageHeightClass}`}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <ProjectIllustration theme={theme} />
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

export function ProjectCarousel({ title, projects, compact = false }: ProjectCarouselProps) {
  return (
    <View className="gap-4">
      <SectionTitle>{title}</SectionTitle>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        {projects.map((project) => (
          <ProjectCard key={`${project.title}-${project.goal}`} compact={compact} {...project} />
        ))}
      </ScrollView>
    </View>
  );
}
