import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { PageHeader } from "../components/common/PageHeader";
import { SkeletonBlock } from "../components/common/Skeleton";
import { StateCard } from "../components/common/StateCard";
import { VerificationBadge } from "../components/common/VerificationBadge";
import { AppLayout } from "../components/layout/AppLayout";
import { ProjectCard } from "../components/project/ProjectCard";
import { NgoProfileScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import { ProjectBlogPostHeaderDto, ProjectDto, UserDto } from "../types/api";

const MAX_VISIBLE_PROJECTS = 3;
const MAX_LEDGER_ITEMS = 6;

function normalizeImageUrl(imageUrl?: string | null) {
  const normalizedValue = imageUrl?.trim();
  return normalizedValue ? normalizedValue : null;
}

function formatNgoBio(value: string | undefined | null) {
  const normalizedValue = value?.trim();
  return normalizedValue && normalizedValue.length > 0
    ? normalizedValue
    : "Organizacao ativa na rede Echo para receber apoio, captar recursos com seguranca juridica e publicar resultados verificaveis.";
}

function formatTaxIdLabel(user?: UserDto | null) {
  const value = user?.taxId?.value?.replace(/\D/g, "") ?? "";

  if (value.length === 14) {
    return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }

  return user?.taxId?.value?.trim() || "CNPJ nao informado";
}

function formatWalletLabel(walletAddress?: string | null) {
  const normalizedValue = walletAddress?.trim();

  if (!normalizedValue) {
    return "Carteira nao informada";
  }

  if (normalizedValue.length <= 18) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, 8)}...${normalizedValue.slice(-6)}`;
}

function formatVerifiedDate(verifiedAt?: string | null) {
  if (!verifiedAt) {
    return "Em revisao pela Echo";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(verifiedAt));
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

function formatRelativeDate(isoDate: string) {
  const publishedAt = new Date(isoDate).getTime();
  const diffInHours = Math.max(1, Math.round((Date.now() - publishedAt) / (1000 * 60 * 60)));

  if (diffInHours < 24) {
    return `${diffInHours}h atras`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  return `${diffInDays}d atras`;
}

function resolveIsVerified(user?: UserDto | null) {
  if (!user) {
    return false;
  }

  if (typeof user.isVerified === "boolean") {
    return user.isVerified;
  }

  return Boolean(user.verifiedAt);
}

function NgoIdentityBadge({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} className="h-[120px] w-[120px] rounded-full" resizeMode="cover" />;
  }

  return (
    <View className="h-[120px] w-[120px] items-center justify-center rounded-full bg-[#DCE9D7]">
      <Text className="text-[32px] font-semibold text-[#2F7D32]">{initials || "NG"}</Text>
    </View>
  );
}

function TrustMarker({
  icon,
  iconColor,
  label,
  value,
  helper,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"] | React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconColor: string;
  label: string;
  value: string;
  helper: string;
}) {
  const IconComponent = icon === "briefcase-outline" ? MaterialCommunityIcons : Ionicons;

  return (
    <View className="flex-1 rounded-[22px] border border-[#E8EEE8] bg-white px-4 py-4">
      <View className="h-11 w-11 items-center justify-center rounded-[15px] bg-[#F3F7F1]">
        <IconComponent name={icon as never} size={20} color={iconColor} />
      </View>
      <Text className="mt-4 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#8A9791]">{label}</Text>
      <Text className="mt-2 text-[16px] font-semibold leading-6 text-[#202124]">{value}</Text>
      <Text className="mt-2 text-[12px] leading-5 text-[#6F7A75]">{helper}</Text>
    </View>
  );
}

function LedgerCard({
  entry,
  onPress,
}: {
  entry: ProjectBlogPostHeaderDto;
  onPress: () => void;
}) {
  const headerImageUrl = normalizeImageUrl(entry.headerImage);

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-[24px] border border-[#E7ECE8] bg-white"
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : undefined)}
    >
      {headerImageUrl ? (
        <Image source={{ uri: headerImageUrl }} className="h-[168px] w-full" resizeMode="cover" />
      ) : (
        <View className="h-[168px] w-full items-center justify-center bg-[#EEF3EE]">
          <MaterialCommunityIcons name="notebook-outline" size={40} color="#7D9780" />
        </View>
      )}

      <View className="gap-3 px-4 py-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="rounded-full bg-[#EAF2FF] px-2.5 py-1">
            <Text className="text-[9px] font-bold uppercase tracking-[1px] text-[#416AD1]">Acao de campo</Text>
          </View>
          <Text className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#8B9790]">
            {formatRelativeDate(entry.createdAt)}
          </Text>
        </View>

        <View className="gap-1">
          <Text className="text-[17px] font-semibold leading-6 text-[#202124]">{entry.title}</Text>
        </View>

        <Text className="text-[13px] leading-5 text-[#66736C]">{entry.first100CharsOfContent?.trim() || " "}</Text>
      </View>
    </Pressable>
  );
}

function EmptySectionCard({ title, message }: { title: string; message: string }) {
  return (
    <View className="rounded-[24px] border border-[#E7ECE8] bg-white px-5 py-5">
      <Text className="text-[18px] font-semibold text-[#202124]">{title}</Text>
      <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">{message}</Text>
    </View>
  );
}

export default function NgoProfilePage({ navigation, route }: NgoProfileScreenProps) {
  const [ngo, setNgo] = useState<UserDto | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<ProjectBlogPostHeaderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadNgoProfile = async () => {
      try {
        setIsLoading(true);
        setLedgerLoading(true);
        setErrorMessage("");

        const [ngoResult, projectsResult, ledgerResult] = await Promise.all([
          apiClient.getUserById(route.params.ngoId),
          apiClient.getProjectsByManager(route.params.ngoId, { pageNumber: 0, pageSize: 12 }),
          apiClient.getBlogPostsByNgo(route.params.ngoId, { pageNumber: 0, pageSize: MAX_LEDGER_ITEMS }),
        ]);

        if (!isMounted) {
          return;
        }

        setNgo(ngoResult);
        setProjects(projectsResult.items);
        setLedgerEntries(ledgerResult.items);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setNgo(null);
        setProjects([]);
        setLedgerEntries([]);
        setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o perfil institucional.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setLedgerLoading(false);
        }
      }
    };

    void loadNgoProfile();

    return () => {
      isMounted = false;
    };
  }, [route.params.ngoId]);

  const profileImageUrl = normalizeImageUrl(ngo?.profilePicture?.url);
  const isVerified = resolveIsVerified(ngo);
  const visibleProjects = useMemo(() => projects.slice(0, MAX_VISIBLE_PROJECTS), [projects]);
  const footerTab = route.params.preserveSearchContext ? "pesquisa" : "inicio";
  const backLabel = route.params.preserveSearchContext ? "Pesquisa" : "Voltar";

  return (
    <AppLayout headerVariant="logged-in" authFooterTab={footerTab}>
      <ScrollView className="flex-1" contentContainerClassName="gap-6 pb-10" showsVerticalScrollIndicator={false}>
        <PageHeader
          eyebrow="PERFIL INSTITUCIONAL"
          title={ngo?.name?.trim() || "ONG"}
          description="Credenciais legais, marcadores de confianca e historico publico de acoes da organizacao."
          backLabel={backLabel}
          onBackPress={() => navigation.goBack()}
        />

        {isLoading ? (
          <View className="gap-4">
            <SkeletonBlock height={280} borderRadius={28} />
            <View className="flex-row gap-3">
              <SkeletonBlock height={154} borderRadius={22} className="flex-1" />
              <SkeletonBlock height={154} borderRadius={22} className="flex-1" />
            </View>
            <SkeletonBlock height={154} borderRadius={22} />
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <StateCard kind="error" title="Falha ao carregar ONG" message={errorMessage} />
        ) : null}

        {!isLoading && !errorMessage && ngo ? (
          <>
            <View
              className="overflow-hidden rounded-[30px] border border-[#DDE9DF] bg-[#F7FAF6] px-5 py-5"
              style={{
                shadowColor: "#D7E3D8",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.14,
                shadowRadius: 24,
                elevation: 3,
              }}
            >
              <View className="absolute right-[-24px] top-[-28px] h-[140px] w-[140px] rounded-full bg-[#E5F0E1]" />
              <View className="absolute bottom-[-36px] left-[-22px] h-[150px] w-[150px] rounded-full bg-[#EEF4EA]" />

              <View className="items-center gap-4">
                <View className="rounded-full border-[5px] border-white">
                  <NgoIdentityBadge imageUrl={profileImageUrl} name={ngo.name} />
                </View>

                <View className="items-center gap-3">
                  <View className="items-center gap-2">
                    <Text className="text-center text-[30px] font-semibold leading-9 text-[#202124]">{ngo.name}</Text>
                    <VerificationBadge
                      isVerified={ngo.isVerified}
                      verifiedAt={ngo.verifiedAt}
                      verifiedLabel="Verificada pela Echo"
                    />
                  </View>

                  <Text className="max-w-[320px] text-center text-[14px] leading-6 text-[#617068]">
                    {formatNgoBio(ngo.bio)}
                  </Text>
                </View>

              </View>
            </View>

            <View className="flex-row flex-wrap gap-3">
              <TrustMarker
                icon="shield-checkmark"
                iconColor="#2F7D32"
                label="Verificacao Echo"
                value={isVerified ? "Ativa" : "Em analise"}
                helper={isVerified ? `Validada em ${formatVerifiedDate(ngo.verifiedAt)}` : "A identidade juridica ainda nao foi validada pela curadoria."}
              />
              <TrustMarker
                icon="briefcase-outline"
                iconColor="#3F67C9"
                label="CNPJ"
                value={formatTaxIdLabel(ngo)}
                helper="Cadastro juridico obrigatorio exibido para fortalecer a seguranca institucional do doador."
              />
            </View>

            <View className="flex-row flex-wrap gap-3">
              <TrustMarker
                icon="mail-outline"
                iconColor="#B97922"
                label="Contato publico"
                value={ngo.email}
                helper="Canal oficial associado a conta institucional desta organizacao."
              />
              <TrustMarker
                icon="wallet-outline"
                iconColor="#4E7AE1"
                label="Carteira on-chain"
                value={formatWalletLabel(ngo.walletAddress)}
                helper="Endereco usado nas operacoes vinculadas aos fluxos transparentes da plataforma."
              />
            </View>

            <View className="rounded-[28px] border border-[#E7ECE8] bg-white px-5 py-5">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#8A9791]">Projetos da organizacao</Text>
                  <Text className="mt-2 text-[24px] font-semibold leading-8 text-[#202124]">{projects.length} projetos publicados</Text>
                  <Text className="mt-2 text-[13px] leading-5 text-[#6F7A75]">
                    Explore as frentes ativas desta ONG e acompanhe metas, progresso e evidencias operacionais.
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    navigation.navigate("ProjectsList", {
                      managerId: ngo.id,
                      ownerName: ngo.name,
                      description: formatNgoBio(ngo.bio),
                      readOnly: true,
                      preserveSearchContext: route.params.preserveSearchContext,
                    })
                  }
                  className="rounded-[18px] bg-[#2F7D32] px-4 py-3"
                  style={({ pressed }) => (pressed ? { opacity: 0.88 } : undefined)}
                >
                  <Text className="text-[13px] font-semibold text-white">Ver todos</Text>
                </Pressable>
              </View>
            </View>

            <View className="gap-4">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-[#8A9791]">Projetos em destaque</Text>
                  <Text className="mt-2 text-[24px] font-semibold leading-8 text-[#202124]">Acoes abertas para apoio</Text>
                </View>
              </View>

              {visibleProjects.length > 0 ? (
                <View className="gap-3">
                  {visibleProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      title={project.title}
                      progress={normalizeProgress(project.progress)}
                      imageUrl={normalizeImageUrl(project.mainImage)}
                      hasPendingDonations={project.hasPendingDonations}
                      variant="small"
                      onViewProject={() => navigation.navigate("ProjectDetails", { projectId: project.id })}
                    />
                  ))}
                </View>
              ) : (
                <EmptySectionCard
                  title="Nenhum projeto publicado"
                  message="Esta ONG ainda nao publicou projetos ativos para exibicao publica."
                />
              )}
            </View>

            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-[#8A9791]">Historical ledger</Text>
                <Text className="text-[24px] font-semibold leading-8 text-[#202124]">Trilha pública de ações de campo</Text>
                <Text className="max-w-[340px] text-[13px] leading-5 text-[#6F7A75]">
                  Registro recente de atualizações operacionais publicadas pela ONG.
                </Text>
              </View>

              {ledgerLoading ? (
                <View className="gap-3">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <SkeletonBlock key={`ngo-ledger-skeleton-${index}`} height={260} borderRadius={24} />
                  ))}
                </View>
              ) : ledgerEntries.length > 0 ? (
                <View className="gap-3">
                  {ledgerEntries.map((entry) => (
                    <LedgerCard
                      key={entry.id}
                      entry={entry}
                      onPress={() =>
                        navigation.navigate("ProjectBlogPost", {
                          blogPostId: entry.id,
                        })
                      }
                    />
                  ))}
                </View>
              ) : (
                <EmptySectionCard
                  title="Sem acoes historicas publicadas"
                  message="Quando a ONG publicar atualizacoes de campo, elas aparecerao aqui como parte da trilha publica de accountability."
                />
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </AppLayout>
  );
}
