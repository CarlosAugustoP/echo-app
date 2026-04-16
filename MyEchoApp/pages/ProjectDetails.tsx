import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { Button } from "../components/common/Button";
import { AppLayout } from "../components/layout/AppLayout";
import { MilestoneCard } from "../components/project-details/MilestoneCard";
import { NgoInfoCard } from "../components/project-details/NgoInfoCard";
import { ProjectImageCarousel } from "../components/project-details/ProjectImageCarousel";
import { ProjectUpdateCard } from "../components/project-details/ProjectUpdateCard";
import { SectionCard } from "../components/project-details/SectionCard";
import { TransparencyProtocolDropdown } from "../components/project-details/TransparencyProtocolDropdown";
import {
  defaultProjectImage,
  normalizeImageUrl,
  normalizeProgress,
  sumGoalAmounts,
} from "../components/project-details/projectDetailsUtils";
import { ProjectDetailsScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import type { GoalDto, ProjectBlogPostHeaderDto, ProjectDto, UserDto } from "../types/api";

export default function ProjectDetailsPage({ navigation, route }: ProjectDetailsScreenProps) {
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [manager, setManager] = useState<UserDto | null>(null);
  const [blogPosts, setBlogPosts] = useState<ProjectBlogPostHeaderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);

  useEffect(() => {
    setIsDescriptionExpanded(false);
    setIsDescriptionTruncated(false);
    setManager(null);

    let isMounted = true;

    const loadProject = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const [projectResult, blogPostsResult] = await Promise.all([
          apiClient.getProjectById(route.params.projectId),
          apiClient.getBlogPosts(route.params.projectId, { pageSize: 3 }),
        ]);
        let managerResult: UserDto | null = null;

        try {
          managerResult = await apiClient.getUserById(projectResult.managerId);
        } catch {
          managerResult = null;
        }

        if (isMounted) {
          setProject(projectResult);
          setManager(managerResult);
          setBlogPosts(blogPostsResult.items);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "We couldn't load this project right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProject();

    return () => {
      isMounted = false;
    };
  }, [route.params.projectId]);

  const goals = project?.goals ?? [];
  const targetAmount = useMemo(() => sumGoalAmounts(goals, "targetAmount"), [goals]);
  const currentAmount = useMemo(() => sumGoalAmounts(goals, "currentAmount"), [goals]);
  const totalProgressValue = Number(project?.progress);
  const totalProgress = Number.isFinite(totalProgressValue)
    ? Math.max(0, Math.min(100, Math.round(totalProgressValue <= 1 ? totalProgressValue * 100 : totalProgressValue)))
    : normalizeProgress(currentAmount, targetAmount);
  const mainImageUrl = normalizeImageUrl(project?.mainImage);
  const galleryImages = [project?.mainImage, ...(project?.images ?? [])];
  const hasGalleryImages = galleryImages.some((image) => Boolean(normalizeImageUrl(image)));
  const projectDescription = project?.description?.trim() || " ";
  const managerImageUrl = normalizeImageUrl(manager?.profilePicture?.url ?? null);
  const managerName = manager?.name?.trim() || project?.createdByName?.trim() || " ";
  const managerDescription =
    manager?.description?.trim() ||
    manager?.bio?.trim() ||
    project?.description?.trim() ||
    " ";

  const handleOpenDonation = (goal: GoalDto, goalIndex: number) => {
    navigation.navigate("DonationDetails", {
      projectId: project?.id ?? route.params.projectId,
      projectTitle: project?.title?.trim() || "Projeto",
      goal,
      goalIndex,
      smartContractAddress: project?.smartContractAddress ?? null,
    });
  };

  const handleOpenPrimaryDonation = () => {
    const firstOpenGoalIndex = goals.findIndex((goal) => {
      const progressValue = Number(goal.progress);
      const normalizedProgress = Number.isFinite(progressValue)
        ? Math.max(0, Math.min(100, Math.round(progressValue <= 1 ? progressValue * 100 : progressValue)))
        : 0;
      const targetAmountValue = Number(goal.targetAmount);
      const currentAmountValue = Number(goal.currentAmount);
      const hasFiniteTarget = Number.isFinite(targetAmountValue) && targetAmountValue > 0;
      const hasFiniteCurrent = Number.isFinite(currentAmountValue);
      const isCompleted =
        normalizedProgress >= 100 || (hasFiniteTarget && hasFiniteCurrent && currentAmountValue >= targetAmountValue);

      return !isCompleted;
    });

    if (firstOpenGoalIndex < 0) {
      return;
    }

    handleOpenDonation(goals[firstOpenGoalIndex], firstOpenGoalIndex);
  };

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="inicio">
      <ScrollView className="flex-1" contentContainerClassName="gap-6 pb-10" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-3">
            <Pressable
              className="flex-row items-center gap-2 self-start"
              onPress={() => navigation.goBack()}
              style={({ pressed }) => (pressed ? { opacity: 0.72 } : undefined)}
            >
              <Ionicons name="arrow-back" size={16} color="#7D8A86" />
              <Text className="text-md font-semibold uppercase tracking-[1px] text-[#206223]">
                Conheca o projeto
              </Text>
            </Pressable>

            <View className="gap-2">
              <Text className="text-[34px] font-semibold leading-9 text-[#202124]">
                {project?.title?.trim() || " "}
              </Text>
              
            </View>
            <Text>
                Por {project?.createdByName}
            </Text>
          </View>

          <View className="mt-10 h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF6EE]">
            <MaterialCommunityIcons name="hand-heart-outline" size={22} color="#2F7D32" />
          </View>
        </View>

        <View className="overflow-hidden rounded-[24px] bg-[#EEF2EE]">
          {mainImageUrl ? (
            <Image source={{ uri: mainImageUrl }} className="h-[212px] w-full" resizeMode="cover" />
          ) : (
            <View className="h-[212px] w-full items-center justify-center bg-[#EEF2EE]">
              <Image
                source={defaultProjectImage}
                className="h-[92px] w-[92px]"
                resizeMode="contain"
                style={{ opacity: 0.18 }}
              />
            </View>
          )}

          <View className="absolute bottom-4 left-4 right-4 rounded-[18px] bg-white/95 px-4 py-3">
            <Text className="text-[9px] font-normal uppercase tracking-[1px] text-[#94A3B8]">
              Acumulado at&eacute; agora
            </Text>
            <View className="mt-2">
              <Text className="text-[30px] font-bold leading-8 text-[#2F7D32]">{totalProgress}%</Text>
              <View className="mt-3 h-[6px] overflow-hidden rounded-full bg-[#E4E7E5]">
                <View className="h-full rounded-full bg-[#2F7D32]" style={{ width: `${totalProgress}%` }} />
              </View>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View className="rounded-[22px] bg-white px-4 py-5">
            <Text className="text-[14px] text-[#667085]">Carregando projeto...</Text>
          </View>
        ) : null}

        {loadError ? (
          <View className="rounded-[22px] border border-[#F2C9C9] bg-[#FFF4F4] px-4 py-4">
            <Text className="text-[14px] leading-5 text-[#A33A3A]">{loadError}</Text>
          </View>
        ) : null}

        <View className="overflow-hidden rounded-[18px] border border-[#EEF1EB] bg-white px-4 py-6">
          <Text className="text-[20px] font-semibold leading-6 text-[#202124]">Sobre o projeto</Text>
          <Text
            className="mt-[10px] text-[18px] leading-[18px] text-[#525B57]"
            numberOfLines={isDescriptionExpanded ? undefined : 5}
            onTextLayout={({ nativeEvent }) => {
              if (isDescriptionExpanded) {
                return;
              }

              setIsDescriptionTruncated(nativeEvent.lines.length > 5);
            }}
          >
            {projectDescription}
          </Text>

          {isDescriptionTruncated ? (
            <Pressable
              className="mt-1 self-end"
              onPress={() => setIsDescriptionExpanded((currentValue) => !currentValue)}
              style={({ pressed }) => (pressed ? { opacity: 0.72 } : undefined)}
            >
              <Text className="text-[12px] font-semibold leading-[18px] text-[#202124]">
                {isDescriptionExpanded ? "ver menos" : "ver mais"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View className="overflow-hidden rounded-[18px] border border-[#EEF1EB] bg-white px-4 py-6">
          <Text className="text-[20px] font-semibold leading-6 text-[#202124]">Metas do projeto</Text>

          <View className="mt-4 gap-3">
            {goals.length > 0 ? (
              goals.map((goal, index) => (
                <MilestoneCard
                  key={goal.id}
                  goal={goal}
                  index={index}
                  contractAddress={project?.smartContractAddress}
                  onDonatePress={() => handleOpenDonation(goal, index)}
                />
              ))
            ) : (
              <SectionCard />
            )}
          </View>
        </View>

        <TransparencyProtocolDropdown contractAddress={project?.smartContractAddress} />

        <NgoInfoCard name={managerName} description={managerDescription} imageUrl={managerImageUrl} />
       
        {hasGalleryImages && (
          <View className="gap-3">
            <Text className="text-[24px] font-semibold leading-7 text-[#202124]">Observe seu impacto em ação</Text>
            <ProjectImageCarousel images={galleryImages} />
            <Button
              label="Doar agora"
              onPress={handleOpenPrimaryDonation}
              className="min-h-[60px] rounded-[18px]"
              textClassName="text-[17px]"
              rightIcon={<MaterialCommunityIcons name="hand-heart-outline" size={18} color="#FFFFFF" />}
            />
          </View>
        )}

        {blogPosts.length > 0 && (
          <View className="gap-3">
            <Text className="text-[24px] font-semibold leading-7 text-[#202124]">Faça parte dessa história</Text>
            {blogPosts.length > 0 ? <ProjectUpdateCard blogPost={blogPosts[0]} /> : <SectionCard />}
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
}
