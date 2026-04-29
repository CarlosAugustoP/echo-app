import { useEffect, useState } from "react";
import { ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { SkeletonBlock } from "../components/common/Skeleton";
import { ImpactSummaryCard } from "../components/home/ImpactSummaryCard";
import { NgoHomeContent } from "../components/home/NgoHomeContent";
import { ProjectCarousel, type ProjectData } from "../components/home/ProjectCarousel";
import { SectionTitle } from "../components/home/SectionTitle";
import { StatCard } from "../components/home/StatCard";
import { AppLayout } from "../components/layout/AppLayout";
import { AppHomeScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import { clearAccessToken } from "../services/authStorage";
import { clearCurrentUser, setCurrentUser, useUserStore } from "../stores/userStore";
import type { DonationDistributionDto, ProjectBlogPostHeaderDto, ProjectHeaderDto } from "../types/api";
import { isNgoUserRole } from "../utils/userRoles";

const defaultBlogImage = require("../assets/splash-icon.png");

const impactStats = [
  { label: "VIDAS IMPACTADAS", value: "50", helper: "pessoas" },
  { label: "ALIMENTOS DOADOS", value: "124", helper: "kg" },
  { label: "REFLOREST.", value: "124", helper: "árvores" },
] as const;

const defaultContributionMix = [
  { label: "EDUCACAO", value: 45, color: "#3564C9" },
  { label: "SEGURANCA ALIMENTAR", value: 35, color: "#68A241" },
  { label: "AGUA POTAVEL", value: 20, color: "#74A8FF" },
] as const;

const contributionMixColors = ["#3564C9", "#68A241", "#74A8FF", "#D79A2B", "#A65FD8"] as const;

type RecommendedBlogPost = {
  id: string;
  title: string;
  imageUrl: string | null;
  publishedLabel: string;
  description: string;
  projectTitle?: string;
};

function formatRelativeTime(isoDate: string) {
  const publishedAt = new Date(isoDate).getTime();
  const diffInHours = Math.max(1, Math.round((Date.now() - publishedAt) / (1000 * 60 * 60)));

  if (diffInHours < 24) {
    return `${diffInHours} hora${diffInHours === 1 ? "" : "s"} atrás`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  return `${diffInDays} dia${diffInDays === 1 ? "" : "s"} atrás`;
}

function normalizeProgress(progress: number) {
  const normalizedValue = progress <= 1 ? progress * 100 : progress;
  return Math.max(0, Math.min(100, Math.round(normalizedValue)));
}

function normalizeImageUrl(imageUrl?: string | null) {
  const trimmedImageUrl = imageUrl?.trim();
  return trimmedImageUrl ? trimmedImageUrl : null;
}

function buildProjectCards(apiProjects: readonly ProjectHeaderDto[]): ProjectData[] {
  const themeByIndex: readonly ProjectData["theme"][] = ["education", "forest", "water"];

  return apiProjects.map((project, index) => {
    const normalizedProgress = normalizeProgress(Number(project.progress));

    return {
      id: project.id,
      title: project.title,
      goal: project.description,
      imageUrl: normalizeImageUrl(project.mainImage),
      progress: normalizedProgress,
      progressLabel: `${normalizedProgress}% alcançado`,
      theme: themeByIndex[index % themeByIndex.length],
    };
  });
}

function buildContributionMix(distribution: DonationDistributionDto | null) {
  if (!distribution) {
    return [...defaultContributionMix];
  }

  const entries = Object.entries(distribution)
    .map(([label, value]) => ({
      label: label.replaceAll("_", " ").toUpperCase(),
      rawValue: Number(value),
    }))
    .filter((item) => Number.isFinite(item.rawValue) && item.rawValue > 0);

  if (entries.length === 0) {
    return [...defaultContributionMix];
  }

  const total = entries.reduce((sum, item) => sum + item.rawValue, 0);

  return entries.map((item, index) => ({
    label: item.label,
    value: Math.round((item.rawValue / total) * 100),
    color: contributionMixColors[index % contributionMixColors.length],
  }));
}

export default function AppHomePage({ navigation }: AppHomeScreenProps) {
  const { currentUser } = useUserStore();
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingHomeData, setIsLoadingHomeData] = useState(true);
  const [featuredProjects, setFeaturedProjects] = useState<ProjectData[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<ProjectData[]>([]);
  const [contributionMix, setContributionMix] =
    useState<Array<{ label: string; value: number; color: string }>>([...defaultContributionMix]);
  const [recommendedBlogPost, setRecommendedBlogPost] = useState<RecommendedBlogPost | null>(null);

  useEffect(() => {
    if (currentUser) {
      return;
    }

    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        setIsLoadingUser(true);
        const user = await apiClient.me();

        if (isMounted) {
          setCurrentUser(user);
        }
      } catch {
        if (isMounted) {
          navigation.replace("Signin");
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    };

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [currentUser, navigation]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (isNgoUserRole(currentUser.role)) {
      setIsLoadingHomeData(false);
      return;
    }

    let isMounted = true;

    const loadHomeData = async () => {
      try {
        setIsLoadingHomeData(true);
        const [trendingResult, forYouResult, distributionResult, blogResult] = await Promise.allSettled([
          apiClient.getTrendingProjects({ pageSize: 3 }),
          apiClient.getForYouProjects({ pageSize: 3 }),
          apiClient.getDonationDistribution(),
          apiClient.getRecommendedBlogPosts({ pageSize: 1 }),
        ]);

        if (!isMounted) {
          return;
        }

        if (trendingResult.status === "fulfilled") {
          setFeaturedProjects(buildProjectCards(trendingResult.value.items));
        }

        if (forYouResult.status === "fulfilled") {
          setRecommendedProjects(buildProjectCards(forYouResult.value.items));
        }

        if (distributionResult.status === "fulfilled") {
          setContributionMix(buildContributionMix(distributionResult.value));
        }

        if (blogResult.status === "fulfilled") {
          const blogPost: ProjectBlogPostHeaderDto | undefined = blogResult.value.items[0];

          if (blogPost) {
            setRecommendedBlogPost({
              id: blogPost.id,
              title: blogPost.title,
              imageUrl: normalizeImageUrl(blogPost.headerImage),
              publishedLabel: formatRelativeTime(blogPost.createdAt),
              description: blogPost.first100CharsOfContent || "",
              projectTitle: undefined,
            });
          } else {
            setRecommendedBlogPost(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingHomeData(false);
        }
      }
    };

    void loadHomeData();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleSignOut = async () => {
    await clearAccessToken();
    clearCurrentUser();
    navigation.replace("Signin");
  };

  const handleOpenProject = (project: ProjectData) => {
    if (!project.id) {
      return;
    }

    navigation.navigate("ProjectDetails", { projectId: project.id });
  };

  const handleOpenRecommendedBlogPost = () => {
    if (!recommendedBlogPost?.id) {
      return;
    }

    navigation.navigate("ProjectBlogPost", {
      blogPostId: recommendedBlogPost.id,
      projectTitle: recommendedBlogPost.projectTitle,
    });
  };

  const firstName = currentUser?.name?.split(" ")[0] ?? "Carlos";

  if (currentUser && isNgoUserRole(currentUser.role)) {
    return <NgoHomeContent currentUser={currentUser} isLoadingUser={isLoadingUser} navigation={navigation} />;
  }

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="inicio">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-1">
            {isLoadingUser ? (
              <View className="gap-2">
                <SkeletonBlock height={28} width="42%" borderRadius={999} />
                <SkeletonBlock height={32} width="86%" borderRadius={18} />
                <SkeletonBlock height={14} width="34%" borderRadius={999} />
              </View>
            ) : (
              <>
                <Text className="text-[28px] font-normal text-black">Olá, {firstName}</Text>
                <Text className="text-[28px] font-medium leading-8 text-[#206223]">Você tem gerado um impacto real.</Text>
              </>
            )}
          </View>
        </View>

        <ImpactSummaryCard
          impactedLives={impactStats[0].value}
          helper={impactStats[0].helper}
          description="Suas contribuições mensais levaram alimentação e educação sustentável para famílias em toda a América do Sul."
          isLoading={isLoadingHomeData}
        />

        <View className="flex-row gap-3">
          <StatCard
            label={impactStats[1].label}
            value={impactStats[1].value}
            helper={impactStats[1].helper}
            icon={<MaterialCommunityIcons name="silverware-fork-knife" size={16} color="#206223" />}
            isLoading={isLoadingHomeData}
          />
          <StatCard
            label={impactStats[2].label}
            value={impactStats[2].value}
            helper={impactStats[2].helper}
            icon={<Ionicons name="leaf-outline" size={16} color="#206223" />}
            isLoading={isLoadingHomeData}
          />
        </View>

        <ProjectCarousel
          title="Projetos em destaque"
          projects={featuredProjects}
          onProjectPress={handleOpenProject}
          isLoading={isLoadingHomeData}
        />

        <ProjectCarousel
          title="Projetos para você"
          projects={recommendedProjects}
          onProjectPress={handleOpenProject}
          isLoading={isLoadingHomeData}
        />

        <View className="gap-4 rounded-[24px] border border-[#E7ECE8] bg-white px-4 py-4">
          <View className="flex-row items-center justify-between">
            <SectionTitle>Distribuição global das contribuições</SectionTitle>
            <Ionicons name="information-circle-outline" size={18} color="#98A09B" />
          </View>
          {isLoadingHomeData ? (
            <View className="gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={`contribution-skeleton-${index}`} className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <SkeletonBlock height={11} width="34%" borderRadius={999} />
                    <SkeletonBlock height={11} width={28} borderRadius={999} />
                  </View>
                  <SkeletonBlock height={10} width="100%" borderRadius={999} />
                </View>
              ))}
            </View>
          ) : (
            <View className="gap-4">
              {contributionMix.map((item) => (
                <View key={item.label} className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11px] font-bold uppercase text-[#71807C]">{item.label}</Text>
                    <Text className="text-[12px] font-bold" style={{ color: item.color }}>
                      {item.value}%
                    </Text>
                  </View>
                  <View className="h-2.5 overflow-hidden rounded-full bg-[#EFF2F0]">
                    <View className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="gap-4">
          <SectionTitle>Seu impacto em ação</SectionTitle>
          {isLoadingHomeData ? (
            <View className="overflow-hidden rounded-[28px] bg-[#EEF3F0] p-4">
              <SkeletonBlock height={240} borderRadius={24} />
              <View className="mt-4 gap-3">
                <View className="flex-row items-center gap-2">
                  <SkeletonBlock height={24} width={96} borderRadius={999} />
                  <SkeletonBlock height={12} width={74} borderRadius={999} />
                </View>
                <SkeletonBlock height={28} width="66%" borderRadius={18} />
                <SkeletonBlock height={14} width="58%" borderRadius={999} />
              </View>
            </View>
          ) : recommendedBlogPost ? (
            <Pressable
              onPress={handleOpenRecommendedBlogPost}
              style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
            >
              <ImageBackground
                source={recommendedBlogPost.imageUrl ? { uri: recommendedBlogPost.imageUrl } : defaultBlogImage}
                imageStyle={{ borderRadius: 28 }}
                style={{ borderRadius: 28, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={["rgba(38,42,48,0.15)", "rgba(38,42,48,0.92)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{ padding: 18, minHeight: 240, justifyContent: "flex-end" }}
                >
                  <View className="gap-3">
                    <View className="flex-row items-center gap-2">
                      <View className="rounded-full bg-[#4A73D9] px-2 py-1">
                        <Text className="text-[9px] font-bold uppercase text-white">NOVA ATUALIZACAO</Text>
                      </View>
                      <Text className="text-[11px] font-medium text-[#E3E7ED]">
                        {recommendedBlogPost.publishedLabel}
                      </Text>
                    </View>
                    <Text className="max-w-[240px] text-[28px] font-semibold leading-8 text-white">
                      {recommendedBlogPost.title}
                    </Text>
                    <Text className="max-w-[260px] text-[13px] leading-5 text-[#ECEEF3]">
                      {recommendedBlogPost.description}
                    </Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </Pressable>
          ) : null}
        </View>

        <Pressable className="self-center pt-2" onPress={handleSignOut}>
          <Text className="text-[13px] font-bold text-[#5C635F]">Sair</Text>
        </Pressable>
      </ScrollView>
    </AppLayout>
  );
}
