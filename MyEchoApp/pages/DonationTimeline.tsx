import { useEffect, useState } from "react";
import { Alert, Image, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { Button } from "../components/common/Button";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { AppLayout } from "../components/layout/AppLayout";
import { DonationTimelineScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import type { DonationEventDto, ProjectDto, VendorDto } from "../types/api";

const fallbackProjectImage = require("../assets/splash-icon.png");
const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;

type TimelineVisual = {
  accentColor: string;
  cardBackgroundColor: string;
  iconBackgroundColor: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
};

type ExtractedHashContent = {
  displayMessage: string;
  transactionHash: string | null;
};

function formatDonationDateTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = monthNames[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month}. ${hours}:${minutes} UTC`;
}

function formatEthValue(value: number | string) {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: safeValue === 0 ? 2 : 0,
    maximumFractionDigits: 6,
  }).format(safeValue);

  return `Ξ ${formattedValue} ETH`;
}

function formatReadableItemLabel(amount: number | string, itemLabel?: string | null) {
  const normalizedItemLabel = itemLabel?.trim() || "Item";
  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;

  if (normalizedItemLabel.toUpperCase() === "MONEY") {
    return formatEthValue(safeAmount);
  }

  return `${safeAmount}x ${normalizedItemLabel
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())}`;
}

function showAuditNotice() {
  const title = "Relatório de auditoria";
  const message = "Esse download ainda será ligado ao arquivo final da auditoria.";

  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

function extractHashContent(message: string): ExtractedHashContent {
  const transactionHashMatch = message.match(/0x[a-fA-F0-9]{64}/);

  if (!transactionHashMatch) {
    return {
      displayMessage: message,
      transactionHash: null,
    };
  }

  const transactionHash = transactionHashMatch[0];
  const displayMessage = message
    .replace(new RegExp(`\\s*Hash:\\s*${transactionHash}`, "i"), "")
    .replace(new RegExp(`:\\s*${transactionHash}`, "i"), "")
    .trim();

  return {
    displayMessage,
    transactionHash,
  };
}

function buildSepoliaTransactionUrl(transactionHash: string) {
  return `https://sepolia.etherscan.io/tx/${transactionHash}`;
}

function shortenTransactionHash(transactionHash: string) {
  return `${transactionHash.slice(0, 8)}...${transactionHash.slice(-4)}`;
}

async function openTransactionOnSepolia(transactionHash: string) {
  const transactionUrl = buildSepoliaTransactionUrl(transactionHash);

  try {
    if (Platform.OS === "web") {
      window.open(transactionUrl, "_blank", "noopener,noreferrer");
      return;
    }

    await Linking.openURL(transactionUrl);
  } catch {
    const title = "N�o foi poss�vel abrir a transa��o";
    const message = "N�o conseguimos abrir o explorador da Sepolia para este hash agora.";

    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  }
}

function getTimelineVisual(event: DonationEventDto): TimelineVisual {
  switch (event.status) {
    case 0:
      return {
        accentColor: "#2F7D32",
        cardBackgroundColor: "#FFFFFF",
        iconBackgroundColor: "#2F7D32",
        iconName: "office-building-marker-outline",
      };
    case 1:
      return {
        accentColor: "#2F7D32",
        cardBackgroundColor: "#FFFFFF",
        iconBackgroundColor: "#2F7D32",
        iconName: "check-decagram",
      };
    case 2:
      return {
        accentColor: "#2F7D32",
        cardBackgroundColor: "#FFFFFF",
        iconBackgroundColor: "#2F7D32",
        iconName: "hand-heart",
      };
    case 3:
      return {
        accentColor: "#315FCB",
        cardBackgroundColor: "#FFFFFF",
        iconBackgroundColor: "#315FCB",
        iconName: "link-variant",
      };
    case 4:
      return {
        accentColor: "#315FCB",
        cardBackgroundColor: "#FFFFFF",
        iconBackgroundColor: "#315FCB",
        iconName: "store-check-outline",
      };
    case 5:
      return {
        accentColor: "#C94D4D",
        cardBackgroundColor: "#FFFFFF",
        iconBackgroundColor: "#C94D4D",
        iconName: "alert-circle-outline",
      };
    case 6:
      return {
        accentColor: "#7A8480",
        cardBackgroundColor: "#FFFFFF",
        iconBackgroundColor: "#7A8480",
        iconName: "backup-restore",
      };
    default:
      return {
        accentColor: "#7A8480",
        cardBackgroundColor: "#FFFFFF",
        iconBackgroundColor: "#7A8480",
        iconName: "timeline-clock-outline",
      };
  }
}

