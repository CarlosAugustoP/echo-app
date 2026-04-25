import { useEffect, useState } from "react";
import { ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { SkeletonBlock } from "../components/common/Skeleton";
import { ImpactSummaryCard } from "../components/home/ImpactSummaryCard";
import { ProjectCarousel, type ProjectData } from "../components/home/ProjectCarousel";
import { SectionTitle } from "../components/home/SectionTitle";
import { StatCard } from "../components/home/StatCard";
import { AppLayout } from "../components/layout/AppLayout";
import { AppHomeScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import { clearAccessToken } from "../services/authStorage";
import { clearCurrentUser, setCurrentUser, useUserStore } from "../stores/userStore";
import type { DonationDistributionDto, ProjectBlogPostHeaderDto, ProjectHeaderDto } from "../types/api";

const defaultBlogImage = require("../assets/splash-icon.png");

const impactStats = [
  { label: "LIVES IMPACTED", value: "50", helper: "People" },
  { label: "MEALS DONATED", value: "124", helper: "kg" },
  { label: "REFOREST.", value: "124", helper: "Trees" },
] as const;

const featuredProjectMocks: readonly ProjectData[] = [
  {
    title: "ONG Rural",
    progressLabel: "42% reached",
    goal: "R$8,000 toward the goal",
    progress: 42,
    tag: "Urgent",
    theme: "education",
  },
  {
    title: "Reforest",
    progressLabel: "85% reached",
    goal: "R$1,250 remaining",
    progress: 85,
    theme: "forest",
  },
  {
    title: "Water for All",
    progressLabel: "61% reached",
    goal: "R$3,400 toward the goal",
    progress: 61,
    theme: "water",
  },
] as const;

const recommendedProjectMocks: readonly ProjectData[] = [
  {
    title: "Amazon Reforestation",
    progressLabel: "65% reached",
    goal: "R$12,000 toward the goal",
    progress: 65,
    remaining: "3 days left",
    theme: "forest",
  },
  {
    title: "ONG Rural",
    progressLabel: "42% reached",
    goal: "R$8,000 toward the goal",
    progress: 42,
    theme: "education",
  },
] as const;

const defaultContributionMix = [
  { label: "EDUCATION", value: 45, color: "#3564C9" },
  { label: "FOOD SECURITY", value: 35, color: "#68A241" },
  { label: "CLEAN WATER", value: 20, color: "#74A8FF" },
] as const;

const contributionMixColors = ["#3564C9", "#68A241", "#74A8FF", "#D79A2B", "#A65FD8"] as const;

const fallbackBlogPost = {
  id: null as string | null,
  title: "Lua's first day at the new Learning Center",
  imageUrl: null as string | null,
  publishedLabel: "2 hours ago",
  description: "Your R$25.00 contribution helped open another class with school supplies and meals.",
  projectTitle: undefined as string | undefined,
};

function formatRelativeTime(isoDate: string) {
  const publishedAt = new Date(isoDate).getTime();
  const diffInHours = Math.max(1, Math.round((Date.now() - publishedAt) / (1000 * 60 * 60)));

  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
}

function normalizeProgress(progress: number) {
  const normalizedValue = progress <= 1 ? progress * 100 : progress;
  return Math.max(0, Math.min(100, Math.round(normalizedValue)));
}

function normalizeImageUrl(imageUrl?: string | null) {
  const trimmedImageUrl = imageUrl?.trim();
  return trimmedImageUrl ? trimmedImageUrl : null;
}

function buildProjectCards(
  apiProjects: readonly ProjectHeaderDto[],
  fallbackProjects: readonly ProjectData[],
): ProjectData[] {
  if (apiProjects.length === 0) {
    return [...fallbackProjects];
  }

  return apiProjects.map((project, index) => {
    const fallback = fallbackProjects[index % fallbackProjects.length];
    const normalizedProgress = normalizeProgress(Number(project.progress));

    return {
      ...fallback,
      id: project.id,
      title: project.title,
      imageUrl: normalizeImageUrl(project.mainImage),
      progress: normalizedProgress,
      progressLabel: `${normalizedProgress}% reached`,
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
  const [featuredProjects, setFeaturedProjects] = useState<ProjectData[]>([...featuredProjectMocks]);
  const [recommendedProjects, setRecommendedProjects] = useState<ProjectData[]>([
    ...recommendedProjectMocks,
  ]);
  const [contributionMix, setContributionMix] =
    useState<Array<{ label: string; value: number; color: string }>>([...defaultContributionMix]);
  const [recommendedBlogPost, setRecommendedBlogPost] = useState(fallbackBlogPost);

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
          setFeaturedProjects(buildProjectCards(trendingResult.value.items, featuredProjectMocks));
        }

        if (forYouResult.status === "fulfilled") {
          setRecommendedProjects(buildProjectCards(forYouResult.value.items, recommendedProjectMocks));
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
              description: blogPost.first100CharsOfContent || fallbackBlogPost.description,
              projectTitle: undefined,
            });
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
  }, []);

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
    if (!recommendedBlogPost.id) {
      return;
    }

    navigation.navigate("ProjectBlogPost", {
      blogPostId: recommendedBlogPost.id,
      projectTitle: recommendedBlogPost.projectTitle,
    });
  };

  const firstName = currentUser?.name?.split(" ")[0] ?? "Carlos";

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
                <Text className="text-[28px] font-normal text-black">Hello, {firstName}</Text>
                <Text className="text-[28px] font-medium leading-8 text-[#206223]">You've been making some real impact.</Text>
              </>
            )}
        </View>
        </View>

        <ImpactSummaryCard
          impactedLives={impactStats[0].value}
          helper={impactStats[0].helper}
          description="Your monthly contributions provided sustainable meals and education for families across South America."
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
          title="Featured projects"
          projects={featuredProjects}
          onProjectPress={handleOpenProject}
          isLoading={isLoadingHomeData}
        />

        <ProjectCarousel
          title="Projects for you"
          projects={recommendedProjects}
          onProjectPress={handleOpenProject}
          isLoading={isLoadingHomeData}
        />

        <View className="gap-4 rounded-[24px] border border-[#E7ECE8] bg-white px-4 py-4">
          <View className="flex-row items-center justify-between">
            <SectionTitle>Global Contribution Mix</SectionTitle>
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
          <SectionTitle>Your impact in action</SectionTitle>
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
          ) : (
            <Pressable
              onPress={handleOpenRecommendedBlogPost}
              disabled={!recommendedBlogPost.id}
              style={({ pressed }) => (pressed && recommendedBlogPost.id ? { opacity: 0.92 } : undefined)}
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
                        <Text className="text-[9px] font-bold uppercase text-white">NEW UPDATE</Text>
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
          )}
        </View>

        <Pressable className="self-center pt-2" onPress={handleSignOut}>
          <Text className="text-[13px] font-bold text-[#5C635F]">Sign out</Text>
        </Pressable>
      </ScrollView>
    </AppLayout>
  );
}
