import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { SkeletonBlock } from "../components/common/Skeleton";
import { PageHeader } from "../components/common/PageHeader";
import { AppLayout } from "../components/layout/AppLayout";
import type { ProjectsListScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import type { ProjectDto } from "../types/api";

const fallbackProjectImage = require("../assets/adaptive-icon.png");

type NgoProjectListItem = {
  id: string;
  title: string;
  category: string;
  progress: number;
  imageUrl: string | null;
};

function parseSafeNumber(value: number | string | undefined | null) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeProgress(progress: number | string | undefined | null) {
  const numericValue = parseSafeNumber(progress);
  const normalizedValue = numericValue <= 1 ? numericValue * 100 : numericValue;
  return Math.max(0, Math.min(100, Math.round(normalizedValue)));
}

function normalizeImageUrl(imageUrl?: string | null) {
  const normalizedValue = imageUrl?.trim();
  return normalizedValue ? normalizedValue : null;
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function getProjectCategory(project: ProjectDto) {
  const primaryGoalType = project.goals[0]?.goalType?.name?.trim();

  if (!primaryGoalType) {
    return "PROJETO";
  }

  return primaryGoalType.toUpperCase();
}

function buildProjectListItem(project: ProjectDto): NgoProjectListItem {
  return {
    id: project.id,
    title: project.title,
    category: getProjectCategory(project),
    progress: normalizeProgress(project.progress),
    imageUrl: normalizeImageUrl(project.mainImage),
  };
}

function NgoListItem({
  title,
  progress,
  imageUrl,
  onPress,
}: {
  title: string;
  progress: number;
  imageUrl: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-[26px] border border-[#EEF1EC] bg-white px-4 py-4"
      style={({ pressed }) => [
        {
          shadowColor: "#DDE5DD",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 2,
        },
        pressed ? { opacity: 0.82 } : undefined,
      ]}
    >
      <View className="flex-row items-start gap-4">
        <View className="h-[106px] w-[106px] overflow-hidden rounded-[18px] bg-[#E8EEF0]">
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center bg-[#EEF2EE]">
              <Image source={fallbackProjectImage} className="h-[42px] w-[42px]" resizeMode="contain" style={{ opacity: 0.2 }} />
            </View>
          )}
        </View>

        <View className="flex-1 pt-1">
          <Text className="text-[18px] font-semibold leading-6 text-[#202124]">{truncateText(title, 28)}</Text>

          <View className="mt-7 gap-1.5">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-[12px] font-medium text-[#4D5551]">Progresso</Text>
              <Text className="text-[12px] font-medium text-[#4D5551]">{`${progress}%`}</Text>
            </View>
            <View className="h-[7px] overflow-hidden rounded-full bg-[#E5E7E4]">
              <View className="h-full rounded-full bg-[#355FCE]" style={{ width: `${progress}%` }} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function NgoListSkeleton() {
  return (
    <View
      className="rounded-[26px] border border-[#EEF1EC] bg-white px-4 py-4"
      style={{
        shadowColor: "#DDE5DD",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start gap-4">
        <SkeletonBlock width={106} height={106} borderRadius={18} />
        <View className="flex-1 pt-1">
          <SkeletonBlock width="78%" height={22} borderRadius={999} />
          <View className="mt-8 gap-1.5">
            <View className="flex-row items-center justify-between gap-3">
              <SkeletonBlock width={68} height={12} borderRadius={999} />
              <SkeletonBlock width={28} height={12} borderRadius={999} />
            </View>
            <SkeletonBlock width="100%" height={7} borderRadius={999} />
          </View>
        </View>
      </View>
    </View>
  );
}

function EmptySectionState({ message }: { message: string }) {
  return (
    <View className="rounded-[22px] border border-[#E7ECE8] bg-[#FBFCFB] px-4 py-4">
      <Text className="text-[13px] leading-5 text-[#6F7A75]">{message}</Text>
    </View>
  );
}

export default function ProjectsListPage({ navigation, route }: ProjectsListScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const projectsResult = await apiClient.getProjectsByManager(route.params.managerId, {
          pageSize: 100,
          pageNumber: 0,
        });

        if (!isMounted) {
          return;
        }

        setProjects(projectsResult.items);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setProjects([]);
        setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os projetos.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, [route.params.managerId]);

  const projectCards = useMemo(() => projects.map(buildProjectListItem), [projects]);

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="inicio">
      <ScrollView className="flex-1" contentContainerClassName="gap-6 pb-10" showsVerticalScrollIndicator={false}>
        <PageHeader
          eyebrow="PROJETOS"
          title="Seus projetos"
          description="Veja todos os projetos da sua organizacao em uma lista simples."
          backLabel="Voltar"
          onBackPress={() => navigation.goBack()}
        />

        {errorMessage ? (
          <View className="rounded-[24px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-4">
            <Text className="text-[15px] font-semibold text-[#A33A3A]">Nao foi possivel carregar os projetos</Text>
            <Text className="mt-2 text-[13px] leading-5 text-[#8B5B5B]">{errorMessage}</Text>
          </View>
        ) : null}

        <View className="gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => <NgoListSkeleton key={`projects-list-skeleton-${index}`} />)
            : projectCards.length > 0
              ? projectCards.map((project) => (
                  <NgoListItem
                    key={project.id}
                    title={project.title}
                    progress={project.progress}
                    imageUrl={project.imageUrl}
                    onPress={() => navigation.navigate("ProjectDetails", { projectId: project.id })}
                  />
                ))
              : <EmptySectionState message="Assim que voce criar seus projetos, eles aparecerao aqui." />}
        </View>
      </ScrollView>
    </AppLayout>
  );
}