export default function DonationTimelinePage({ navigation, route }: DonationTimelineScreenProps) {
  const { donation } = route.params;
  const [events, setEvents] = useState<DonationEventDto[]>([]);
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [vendor, setVendor] = useState<VendorDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadTimeline = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [eventsResult, projectResult] = await Promise.allSettled([
          apiClient.getDonationTimeline(donation.id),
          apiClient.getProjectById(donation.projectId),
        ]);

        if (!isMounted) {
          return;
        }

        if (eventsResult.status === "fulfilled") {
          const orderedEvents = [...eventsResult.value].sort(
            (leftEvent, rightEvent) => new Date(leftEvent.timestamp).getTime() - new Date(rightEvent.timestamp).getTime(),
          );
          setEvents(orderedEvents);
        } else {
          throw eventsResult.reason;
        }

        if (projectResult.status === "fulfilled") {
          setProject(projectResult.value);
        }

        if (donation.transferredToVendorId) {
          const vendorResult = await apiClient.getVendor(donation.transferredToVendorId);

          if (isMounted) {
            setVendor(vendorResult);
          }
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar os eventos da doação.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTimeline();

    return () => {
      isMounted = false;
    };
  }, [donation.id, donation.projectId]);

  const latestStatus = events.at(-1)?.statusString || donation.statusDesc;
  const projectImageUrl = project?.mainImage?.trim() || null;

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="historico">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 pb-10" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          <Text className="text-[10px] font-semibold uppercase tracking-[2px] text-[#6B86D8]">
            {"Transparência em tempo real"}
          </Text>

          <View className="flex-row items-center gap-3">
            <Pressable
              className="h-10 w-10 items-center justify-center"
              onPress={() => navigation.goBack()}
              style={({ pressed }) => (pressed ? { opacity: 0.72 } : undefined)}
            >
              <Ionicons name="arrow-back" size={20} color="#202124" />
            </Pressable>

            <Text className="text-[32px] font-semibold leading-8 text-[#202124]">{"Livro-Razão"}</Text>
          </View>

          <Text className="text-[14px] leading-6 text-[#6F7A75]">
            {"Acompanhe seu impacto através do tecido digital. Cada centavo é rastreado, verificado e entregue com precisão cirúrgica."}
          </Text>
        </View>

        {isLoading ? (
          <View className="min-h-[280px] items-center justify-center rounded-[24px] border border-[#E8ECE7] bg-white">
            <LoadingSpinner label="Carregando eventos da doação..." className="items-center justify-center" />
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <View className="rounded-[24px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-4">
            <Text className="text-[15px] font-semibold text-[#A33A3A]">{"Não foi possível carregar o livro-razão"}</Text>
            <Text className="mt-2 text-[13px] leading-5 text-[#8B5B5B]">{errorMessage}</Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage ? (
          <View className="relative gap-0" style={{ paddingLeft: 0 }}>
            {events.length > 0 ? (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 21,
                  top: 22,
                  bottom: 34,
                  width: 2,
                  backgroundColor: "#D8E3DB",
                }}
              />
            ) : null}

            {events.map((event, index) => {
              const visual = getTimelineVisual(event);
              const { displayMessage, transactionHash } = extractHashContent(event.message);
              const shouldRenderVendorCard = event.status === 4 && vendor;
              const shouldRenderDonationSummaryCard = index === 0;

              return (
                <View key={`${event.status}-${event.timestamp}-${index}`} className="flex-row gap-4">
                  <View className="w-11 items-center">
                    <View
                      className="h-11 w-11 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: visual.iconBackgroundColor,
                        shadowColor: visual.iconBackgroundColor,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.26,
                        shadowRadius: 14,
                        elevation: 5,
                      }}
                    >
                      <MaterialCommunityIcons name={visual.iconName} size={20} color="#FFFFFF" />
                    </View>
                  </View>

                  <View className="flex-1 pb-6">
                    <View className="flex-row items-start justify-between gap-3">
                      <Text className="flex-1 pt-2 text-[24px] font-semibold leading-7 text-[#202124]">
                        {event.statusString || "Evento desconhecido"}
                      </Text>
                      <View className="mt-2 rounded-full bg-[#F4F7F4] px-2.5 py-1">
                        <Text className="text-[10px] font-medium text-[#7A8480]">
                          {formatDonationDateTime(event.timestamp)}
                        </Text>
                      </View>
                    </View>

                    <View
                      className="mt-3 rounded-[20px] border border-[#E7ECE7] px-4 py-4"
                      style={{ backgroundColor: visual.cardBackgroundColor }}
                    >
                      {shouldRenderDonationSummaryCard ? (
                        <View className="flex-row items-start gap-3">
                          <View className="h-[60px] w-[60px] overflow-hidden rounded-[18px] bg-[#EEF3EE]">
                            <Image
                              source={projectImageUrl ? { uri: projectImageUrl } : fallbackProjectImage}
                              className="h-full w-full"
                              resizeMode="cover"
                            />
                          </View>

                          <View className="flex-1">
                            <View className="flex-row items-start justify-between gap-3">
                              <View className="flex-1">
                                <Text className="text-[15px] font-semibold leading-6 text-[#202124]">
                                  {donation.projectName}
                                </Text>
                                <Text className="mt-1 text-[13px] font-bold text-[#2F7D32]">
                                  {formatEthValue(donation.totalCost)}

                                </Text>
                              </View>

                              <View className="items-end">

                                <Text className="text-[15px] font-normal  text-[#7A8480]">
                                  {formatReadableItemLabel(donation.amount, donation.nameItem)}

                                </Text>
                              </View>
                            </View>


                          </View>
                        </View>
                      ) : shouldRenderVendorCard ? (
                        <>
                          <Text className="css-text-146c3p1 text-[11px] leading-5 text-[#6F7A75]">{event.message}</Text>
                          <View className="rounded-[18px] border border-dashed border-[#CCD7CF] bg-white px-4 py-4 mt-4">
                            <View className="flex-row items-start justify-between gap-3">
                              <View className="flex-row items-start gap-3">
                                <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-[#EEF3FF]">
                                  <MaterialCommunityIcons name="storefront-outline" size={20} color="#4F7BE0" />
                                </View>

                                <View className="flex-1">
                                  <Text className="text-[10px] font-medium uppercase tracking-[0.8px] text-[#9AA39E]">
                                    Beneficiário
                                  </Text>
                                  <Text className="mt-1 text-[14px] font-semibold leading-5 text-[#202124]">
                                    {vendor.name}
                                  </Text>
                                </View>
                              </View>

                              <View className="h-7 w-7 items-center justify-center rounded-full bg-[#E8F7EA]">
                                <Ionicons name="checkmark" size={16} color="#2F7D32" />
                              </View>
                            </View>

                            <View className="mt-5 flex-row items-end justify-between gap-4">
                              <View>
                                <Text className="text-[11px] leading-4 text-[#8B9590]">Pagamento</Text>
                                <Text className="text-[11px] leading-4 text-[#8B9590]">Liberado</Text>
                              </View>

                              <Text className="text-[24px] font-semibold leading-7 text-[#202124]">
                                {formatEthValue(donation.totalCost)}
                              </Text>
                            </View>
                          </View>
                        </>
                      ) : (
                        <Text className="text-[11px] leading-5 text-[#6F7A75]">{displayMessage}</Text>
                      )}

                      {!shouldRenderVendorCard && transactionHash ? (
                        <View className="mt-4 flex-row items-center justify-between gap-3 rounded-[14px] bg-[#F7F9F8] px-3 py-2.5">
                          <Text className="flex-1 text-[10px] font-medium tracking-[0.4px] text-[#7A8480]">
                            {`TX: ${shortenTransactionHash(transactionHash)}`}
                          </Text>
                          <Pressable
                            className="rounded-full bg-[#EAF0FF] px-3 py-2"
                            onPress={() => {
                              void openTransactionOnSepolia(transactionHash);
                            }}
                            style={({ pressed }) => (pressed ? { opacity: 0.74 } : undefined)}
                          >
                            <Text className="text-[10px] font-semibold text-[#315FCB]">Ver tx</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}

            {events.length === 0 ? (
              <View className="rounded-[24px] border border-[#E8ECE7] bg-white px-5 py-6">
                <Text className="text-[18px] font-semibold text-[#202124]">{"Nenhum evento registrado"}</Text>
                <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">
                  {"Essa doação ainda não possui movimentações de auditoria disponíveis."}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </AppLayout>
  );
}
