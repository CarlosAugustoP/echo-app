import { Image, Text, View } from "react-native";

import type { ProjectBlogPostHeaderDto } from "../../types/api";
import { defaultProjectImage, formatRelativeTime, normalizeImageUrl } from "./projectDetailsUtils";

type ProjectUpdateCardProps = {
  blogPost: ProjectBlogPostHeaderDto;
};

export function ProjectUpdateCard({ blogPost }: ProjectUpdateCardProps) {
  const headerImageUrl = normalizeImageUrl(blogPost.headerImage);

  return (
    <View className="overflow-hidden rounded-[22px] bg-white">
      {headerImageUrl ? (
        <Image source={{ uri: headerImageUrl }} className="h-[180px] w-full" resizeMode="cover" />
      ) : (
        <View className="h-[180px] w-full items-center justify-center bg-[#EEF2EE]">
          <Image
            source={defaultProjectImage}
            className="h-[84px] w-[84px]"
            resizeMode="contain"
            style={{ opacity: 0.18 }}
          />
        </View>
      )}

      <View className="gap-2 px-4 py-4">
        <View className="flex-row items-center gap-2">
          <View className="rounded-full bg-[#4A73D9] px-2 py-1">
            <Text className="text-[9px] font-bold uppercase text-white">ATUALIZACAO</Text>
          </View>
          <Text className="text-[11px] font-medium text-[#8A93A0]">{formatRelativeTime(blogPost.createdAt)}</Text>
        </View>
        <Text className="text-[22px] font-semibold leading-7 text-[#202124]">{blogPost.title?.trim() || " "}</Text>
        <Text className="text-[13px] leading-5 text-[#667085]">{blogPost.first100CharsOfContent?.trim() || " "}</Text>
      </View>
    </View>
  );
}
