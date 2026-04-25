import { useEffect, useMemo, useState } from "react";
import { Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from "react-native";

import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SkeletonBlock } from "../components/common/Skeleton";
import { AppLayout } from "../components/layout/AppLayout";
import { DonationHistoryScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import type { DonationDto, IsoDateTimeString, PaginatedList, QueryParams, Uuid } from "../types/api";

const PAGE_SIZE = 10;
const INITIAL_PAGE_NUMBER = 0;
const fallbackProjectImage = require("../assets/splash-icon.png");
const monthNames = [
  "janeiro",
  "fevereiro",
  "mar\u00E7o",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

type DonationSection = {
  key: string;
  title: string;
  items: DonationDto[];
};

function buildQuery(pageNumber: number): QueryParams {
  return {
    pageNumber,
    pageSize: PAGE_SIZE,
  };
}

function parseSafeNumber(value: number | string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatEthValue(value: number | string) {
  const numericValue = parseSafeNumber(value);
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: numericValue === 0 ? 2 : 0,
    maximumFractionDigits: 6,
  }).format(numericValue);

  return `\u039E ${formattedValue} ETH`;
}

function formatReadableItemLabel(value: string) {
  return value
    .trim()
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDonationAmountLabel(amount: number | string, itemLabel?: string | null) {
  const normalizedItemLabel = itemLabel?.trim() || "Item";
  const numericAmount = parseSafeNumber(amount);

  if (normalizedItemLabel.toUpperCase() === "MONEY") {
    const ethLabel = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(numericAmount);

    return `${ethLabel} ETH`;
  }

  const amountLabel = Number.isInteger(numericAmount)
    ? String(numericAmount)
    : new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(numericAmount);

  return `${amountLabel}x ${formatReadableItemLabel(normalizedItemLabel)}`;
}

function formatSectionTitle(dateString: IsoDateTimeString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "SEM DATA";
  }

  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`.toUpperCase();
}

function formatDonationDate(dateString: IsoDateTimeString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = monthNames[date.getMonth()].slice(0, 3);
  const year = date.getFullYear();

  return `${day} ${month}. ${year}`;
}

function getStatusAccentColor(statusDesc?: string | null) {
  const normalizedValue = statusDesc?.trim().toLowerCase() ?? "";

  const exactStatusColors: Record<string, string> = {
    "awaiting transfer to trusted supplier": "#D1A22A",
    "awaiting blockchain confirmation": "#D1A22A",
    "transferred to trusted supplier": "#53A451",
    "awaiting transfer to ngo": "#D1A22A",
    "transferred to ngo": "#53A451",
    failed: "#D16464",
    "expired and refunded": "#7A8480",
    desconhecido: "#94A09A",
    unknown: "#94A09A",
  };

  if (normalizedValue in exactStatusColors) {
    return exactStatusColors[normalizedValue];
  }

  if (
    normalizedValue.includes("awaiting") ||
    normalizedValue.includes("aguard") ||
    normalizedValue.includes("pending") ||
    normalizedValue.includes("pendente") ||
    normalizedValue.includes("process") ||
    normalizedValue.includes("blockchain confirmation")
  ) {
    return "#D1A22A";
  }

  if (
    normalizedValue.includes("confirmed") ||
    normalizedValue.includes("transferred") ||
    normalizedValue.includes("confirmad") ||
    normalizedValue.includes("transferid") ||
    normalizedValue.includes("conclu")
  ) {
    return "#53A451";
  }

  if (
    normalizedValue.includes("falh") ||
    normalizedValue.includes("erro") ||
    normalizedValue.includes("failed") ||
    normalizedValue.includes("cancel")
  ) {
    return "#D16464";
  }

  if (
    normalizedValue.includes("refund") ||
    normalizedValue.includes("reembols") ||
    normalizedValue.includes("expir")
  ) {
    return "#7A8480";
  }

  return "#94A09A";
}

function groupDonationsByMonth(items: DonationDto[]) {
  const sectionsMap = new Map<string, DonationSection>();

  items.forEach((item) => {
    const sectionKey = formatSectionTitle(item.createdAt);
    const existingSection = sectionsMap.get(sectionKey);

    if (existingSection) {
      existingSection.items.push(item);
      return;
    }

    sectionsMap.set(sectionKey, {
      key: sectionKey,
      title: sectionKey,
      items: [item],
    });
  });

  return Array.from(sectionsMap.values());
}

export default function DonationHistoryPage({ navigation }: DonationHistoryScreenProps) {
  const [historyItems, setHistoryItems] = useState<DonationDto[]>([]);
  const [projectImages, setProjectImages] = useState<Record<Uuid, string | null>>({});
  const [pageState, setPageState] = useState<PaginatedList<DonationDto> | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        setIsLoadingInitial(true);
        setErrorMessage("");

        const result = await apiClient.getDonationHistory(buildQuery(INITIAL_PAGE_NUMBER));

        if (!isMounted) {
          return;
        }

        setHistoryItems(result.items);
        setPageState(result);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "N\u00E3o foi poss\u00EDvel carregar o hist\u00F3rico agora.");
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const projectIdsToLoad = Array.from(new Set(historyItems.map((item) => item.projectId))).filter(
      (projectId) => projectImages[projectId] === undefined,
    );

    if (projectIdsToLoad.length === 0) {
      return;
    }

    let isMounted = true;

    const loadProjectImages = async () => {
      const results = await Promise.allSettled(
        projectIdsToLoad.map(async (projectId) => {
          const project = await apiClient.getProjectById(projectId);
          return {
            projectId,
            imageUrl: project.mainImage?.trim() || null,
          };
        }),
      );

      if (!isMounted) {
        return;
      }

      setProjectImages((currentValue) => {
        const nextValue = { ...currentValue };

        results.forEach((result, index) => {
          const projectId = projectIdsToLoad[index];
          nextValue[projectId] = result.status === "fulfilled" ? result.value.imageUrl : null;
        });

        return nextValue;
      });
    };

    void loadProjectImages();

    return () => {
      isMounted = false;
    };
  }, [historyItems, projectImages]);

  const sections = useMemo(() => groupDonationsByMonth(historyItems), [historyItems]);
  const hasMorePages = pageState ? pageState.currentPage < pageState.totalPages : false;

  const handleLoadMore = async () => {
    if (!pageState || isLoadingMore || !hasMorePages) {
      return;
    }

    try {
      setIsLoadingMore(true);

      const nextPage = pageState.currentPage + 1;
      const result = await apiClient.getDonationHistory(buildQuery(nextPage));

      setHistoryItems((currentValue) => [...currentValue, ...result.items]);
      setPageState(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "N\u00E3o foi poss\u00EDvel carregar mais contribui\u00E7\u00F5es.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleOpenDonation = (donation: DonationDto) => {
    navigation.navigate("DonationTimeline", { donation });
  };

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (distanceFromBottom <= 180) {
      void handleLoadMore();
    }
  };

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="historico">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 pb-10"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View className="gap-2">
          <Text className="text-[38px] font-semibold leading-10 text-[#202124]">Histórico de contribuições</Text>
          <Text className="text-[14px] leading-5 text-[#6F7A75]">
            Acompanhe suas doações registradas e o status de cada contribuição.
          </Text>
        </View>

        {isLoadingInitial ? (
          <View className="gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={`history-skeleton-${index}`} className="rounded-[26px] border border-[#ECF0EB] bg-white px-4 py-4">
                <View className="flex-row items-start gap-3">
                  <SkeletonBlock width={56} height={56} borderRadius={16} />
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1 gap-2">
                        <SkeletonBlock height={16} width="62%" borderRadius={999} />
                      </View>
                      <SkeletonBlock height={26} width={78} borderRadius={999} />
                    </View>

                    <View className="mt-4 gap-3">
                      <SkeletonBlock height={24} width="52%" borderRadius={16} />
                      <View className="flex-row items-start gap-1.5">
                        <SkeletonBlock width={7} height={7} borderRadius={999} style={{ marginTop: 3 }} />
                        <SkeletonBlock height={10} width="44%" borderRadius={999} />
                      </View>
                    </View>

                    <View className="mt-3">
                      <SkeletonBlock height={28} width={94} borderRadius={999} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {!isLoadingInitial && errorMessage ? (
          <View className="rounded-[24px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-4">
            <Text className="text-[15px] font-semibold text-[#A33A3A]">Não foi possível carregar o histórico</Text>
            <Text className="mt-2 text-[13px] leading-5 text-[#8B5B5B]">{errorMessage}</Text>
          </View>
        ) : null}

        {!isLoadingInitial && !errorMessage && sections.length === 0 ? (
          <View className="rounded-[24px] border border-[#E8ECE7] bg-white px-5 py-6">
            <Text className="text-[18px] font-semibold text-[#202124]">Nenhuma contribuição encontrada</Text>
            <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">
              Assim que você concluir uma doação, ela vai aparecer aqui com o status atualizado.
            </Text>
          </View>
        ) : null}

        {!isLoadingInitial && !errorMessage
          ? sections.map((section) => (
              <View key={section.key} className="gap-3">
                <Text className="px-1 text-[10px] font-semibold uppercase tracking-[1.8px] text-[#96A19C]">
                  {section.title}
                </Text>

                {section.items.map((donation) => {
                  const accentColor = getStatusAccentColor(donation.statusDesc);
                  const imageUrl = projectImages[donation.projectId];

                  return (
                    <Pressable
                      key={donation.id}
                      className="rounded-[26px] border border-[#ECF0EB] bg-white px-4 py-4"
                      onPress={() => handleOpenDonation(donation)}
                      style={({ pressed }) => [
                        {
                          shadowColor: "#D9E6DA",
                          shadowOffset: { width: 0, height: 10 },
                          shadowOpacity: 0.16,
                          shadowRadius: 18,
                          elevation: 2,
                        },
                        pressed ? { opacity: 0.82 } : undefined,
                      ]}
                    >
                      <View className="flex-row items-start gap-3">
                        <View className="h-[56px] w-[56px] overflow-hidden rounded-[16px] bg-[#EEF3EE]">
                          <Image
                            source={imageUrl ? { uri: imageUrl } : fallbackProjectImage}
                            className="h-full w-full"
                            resizeMode="cover"
                          />
                        </View>

                        <View className="flex-1">
                          <View className="flex-row items-start justify-between gap-3">
                            <View className="flex-1">
                              <Text className="text-[16px] font-semibold leading-5 text-[#202124]">
                                {donation.projectName}
                              </Text>
                            </View>

                            <View className="items-end">
                              <View className="rounded-full bg-[#F4F7F4] px-2.5 py-1">
                                <Text className="text-[10px] font-medium text-[#7A8480]">
                                  {formatDonationDate(donation.createdAt)}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View className="mt-4 gap-3">
                            <Text className="text-[24px] font-semibold leading-7 text-[#202124]">
                              {formatDonationAmountLabel(donation.amount, donation.nameItem || donation.goalName)}
                            </Text>

                            <View className="flex-row items-start gap-1.5">
                              <View
                                className="mt-[3px] h-[7px] w-[7px] rounded-full"
                                style={{ backgroundColor: accentColor }}
                              />
                              <Text
                                className="max-w-[190px] text-[10px] font-semibold uppercase leading-[13px] tracking-[1px]"
                                style={{ color: accentColor }}
                              >
                                {donation.statusDesc}
                              </Text>
                            </View>
                          </View>

                          <View className="mt-3 flex-row items-center gap-2 self-start rounded-full bg-[#F4F7F4] px-2.5 py-1.5">
                            <Text className="text-[11px] font-medium leading-4 text-[#66706C]">
                              {formatEthValue(donation.totalCost)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))
          : null}

        {isLoadingMore && !isLoadingInitial && !errorMessage ? (
          <View className="items-center justify-center py-3">
            <LoadingSpinner
              className="items-center justify-center"
              label="Carregando mais contribuições..."
              labelClassName="mt-3 text-[12px] text-[#7A8480]"
              size="small"
            />
          </View>
        ) : null}
      </ScrollView>
    </AppLayout>
  );
}
