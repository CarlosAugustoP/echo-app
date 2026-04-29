import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Easing, Image, ImageBackground, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { SkeletonBlock } from "../common/Skeleton";
import { AppLayout } from "../layout/AppLayout";
import { apiClient } from "../../services/apiClient";
import { clearAccessToken } from "../../services/authStorage";
import { clearCurrentUser } from "../../stores/userStore";
import type { AppHomeScreenProps } from "../../navigation/types";
import type { ProjectDto, UserDto } from "../../types/api";

const fallbackProjectImage = require("../../assets/adaptive-icon.png");

type NgoHomeContentProps = {
  currentUser: UserDto;
  isLoadingUser: boolean;
  navigation: AppHomeScreenProps["navigation"];
};

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

function showComingSoonMessage() {
  const title = "Funcionalidade em breve";
  const message = "Ainda estamos finalizando este fluxo no app.";

  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

function HomeSection({
  title,
  actionLabel,
  onActionPress,
  children,
}: {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="rounded-[30px] bg-white px-4 py-4">
      <View className="flex-row items-center justify-between gap-4">
        <Text className="text-[20px] font-medium text-[#222426]">{title}</Text>
        {actionLabel ? (
          <Pressable onPress={onActionPress} style={({ pressed }) => (pressed ? { opacity: 0.72 } : undefined)}>
            <Text className="text-[11px] font-bold uppercase tracking-[1.1px] text-[#2F7D32]">{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="mt-4 gap-4">{children}</View>
    </View>
  );
}

function NgoListItem({
  title,
  category,
  progress,
  imageUrl,
  onPress,
}: {
  title: string;
  category: string;
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
          <Text className="text-[18px] font-semibold leading-6 text-[#202124]">{truncateText(title, 18)}</Text>
          {/* <Text className="mt-1 text-[11px] font-bold uppercase tracking-[1.1px] text-[#2E7FC7]">{category}</Text> */}

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
          <View className="mt-2">
            <SkeletonBlock width="26%" height={11} borderRadius={999} />
          </View>
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

export function NgoHomeContent({ currentUser, isLoadingUser, navigation }: NgoHomeContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [managedProjects, setManagedProjects] = useState<ProjectDto[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [heroProjectIndex, setHeroProjectIndex] = useState(0);
  const heroOpacity = useRef(new Animated.Value(1)).current;
  const heroTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const loadNgoHome = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const projectsResult = await apiClient.getProjectsByManager(currentUser.id, { pageSize: 6, pageNumber: 0 });

        if (!isMounted) {
          return;
        }

        setManagedProjects(projectsResult.items);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar a home da organizacao.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadNgoHome();

    return () => {
      isMounted = false;
    };
  }, [currentUser.id]);

  useEffect(() => {
    if (managedProjects.length === 0) {
      setHeroProjectIndex(0);
      return;
    }

    setHeroProjectIndex((currentIndex) => currentIndex % managedProjects.length);
  }, [managedProjects]);

  useEffect(() => {
    if (managedProjects.length <= 1) {
      return;
    }

    const intervalId = setInterval(() => {
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heroTranslateX, {
          toValue: -18,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) {
          return;
        }

        setHeroProjectIndex((currentIndex) => {
          const nextIndex = (currentIndex + 1) % managedProjects.length;
          heroTranslateX.setValue(18);
          heroOpacity.setValue(0);

          Animated.parallel([
            Animated.timing(heroOpacity, {
              toValue: 1,
              duration: 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(heroTranslateX, {
              toValue: 0,
              duration: 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start();

          return nextIndex;
        });
      });
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [heroOpacity, heroTranslateX, managedProjects]);

  const firstName = currentUser.name.split(" ")[0] ?? currentUser.name;
  const featuredProject = managedProjects[heroProjectIndex] ?? managedProjects[0] ?? null;

  const ngoProjects = useMemo(() => managedProjects.map(buildProjectListItem), [managedProjects]);

  const featuredProjectProgress = featuredProject ? normalizeProgress(featuredProject.progress) : 0;

  const heroDescription = featuredProject
    ? truncateText(featuredProject.description || featuredProject.title, 88)
    : "Veja o status de impacto da sua organizacao hoje.";

  const handleOpenProject = (projectId: string) => {
    navigation.navigate("ProjectDetails", { projectId });
  };

  const handleSignOut = async () => {
    await clearAccessToken();
    clearCurrentUser();
    navigation.replace("Signin");
  };

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="inicio">
      <ScrollView className="flex-1" contentContainerClassName="gap-6 pb-10" showsVerticalScrollIndicator={false}>
        <View className="gap-1">
          {isLoadingUser ? (
            <View className="gap-2">
              <SkeletonBlock height={28} width="54%" borderRadius={999} />
              <SkeletonBlock height={14} width="72%" borderRadius={999} />
            </View>
          ) : (
            <>
              <Text className="text-[28px] font-semibold leading-8 text-[#202124]">{`Ola, ${firstName}`}</Text>
              <Text className="text-[14.5px] mt-1 leading-5 text-[#6F7A75]">
                Veja o status de impacto da sua organizacao hoje.
              </Text>
            </>
          )}
        </View>

        <Pressable
          className="overflow-hidden rounded-[28px]"
          disabled={!featuredProject?.id}
          onPress={() => {
            if (featuredProject?.id) {
              handleOpenProject(featuredProject.id);
            }
          }}
          style={({ pressed }) => (pressed && featuredProject?.id ? { opacity: 0.94 } : undefined)}
        >
          {isLoading ? (
            <View className="rounded-[28px] bg-[#EEF2EE] p-4">
              <SkeletonBlock height={184} borderRadius={24} />
            </View>
          ) : (
            <ImageBackground
              source={featuredProject?.mainImage ? { uri: featuredProject.mainImage } : fallbackProjectImage}
              imageStyle={{ borderRadius: 28 }}
              style={{ overflow: "hidden", borderRadius: 28 }}
            >
              <LinearGradient
                colors={["rgba(22,28,18,0.18)", "rgba(22,28,18,0.84)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ minHeight: 184, padding: 18 }}
              >
                <Animated.View
                  style={{
                    flex: 1,
                    justifyContent: "space-between",
                    opacity: heroOpacity,
                    transform: [{ translateX: heroTranslateX }],
                  }}
                >
                  <View className="gap-1">
                    <Text className="max-w-[290px] text-[30px] font-medium leading-9 text-white">
                      {featuredProject?.title?.trim() || currentUser.name}
                    </Text>
                    <Text className="max-w-[290px] text-[12px] mt-2 leading-5 text-[#F0F4EE]">{heroDescription}</Text>
                  </View>

                  <View className="rounded-[18px] bg-[rgba(255,255,255,0.18)] px-4 py-3 mt-4">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="text-[9px] font-bold uppercase tracking-[0.9px] text-[#F6FAF4]">
                        ANDAMENTO DO PROJETO
                      </Text>
                      <Text className="text-[18px] font-semibold text-white">{`${featuredProjectProgress}%`}</Text>
                    </View>
                    <View className="mt-3 h-[7px] overflow-hidden rounded-full bg-[rgba(255,255,255,0.18)]">
                      <View className="h-full rounded-full bg-white" style={{ width: `${featuredProjectProgress}%` }} />
                    </View>
                  </View>
                </Animated.View>
              </LinearGradient>
            </ImageBackground>
          )}
        </Pressable>

        {errorMessage ? (
          <View className="rounded-[24px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-4">
            <Text className="text-[15px] font-semibold text-[#A33A3A]">Nao foi possivel carregar a home</Text>
            <Text className="mt-2 text-[13px] leading-5 text-[#8B5B5B]">{errorMessage}</Text>
          </View>
        ) : null}

        <HomeSection title="Seus Projetos" actionLabel="VER MAIS" onActionPress={showComingSoonMessage}>
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => <NgoListSkeleton key={`ngo-project-skeleton-${index}`} />)
            : ngoProjects.length > 0
              ? ngoProjects.map((project) => (
                  <NgoListItem
                    key={project.id}
                    title={project.title}
                    category={project.category}
                    progress={project.progress}
                    imageUrl={project.imageUrl}
                    onPress={() => handleOpenProject(project.id)}
                  />
                ))
              : <EmptySectionState message="Assim que voce criar seus projetos, eles aparecerao aqui." />}

          <Pressable
            className="mt-1 flex-row items-center justify-center gap-2 rounded-full bg-[#2F7D32] px-5 py-4"
            onPress={showComingSoonMessage}
            style={({ pressed }) => (pressed ? { opacity: 0.88 } : undefined)}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text className="text-[13px] font-semibold uppercase tracking-[1.1px] text-white">Criar Projeto</Text>
          </Pressable>
        </HomeSection>

        <Pressable className="self-center pt-2" onPress={handleSignOut}>
          <Text className="text-[13px] font-bold text-[#5C635F]">Sair</Text>
        </Pressable>
      </ScrollView>
    </AppLayout>
  );
}
