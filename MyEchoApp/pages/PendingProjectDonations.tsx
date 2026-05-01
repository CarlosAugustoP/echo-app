import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "../components/common/Button";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SkeletonBlock } from "../components/common/Skeleton";
import { AppLayout } from "../components/layout/AppLayout";
import type { PendingProjectDonationsScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import type { DonationDto, PaginatedList, QueryParams, VendorDto } from "../types/api";

const PAGE_SIZE = 10;
const INITIAL_PAGE_NUMBER = 0;

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

  return `${formattedValue} ETH`;
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
    return formatEthValue(numericAmount);
  }

  const amountLabel = Number.isInteger(numericAmount)
    ? String(numericAmount)
    : new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(numericAmount);

  return `${amountLabel}x ${formatReadableItemLabel(normalizedItemLabel)}`;
}

function formatDonationDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function PendingDonationSkeleton() {
  return (
    <View className="rounded-[26px] border border-[#ECF0EB] bg-white px-4 py-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-2">
          <SkeletonBlock height={16} width="58%" borderRadius={999} />
          <SkeletonBlock height={26} width="44%" borderRadius={16} />
        </View>
        <SkeletonBlock height={26} width={80} borderRadius={999} />
      </View>

      <View className="mt-4 gap-3">
        <SkeletonBlock height={14} width="72%" borderRadius={999} />
        <SkeletonBlock height={12} width="48%" borderRadius={999} />
      </View>
    </View>
  );
}

function showSuccessMessage() {
  Alert.alert("Fundos direcionados", "A transferencia foi iniciada com sucesso para o recebedor selecionado.");
}

