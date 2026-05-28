import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppTourTarget } from "../components/common/AppTourTarget";
import { SkeletonBlock } from "../components/common/Skeleton";
import { StateCard } from "../components/common/StateCard";
import { VerificationBadge } from "../components/common/VerificationBadge";
import { AppLayout } from "../components/layout/AppLayout";
import type { SearchScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import { useUserStore } from "../stores/userStore";
import type { ProjectHeaderDto, QueryParams, UserDto } from "../types/api";
import { isAdminUserRole } from "../utils/userRoles";

const PAGE_SIZE = 20;
const fallbackProjectImage = require("../assets/adaptive-icon.png");

type SearchMode = "ngo" | "project";

function buildQuery(searchValue: string): QueryParams {
  return {
    pageNumber: 0,
    pageSize: PAGE_SIZE,
    search: searchValue.trim() || undefined,
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

function formatProjectDescription(value: string | undefined | null) {
  const normalizedValue = value?.trim();
  return normalizedValue && normalizedValue.length > 0
    ? normalizedValue
    : "Esse projeto ainda nao publicou uma descricao detalhada.";
}

function formatNgoBio(value: string | undefined | null) {
  const normalizedValue = value?.trim();
  return normalizedValue && normalizedValue.length > 0
    ? normalizedValue
    : "Organizacao ativa na rede Echo para receber apoio e publicar projetos de impacto.";
}

function resolveVerifiedState(user: UserDto) {
  if (typeof user.isVerified === "boolean") {
    return user.isVerified;
  }

  return Boolean(user.verifiedAt);
}

function NgoInitialsBadge({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <View className="h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[#EEF6EE]">
      <Text className="text-[18px] font-semibold text-[#2F7D32]">{initials || "NG"}</Text>
    </View>
  );
}

function SearchModeButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-[18px] px-4 py-4 ${isActive ? "bg-[#2F7D32]" : "bg-[#F4F7F4]"}`}
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : undefined)}
    >
      <Text
        className={`text-center text-[13px] font-semibold leading-5 ${isActive ? "text-white" : "text-[#5F6D65]"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ProjectResultCard({
  project,
  onPress,
}: {
  project: ProjectHeaderDto;
  onPress: () => void;
}) {
  const progress = normalizeProgress(project.progress);
  const imageUrl = normalizeImageUrl(project.mainImage);

  return (
    <View
      className="rounded-[26px] border border-[#E7ECE8] bg-white px-4 py-4"
      style={{
        shadowColor: "#D6E2D7",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start gap-4">
        <View className="h-[88px] w-[88px] overflow-hidden rounded-[22px] bg-[#EFF3EE]">
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center bg-[#EEF2EE]">
              <Image source={fallbackProjectImage} className="h-[34px] w-[34px]" resizeMode="contain" style={{ opacity: 0.22 }} />
            </View>
          )}
        </View>

        <View className="flex-1 gap-2 pt-1">
          <View className="self-start rounded-full bg-[#EEF6EE] px-2.5 py-1">
            <Text className="text-[9px] font-bold uppercase tracking-[1px] text-[#2F7D32]">Projeto</Text>
          </View>

          <Text className="text-[19px] font-semibold leading-6 text-[#202124]">{project.title}</Text>
          <Text numberOfLines={3} className="text-[13px] leading-5 text-[#6F7A75]">
            {formatProjectDescription(project.description)}
          </Text>
        </View>
      </View>

      <View className="mt-4 gap-3">
        <View className="gap-2">
          <View className="h-[8px] overflow-hidden rounded-full bg-[#E5EAE4]">
            <View className="h-full rounded-full bg-[#2F7D32]" style={{ width: `${progress}%` }} />
          </View>
          <Text className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#7B8780]">
            {`${progress}% de progresso`}
          </Text>
        </View>

        <Pressable
          onPress={onPress}
          className="items-center justify-center rounded-[18px] bg-[#2F7D32] px-4 py-3.5"
          style={({ pressed }) => (pressed ? { opacity: 0.88 } : undefined)}
        >
          <Text className="text-[14px] font-semibold text-white">Ver projeto</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NgoResultCard({
  ngo,
  isAdminView,
  isVerifying,
  onVerify,
  onPress,
}: {
  ngo: UserDto;
  isAdminView: boolean;
  isVerifying: boolean;
  onVerify: () => void;
  onPress: () => void;
}) {
  const profilePictureUrl = normalizeImageUrl(ngo.profilePicture?.url);
  const isVerified = resolveVerifiedState(ngo);

  return (
    <View
      className="rounded-[26px] border border-[#E7ECE8] bg-white px-4 py-4"
      style={{
        shadowColor: "#D6E2D7",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start gap-4">
        {profilePictureUrl ? (
          <Image source={{ uri: profilePictureUrl }} className="h-[58px] w-[58px] rounded-[18px]" resizeMode="cover" />
        ) : (
          <NgoInitialsBadge name={ngo.name} />
        )}

        <View className="flex-1 gap-2">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="self-start rounded-full bg-[#EEF3FF] px-2.5 py-1">
              <Text className="text-[9px] font-bold uppercase tracking-[1px] text-[#3E66C7]">ONG</Text>
            </View>
            <VerificationBadge
              isVerified={ngo.isVerified}
              verifiedAt={ngo.verifiedAt}
              verifiedLabel="Verificada"
            />
          </View>

          <Text className="text-[19px] font-semibold leading-6 text-[#202124]">{ngo.name}</Text>
          <Text numberOfLines={4} className="text-[13px] leading-5 text-[#6F7A75]">
            {formatNgoBio(ngo.bio)}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-2">
          <Ionicons name="mail-outline" size={14} color="#90A09A" />
          <Text numberOfLines={1} className="flex-1 text-[12px] text-[#7B8780]">
            {ngo.email}
          </Text>
        </View>

        <Pressable
          onPress={onPress}
          className="rounded-[16px] border border-[#DDE6DE] bg-[#F9FBF9] px-4 py-3"
          style={({ pressed }) => (pressed ? { opacity: 0.86 } : undefined)}
        >
          <Text className="text-[13px] font-semibold text-[#2F7D32]">Ver perfil</Text>
        </Pressable>
      </View>

      {isAdminView ? (
        <Pressable
          onPress={onVerify}
          disabled={isVerified || isVerifying}
          className={`mt-3 items-center justify-center rounded-[18px] px-4 py-3 ${
            isVerified ? "bg-[#EAF6EC]" : isVerifying ? "bg-[#DDE9DE]" : "bg-[#2F7D32]"
          }`}
          style={({ pressed }) => (!isVerified && !isVerifying && pressed ? { opacity: 0.86 } : undefined)}
        >
          <Text className={`text-[13px] font-semibold ${isVerified ? "text-[#2F7D32]" : "text-white"}`}>
            {isVerified ? "Usuario verificado" : isVerifying ? "Verificando..." : "Verificar usuario"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ProjectResultSkeleton() {
  return (
    <View className="rounded-[26px] border border-[#E7ECE8] bg-white px-4 py-4">
      <View className="flex-row items-start gap-4">
        <SkeletonBlock width={88} height={88} borderRadius={22} />
        <View className="flex-1 gap-3 pt-1">
          <SkeletonBlock width={72} height={20} borderRadius={999} />
          <SkeletonBlock width="76%" height={20} borderRadius={999} />
          <SkeletonBlock width="92%" height={14} borderRadius={999} />
          <SkeletonBlock width="74%" height={14} borderRadius={999} />
        </View>
      </View>
      <View className="mt-4 gap-3">
        <SkeletonBlock width="100%" height={8} borderRadius={999} />
        <SkeletonBlock width="100%" height={50} borderRadius={18} />
      </View>
    </View>
  );
}

function NgoResultSkeleton() {
  return (
    <View className="rounded-[26px] border border-[#E7ECE8] bg-white px-4 py-4">
      <View className="flex-row items-start gap-4">
        <SkeletonBlock width={58} height={58} borderRadius={18} />
        <View className="flex-1 gap-3">
          <SkeletonBlock width={52} height={18} borderRadius={999} />
          <SkeletonBlock width="68%" height={20} borderRadius={999} />
          <SkeletonBlock width="94%" height={14} borderRadius={999} />
          <SkeletonBlock width="72%" height={14} borderRadius={999} />
        </View>
      </View>
      <View className="mt-4 flex-row items-center justify-between gap-3">
        <SkeletonBlock width="54%" height={14} borderRadius={999} className="flex-1" />
        <SkeletonBlock width={110} height={44} borderRadius={16} />
      </View>
    </View>
  );
}

export default function SearchPage({ navigation }: SearchScreenProps) {
  const { currentUser } = useUserStore();
  const isAdminView = isAdminUserRole(currentUser?.role);
  const [searchMode, setSearchMode] = useState<SearchMode>(isAdminView ? "ngo" : "project");
  const [searchValue, setSearchValue] = useState("");
  const [projectResults, setProjectResults] = useState<ProjectHeaderDto[]>([]);
  const [ngoResults, setNgoResults] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [verifyingUserId, setVerifyingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdminView && searchMode === "project") {
      setSearchMode("ngo");
    }
  }, [isAdminView, searchMode]);

  useEffect(() => {
    let isMounted = true;

    const timeoutId = setTimeout(async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setErrorMessage("");
        }

        if (searchMode === "project") {
          const result = await apiClient.searchProjects(buildQuery(searchValue));

          if (!isMounted) {
            return;
          }

          setProjectResults(result.items);
          return;
        }

        const result = await apiClient.searchNgos(buildQuery(searchValue));

        if (!isMounted) {
          return;
        }

        setNgoResults(result.items);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (searchMode === "project") {
          setProjectResults([]);
        } else {
          setNgoResults([]);
        }

        setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os resultados da pesquisa.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, 280);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchMode, searchValue]);

  const resultCount = searchMode === "project" ? projectResults.length : ngoResults.length;
  const resultLabel = searchMode === "project" ? "projetos encontrados" : "ONGs encontradas";
  const emptyTitle = searchMode === "project" ? "Nenhum projeto encontrado" : "Nenhuma ONG encontrada";
  const emptyMessage =
    searchMode === "project"
      ? "Tente outro termo para encontrar projetos publicados na plataforma."
      : isAdminView
        ? "Tente outro termo para localizar ONGs e revisar o status de verificacao."
        : "Tente outro termo para explorar diferentes organizacoes da rede Echo.";

  const handleVerifyUser = async (ngo: UserDto) => {
    try {
      setVerifyingUserId(ngo.id);
      const updatedUser = await apiClient.verifyUser(ngo.id);

      setNgoResults((currentResults) =>
        currentResults.map((currentNgo) => (currentNgo.id === ngo.id ? { ...currentNgo, ...updatedUser } : currentNgo)),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel verificar o usuario.";
      Alert.alert("Falha ao verificar usuario", message);
    } finally {
      setVerifyingUserId(null);
    }
  };

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="pesquisa">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 pb-10" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text className="text-[10px] font-semibold uppercase tracking-[1.5px] text-[#8AA1B6]">
            {isAdminView ? "Curadoria de usuarios" : "Pesquisa guiada"}
          </Text>

          <View className="gap-1">
            <Text className="text-[35px] font-semibold leading-10 text-[#202124]">
              {isAdminView ? "Revise" : "Descubra"}
            </Text>
            <Text className="text-[39px] font-semibold leading-10 text-[#2F7D32]">
              {isAdminView ? "ONGs da rede" : "causas e ONGs"}
            </Text>
          </View>

          <Text className="max-w-[320px] text-[13px] leading-5 text-[#6F7A75]">
            {isAdminView
              ? "Busque organizacoes, confira o selo de verificacao e aprove usuarios diretamente pelo painel administrativo."
              : "Explore projetos e organizacoes da rede Echo em uma busca unificada, com a aba de projetos aberta por padrao."}
          </Text>
        </View>

        <AppTourTarget targetId="tour-search-panel">
          <View
            className="rounded-[26px] border border-[#DDE8DE] bg-white px-4 py-4"
            style={{
              shadowColor: "#D7E3D8",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.12,
              shadowRadius: 22,
              elevation: 2,
            }}
          >
          <View className="flex-row gap-3">
            <SearchModeButton
              label="Pesquisar por ONG"
              isActive={searchMode === "ngo"}
              onPress={() => setSearchMode("ngo")}
            />
            {!isAdminView ? (
              <SearchModeButton
                label="Pesquisar por projeto"
                isActive={searchMode === "project"}
                onPress={() => setSearchMode("project")}
              />
            ) : null}
          </View>

          <View className="mt-4 rounded-[20px] border border-[#E9EEEA] bg-[#FCFDFC] px-4 py-2.5">
            <View className="flex-row items-center gap-3">
              <Ionicons name="search-outline" size={18} color="#9AA59F" />
              <TextInput
                value={searchValue}
                onChangeText={setSearchValue}
                placeholder={
                  searchMode === "project"
                    ? "Buscar projetos por nome ou descricao..."
                    : isAdminView
                      ? "Buscar ONGs para verificar..."
                      : "Buscar ONGs por nome..."
                }
                placeholderTextColor="#A1AAA5"
                className="flex-1 py-2 text-[14px] text-[#202124]"
              />
            </View>
          </View>
          </View>
        </AppTourTarget>

        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-[12px] font-semibold uppercase tracking-[1.2px] text-[#8B9790]">Resultados</Text>
          <View className="rounded-full bg-[#EEF6EE] px-3 py-1.5">
            <Text className="text-[11px] font-semibold text-[#2F7D32]">{`${resultCount} ${resultLabel}`}</Text>
          </View>
        </View>

        {isLoading ? (
          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, index) =>
              searchMode === "project" ? (
                <ProjectResultSkeleton key={`project-search-skeleton-${index}`} />
              ) : (
                <NgoResultSkeleton key={`ngo-search-skeleton-${index}`} />
              ),
            )}
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <StateCard kind="error" title="Falha ao carregar a pesquisa" message={errorMessage} />
        ) : null}

        {!isLoading && !errorMessage && resultCount === 0 ? (
          <View className="rounded-[24px] border border-[#E8ECE7] bg-white px-5 py-6">
            <Text className="text-[18px] font-semibold text-[#202124]">{emptyTitle}</Text>
            <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">{emptyMessage}</Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage && searchMode === "project" ? (
          <View className="gap-3">
            {projectResults.map((project) => (
              <ProjectResultCard
                key={project.id}
                project={project}
                onPress={() => navigation.navigate("ProjectDetails", { projectId: project.id })}
              />
            ))}
          </View>
        ) : null}

        {!isLoading && !errorMessage && searchMode === "ngo" ? (
          <View className="gap-3">
            {ngoResults.map((ngo) => (
              <NgoResultCard
                key={ngo.id}
                ngo={ngo}
                isAdminView={isAdminView}
                isVerifying={verifyingUserId === ngo.id}
                onVerify={() => {
                  void handleVerifyUser(ngo);
                }}
                onPress={() =>
                  navigation.navigate("NgoProfile", {
                    ngoId: ngo.id,
                    preserveSearchContext: true,
                  })
                }
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </AppLayout>
  );
}
