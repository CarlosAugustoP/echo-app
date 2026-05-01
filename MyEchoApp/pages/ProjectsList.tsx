import { useEffect, useMemo, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View } from "react-native";

import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { PageHeader } from "../components/common/PageHeader";
import { AppLayout } from "../components/layout/AppLayout";
import { ProjectCard, ProjectCardSkeleton } from "../components/project/ProjectCard";
import type { ProjectsListScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import type { PaginatedList, ProjectDto, QueryParams } from "../types/api";

const PAGE_SIZE = 10;
const INITIAL_PAGE_NUMBER = 0;

type NgoProjectListItem = {
  id: string;
  title: string;
  progress: number;
  imageUrl: string | null;
  hasPendingDonations: boolean;
};

function buildQuery(pageNumber: number): QueryParams {
  return {
    pageNumber,
    pageSize: PAGE_SIZE,
  };
}

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

function buildProjectListItem(project: ProjectDto): NgoProjectListItem {
  return {
    id: project.id,
    title: truncateText(project.title, 36),
    progress: normalizeProgress(project.progress),
    imageUrl: normalizeImageUrl(project.mainImage),
    hasPendingDonations: project.hasPendingDonations,
  };
}

function EmptySectionState({ message }: { message: string }) {
  return (
    <View className="rounded-[22px] border border-[#E7ECE8] bg-[#FBFCFB] px-4 py-4">
      <Text className="text-[13px] leading-5 text-[#6F7A75]">{message}</Text>
    </View>
  );
}

export default function ProjectsListPage({ navigation, route }: ProjectsListScreenProps) {
  const [pageState, setPageState] = useState<PaginatedList<ProjectDto> | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      try {
        setIsLoadingInitial(true);
        setErrorMessage("");

        const projectsResult = await apiClient.getProjectsByManager(route.params.managerId, buildQuery(INITIAL_PAGE_NUMBER));

        if (!isMounted) {
          return;
        }

        setProjects(projectsResult.items);
        setPageState(projectsResult);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setProjects([]);
        setPageState(null);
        setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os projetos.");
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }
    };

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, [route.params.managerId]);

  const projectCards = useMemo(() => projects.map(buildProjectListItem), [projects]);
  const hasMorePages = pageState ? pageState.currentPage < pageState.totalPages : false;

  const handleLoadMore = async () => {
    if (!pageState || isLoadingInitial || isLoadingMore || !hasMorePages) {
      return;
    }

    try {
      setIsLoadingMore(true);

      const nextPage = pageState.currentPage + 1;
      const result = await apiClient.getProjectsByManager(route.params.managerId, buildQuery(nextPage));

      setProjects((currentValue) => [...currentValue, ...result.items]);
      setPageState(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar mais projetos.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (distanceFromBottom <= 180) {
      void handleLoadMore();
    }
  };

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="projetos">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 pb-10"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
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
          {isLoadingInitial
            ? Array.from({ length: 4 }).map((_, index) => <ProjectCardSkeleton key={`projects-list-skeleton-${index}`} />)
            : projectCards.length > 0
              ? projectCards.map((project) => (
                  <ProjectCard
                    key={project.id}
                    title={project.title}
                    progress={project.progress}
                    imageUrl={project.imageUrl}
                    hasPendingDonations={project.hasPendingDonations}
                    onViewProject={() => navigation.navigate("ProjectDetails", { projectId: project.id })}
                    onAllocateDonations={() =>
                      navigation.navigate("PendingProjectDonations", {
                        projectId: project.id,
                        projectTitle: project.title,
                      })
                    }
                  />
                ))
              : <EmptySectionState message="Assim que voce criar seus projetos, eles aparecerao aqui." />}
        </View>

        {isLoadingMore && !isLoadingInitial && !errorMessage ? (
          <View className="items-center justify-center py-3">
            <LoadingSpinner
              className="items-center justify-center"
              label="Carregando mais projetos..."
              labelClassName="mt-3 text-[12px] text-[#7A8480]"
              size="small"
            />
          </View>
        ) : null}
      </ScrollView>
    </AppLayout>
  );
}