export default function PendingProjectDonationsPage({ navigation, route }: PendingProjectDonationsScreenProps) {
  const { projectId, projectTitle } = route.params;
  const [donations, setDonations] = useState<DonationDto[]>([]);
  const [pageState, setPageState] = useState<PaginatedList<DonationDto> | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDonation, setSelectedDonation] = useState<DonationDto | null>(null);
  const [goalVendors, setGoalVendors] = useState<VendorDto[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [vendorErrorMessage, setVendorErrorMessage] = useState("");
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPendingDonations = async () => {
      try {
        setIsLoadingInitial(true);
        setErrorMessage("");

        const result = await apiClient.getPendingDonationsByProject(projectId, buildQuery(INITIAL_PAGE_NUMBER));

        if (!isMounted) {
          return;
        }

        setDonations(result.items);
        setPageState(result);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDonations([]);
        setPageState(null);
        setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar as doacoes pendentes.");
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }
    };

    void loadPendingDonations();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const hasMorePages = pageState ? pageState.currentPage < pageState.totalPages : false;
  const pendingDonations = useMemo(() => donations, [donations]);
  const selectedVendor = goalVendors.find((vendor) => vendor.id === selectedVendorId) ?? null;
  const selectedDonationAmountLabel = selectedDonation
    ? formatDonationAmountLabel(selectedDonation.amount, selectedDonation.nameItem || selectedDonation.goalName)
    : "";

  const handleLoadMore = async () => {
    if (!pageState || isLoadingInitial || isLoadingMore || !hasMorePages) {
      return;
    }

    try {
      setIsLoadingMore(true);

      const nextPage = pageState.currentPage + 1;
      const result = await apiClient.getPendingDonationsByProject(projectId, buildQuery(nextPage));

      setDonations((currentValue) => [...currentValue, ...result.items]);
      setPageState(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar mais doacoes pendentes.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleOpenAllocationModal = async (donation: DonationDto) => {
    try {
      setSelectedDonation(donation);
      setGoalVendors([]);
      setSelectedVendorId("");
      setVendorErrorMessage("");
      setIsLoadingVendors(true);

      const vendors = await apiClient.getVendorsByGoal(donation.goalId);

      setGoalVendors(vendors);
      setSelectedVendorId(vendors[0]?.id ?? "");
      setIsVendorDropdownOpen(false);
    } catch (error) {
      setVendorErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os recebedores para esta meta.");
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const handleCloseAllocationModal = () => {
    if (isSubmittingTransfer) {
      return;
    }

    setSelectedDonation(null);
    setGoalVendors([]);
    setSelectedVendorId("");
    setVendorErrorMessage("");
    setIsLoadingVendors(false);
    setIsVendorDropdownOpen(false);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedDonation || !selectedVendorId) {
      return;
    }

    try {
      setIsSubmittingTransfer(true);
      await apiClient.transferToVendor(selectedDonation.id, selectedVendorId);

      setDonations((currentValue) => currentValue.filter((donation) => donation.id !== selectedDonation.id));
      setPageState((currentValue) =>
        currentValue
          ? {
              ...currentValue,
              totalCount: Math.max(0, currentValue.totalCount - 1),
            }
          : currentValue,
      );
      handleCloseAllocationModal();
      showSuccessMessage();
    } catch (error) {
      setVendorErrorMessage(error instanceof Error ? error.message : "Nao foi possivel direcionar os fundos agora.");
    } finally {
      setIsSubmittingTransfer(false);
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
        contentContainerClassName="gap-5 pb-10"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <Pressable
              className="h-10 w-10 items-center justify-center"
              onPress={() => navigation.goBack()}
              style={({ pressed }) => (pressed ? { opacity: 0.72 } : undefined)}
            >
              <Ionicons name="arrow-back" size={20} color="#202124" />
            </Pressable>

            <Text className="flex-1 text-[30px] font-semibold leading-8 text-[#202124]">Doações pendentes</Text>
          </View>

          <Text className="text-[14px] leading-5 text-[#6F7A75]">
            {`Confira as contribuicoes aguardando alocacao em ${projectTitle}.`}
          </Text>
        </View>

        {isLoadingInitial ? (
          <View className="gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <PendingDonationSkeleton key={`pending-donation-skeleton-${index}`} />
            ))}
          </View>
        ) : null}

        {!isLoadingInitial && errorMessage ? (
          <View className="rounded-[24px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-4">
            <Text className="text-[15px] font-semibold text-[#A33A3A]">Nao foi possivel carregar as doacoes pendentes</Text>
            <Text className="mt-2 text-[13px] leading-5 text-[#8B5B5B]">{errorMessage}</Text>
          </View>
        ) : null}

        {!isLoadingInitial && !errorMessage && pendingDonations.length === 0 ? (
          <View className="rounded-[24px] border border-[#E8ECE7] bg-white px-5 py-6">
            <Text className="text-[18px] font-semibold text-[#202124]">Nenhuma doacao pendente</Text>
            <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">
              Assim que novas contribuicoes aguardarem alocacao, elas aparecerao aqui.
            </Text>
          </View>
        ) : null}

        {!isLoadingInitial && !errorMessage
          ? pendingDonations.map((donation) => (
              <View
                key={donation.id}
                className="rounded-[26px] border border-[#ECF0EB] bg-white px-4 py-4"
                style={{
                  shadowColor: "#D9E6DA",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.16,
                  shadowRadius: 18,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-[16px] font-semibold leading-5 text-[#202124]">{donation.goalName}</Text>
                    <Text className="mt-3 text-[24px] font-semibold leading-7 text-[#202124]">
                      {formatDonationAmountLabel(donation.amount, donation.nameItem || donation.goalName)}
                    </Text>
                  </View>

                  <View className="items-end gap-2">
                    <View className="rounded-full bg-[#FFF4DE] px-2.5 py-1">
                      <Text className="text-[10px] font-semibold uppercase tracking-[0.7px] text-[#B7791F]">Pendente</Text>
                    </View>
                    <Text className="text-[11px] font-medium text-[#7A8480]">{formatDonationDate(donation.createdAt)}</Text>
                  </View>
                </View>

                <View className="mt-4 flex-row items-center justify-between gap-3">
                  <View className="rounded-full bg-[#F4F7F4] px-3 py-1.5">
                    <Text className="text-[11px] font-medium leading-4 text-[#66706C]">
                      {formatEthValue(donation.totalCost)}
                    </Text>
                  </View>

                  <Pressable
                    className="flex-row items-center gap-2 rounded-full bg-[#EEF6EE] px-3.5 py-2"
                    onPress={() => {
                      void handleOpenAllocationModal(donation);
                    }}
                    style={({ pressed }) => (pressed ? { opacity: 0.82 } : undefined)}
                  >
                    <Text className="text-[12px] font-semibold text-[#2F7D32]">Abrir</Text>
                    <Ionicons name="arrow-forward" size={16} color="#2F7D32" />
                  </Pressable>
                </View>
              </View>
            ))
          : null}

        {isLoadingMore && !isLoadingInitial && !errorMessage ? (
          <View className="items-center justify-center py-3">
            <LoadingSpinner
              className="items-center justify-center"
              label="Carregando mais doacoes pendentes..."
              labelClassName="mt-3 text-[12px] text-[#7A8480]"
              size="small"
            />
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={Boolean(selectedDonation)} transparent animationType="fade" onRequestClose={handleCloseAllocationModal}>
        <View className="flex-1 justify-end bg-[rgba(17,24,19,0.42)] px-4 pb-4">
          <View className="rounded-[32px] bg-white px-5 py-5">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="text-[25px] font-semibold leading-7 text-[#202124]">Direcionar fundos</Text>
                <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">
                  Escolha o fornecedor confiavel que vai receber esta liberação.
                </Text>
              </View>

              <Pressable
                className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F6F3]"
                onPress={handleCloseAllocationModal}
                style={({ pressed }) => (pressed ? { opacity: 0.72 } : undefined)}
              >
                <Ionicons name="close" size={18} color="#202124" />
              </Pressable>
            </View>

            {selectedDonation ? (
              <View className="mt-4 overflow-hidden rounded-[26px] border border-[#DCE8DD] bg-[#F4FBF4]">
                <View className="px-4 py-4">
                  <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#6C8670]">Valor aguardando liberação</Text>
                  <Text className="mt-2 text-[36px] font-semibold leading-9 text-[#1E5C2A]">
                    {formatEthValue(selectedDonation.totalCost)}
                  </Text>
                  <Text className="mt-3 text-[13px] font-medium leading-5 text-[#506251]">
                    {selectedDonationAmountLabel}
                  </Text>
                </View>

                <View className="border-t border-[#E3ECE4] bg-white/70 px-4 py-3">
                  <Text className="text-[10px] font-semibold uppercase tracking-[0.9px] text-[#7E8B82]">Meta vinculada</Text>
                  <Text className="mt-1 text-[17px] font-semibold leading-6 text-[#202124]">{selectedDonation.goalName}</Text>
                </View>
              </View>
            ) : null}

            <View className="mt-4 rounded-[22px] border border-[#E6ECE7] bg-[#FBFCFB] px-4 py-4">
              <View className="flex-row items-start gap-3">
                <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-[#EAF3EA]">
                  <Ionicons name="shield-checkmark-outline" size={18} color="#2F7D32" />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-semibold text-[#202124]">Liberação pelo smart contract</Text>
                  <Text className="mt-1 text-[12px] leading-5 text-[#66706C]">
                    Os fundos serao liberados do smart contract para o fornecedor confiavel selecionado, preservando o rastreio e o destino previsto desta doacao.
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-5">
              <Text className="text-[12px] font-semibold uppercase tracking-[0.8px] text-[#7E8B82]">Quem vai receber</Text>

              {isLoadingVendors ? (
                <View className="items-center justify-center py-8">
                  <LoadingSpinner label="Carregando recebedores..." className="items-center justify-center" size="small" />
                </View>
              ) : vendorErrorMessage ? (
                <View className="mt-3 rounded-[18px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-4">
                  <Text className="text-[13px] leading-5 text-[#8B5B5B]">{vendorErrorMessage}</Text>
                </View>
              ) : goalVendors.length === 0 ? (
                <View className="mt-3 rounded-[18px] border border-[#E7ECE8] bg-[#FBFCFB] px-4 py-4">
                  <Text className="text-[13px] leading-5 text-[#6F7A75]">Nenhum recebedor elegivel foi encontrado para esta meta.</Text>
                </View>
              ) : (
                <View className="mt-3">
                  <Pressable
                    className={`rounded-[20px] border px-4 py-4 ${isVendorDropdownOpen ? "border-[#2F7D32] bg-[#F8FBF8]" : "border-[#DDE5DE] bg-white"}`}
                    onPress={() => setIsVendorDropdownOpen((currentValue) => !currentValue)}
                    style={({ pressed }) => (pressed ? { opacity: 0.9 } : undefined)}
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#7E8B82]">Fornecedor selecionado</Text>
                        <Text className="mt-1 text-[16px] font-semibold text-[#202124]">
                          {selectedVendor ? selectedVendor.name : "Selecione um fornecedor"}
                        </Text>
                        <Text className="mt-1 text-[12px] text-[#66706C]">
                          {selectedVendor ? formatReadableItemLabel(selectedVendor.typeItemSupply) : "Abra para ver as opcoes disponiveis"}
                        </Text>
                      </View>

                      <Ionicons
                        name={isVendorDropdownOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#2F7D32"
                      />
                    </View>
                  </Pressable>

                  {isVendorDropdownOpen ? (
                    <View className="mt-2 overflow-hidden rounded-[20px] border border-[#E1E8E2] bg-white">
                      {goalVendors.map((vendor, index) => {
                        const isSelected = selectedVendorId === vendor.id;

                        return (
                          <Pressable
                            key={vendor.id}
                            className={`px-4 py-4 ${isSelected ? "bg-[#EEF6EE]" : "bg-white"}`}
                            onPress={() => {
                              setSelectedVendorId(vendor.id);
                              setIsVendorDropdownOpen(false);
                            }}
                            style={({ pressed }) => (pressed ? { opacity: 0.86 } : undefined)}
                          >
                            <View className="flex-row items-center justify-between gap-3">
                              <View className="flex-1">
                                <Text className="text-[15px] font-semibold text-[#202124]">{vendor.name}</Text>
                                <Text className="mt-1 text-[12px] text-[#66706C]">
                                  {formatReadableItemLabel(vendor.typeItemSupply)}
                                </Text>
                              </View>

                              {isSelected ? (
                                <View className="h-7 w-7 items-center justify-center rounded-full bg-[#2F7D32]">
                                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                </View>
                              ) : null}
                            </View>
                            {index < goalVendors.length - 1 ? <View className="mt-4 h-px bg-[#EDF1EE]" /> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              )}
            </View>

            {selectedVendor ? (
              <View className="mt-5 rounded-[20px] border border-[#DDE9DE] bg-[#F7FBF7] px-4 py-4">
                <Text className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#6F8673]">Destino confirmado</Text>
                <Text className="mt-2 text-[17px] font-semibold text-[#202124]">{selectedVendor.name}</Text>
                <Text className="mt-1 text-[12px] leading-5 text-[#66706C]">
                  {selectedDonation ? `O valor de ${formatEthValue(selectedDonation.totalCost)} sera encaminhado para este fornecedor confiavel.` : ""}
                </Text>
              </View>
            ) : null}

            <View className="mt-5 flex-row gap-3">
              <View className="flex-1">
                <Button
                  label="Cancelar"
                  onPress={handleCloseAllocationModal}
                  variant="light"
                  className="w-full"
                  textClassName="text-[16px]"
                />
              </View>
              <View className="flex-1">
                <Button
                  label={isSubmittingTransfer ? "Direcionando..." : "Confirmar"}
                  onPress={() => {
                    void handleConfirmTransfer();
                  }}
                  disabled={!selectedVendorId || isLoadingVendors || isSubmittingTransfer}
                  className="w-full"
                  textClassName="text-[16px]"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
}
