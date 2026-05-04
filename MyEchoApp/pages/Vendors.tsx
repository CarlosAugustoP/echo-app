import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { SkeletonBlock } from "../components/common/Skeleton";
import { StateCard } from "../components/common/StateCard";
import { AppLayout } from "../components/layout/AppLayout";
import type { VendorsScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import type { VendorDto } from "../types/api";

type VendorStatusTone = {
  label: string;
  badgeClassName: string;
  dotClassName: string;
  textClassName: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

function formatSupplyLabel(typeItemSupply?: string | null) {
  const normalizedValue = typeItemSupply?.trim();

  if (!normalizedValue) {
    return "Categoria nao informada";
  }

  return normalizedValue.replaceAll("_", " ");
}

function formatDocumentLabel(documentValue?: string | null) {
  const normalizedValue = documentValue?.trim();
  return normalizedValue && normalizedValue.length > 0 ? normalizedValue : "Documento nao informado";
}

function getVendorStatusTone(status: number | undefined): VendorStatusTone {
  if (status === 2) {
    return {
      label: "VERIFICADO",
      badgeClassName: "bg-[#ECF8EE]",
      dotClassName: "bg-[#2F7D32]",
      textClassName: "text-[#2F7D32]",
      iconName: "check-decagram",
    };
  }

  if (status === 1) {
    return {
      label: "PENDENTE",
      badgeClassName: "bg-[#FFF5E9]",
      dotClassName: "bg-[#F0A43B]",
      textClassName: "text-[#C37A14]",
      iconName: "clock-outline",
    };
  }

  if (status === 3) {
    return {
      label: "REJEITADO",
      badgeClassName: "bg-[#FFF1F1]",
      dotClassName: "bg-[#D44D4D]",
      textClassName: "text-[#C13C3C]",
      iconName: "close-octagon-outline",
    };
  }

  if (status === 4) {
    return {
      label: "DESABILITADO",
      badgeClassName: "bg-[#F2F4F7]",
      dotClassName: "bg-[#7B8794]",
      textClassName: "text-[#5B6673]",
      iconName: "minus-circle-outline",
    };
  }

  return {
    label: "EM ANALISE",
    badgeClassName: "bg-[#F2F4F7]",
    dotClassName: "bg-[#94A3B8]",
    textClassName: "text-[#64748B]",
    iconName: "progress-clock",
  };
}

function VendorHeroCard() {
  return (
    <View
      className="overflow-hidden rounded-[26px] border border-[#0E2230] bg-[#0D1822] px-5 py-5"
      style={{
        shadowColor: "#0A1622",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.28,
        shadowRadius: 24,
        elevation: 5,
      }}
    >
      <View className="absolute right-[-18px] top-[-18px] h-[110px] w-[110px] rounded-full bg-[#1B3144]/70" />
      <View className="absolute bottom-[-28px] left-[-18px] h-[128px] w-[128px] rounded-full bg-[#14334D]/45" />

      <View className="gap-3">
        <View className="self-start rounded-full bg-[#17344B] px-3 py-1.5">
          <Text className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#92D8FF]">Rede curada</Text>
        </View>

        <Text className="text-[15px] font-semibold uppercase tracking-[1.1px] text-white">
          Conheça a nossa rede de parceiros verificados.
        </Text>

        {/* <Text className="max-w-[260px] text-[12px] leading-5 text-[#C2D7E7]">
          Cada fornecedor exibido aqui foi mapeado para sustentar segurança, rastreabilidade e eficiência operacional, garantindo que os recursos doados cheguem ao seu destino final com total transparência e impacto social positivo.
        </Text> */}

        <View className="mt-2 rounded-[20px] border border-[#21445B] bg-[#102434] px-4 py-4">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-[14px] bg-[#193A54]">
              <MaterialCommunityIcons name="shield-check-outline" size={22} color="#9CD8FF" />
            </View>

            <View className="flex-1">
              <Text className="text-[12px] font-semibold uppercase tracking-[1px] text-[#9CD8FF]">
                Protocolo de confianca
              </Text>
              <Text className="mt-2 text-[12px] leading-5 text-[#C8D9E6]">
                Todos os fornecedores passam por analise documental an rede ECHO antes de aparecerem na vitrine da ONG.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function VendorCard({ vendor }: { vendor: VendorDto }) {
  const statusTone = getVendorStatusTone(vendor.status);

  const handleOpenVendorPreview = () => {
    const message = [
      `Categoria: ${formatSupplyLabel(vendor.typeItemSupply)}`,
      `Documento: ${formatDocumentLabel(vendor.document?.value)}`,
      `Status: ${statusTone.label}`,
    ].join("\n");

    Alert.alert(vendor.name, message);
  };

  return (
    <View
      className="rounded-[24px] border border-[#E8ECE7] bg-white px-4 py-4"
      style={{
        shadowColor: "#D8E3D9",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 2,
      }}
    >
        <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-[#F8F6EE]">
            <MaterialCommunityIcons name="briefcase-outline" size={18} color="#D79C33" />
          </View>

          <View className="gap-1">
            <Text className="max-w-[180px] text-[17px] font-semibold leading-6 text-[#202124]">{vendor.name}</Text>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="document-text-outline" size={12} color="#98A19C" />
              <Text className="text-[11px] leading-4 text-[#98A19C]">{formatDocumentLabel(vendor.document?.value)}</Text>
            </View>
          </View>
        </View>

        <View className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 ${statusTone.badgeClassName}`}>
          <View className={`h-2 w-2 rounded-full ${statusTone.dotClassName}`} />
          <Text className={`text-[9px] font-bold uppercase tracking-[0.9px] ${statusTone.textClassName}`}>
            {statusTone.label}
          </Text>
        </View>
      </View>

      <View className="mt-4 h-px bg-[#EDF1EE]" />

      <View className="mt-3 flex-row items-end justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-[10px] font-semibold uppercase tracking-[0.9px] text-[#9BA39F]">Impacto</Text>
          <Text className="text-[12px] leading-5 text-[#667085]">{formatSupplyLabel(vendor.typeItemSupply)}</Text>
        </View>

        <Pressable onPress={handleOpenVendorPreview} style={({ pressed }) => (pressed ? { opacity: 0.72 } : undefined)}>
          <Text className="text-[10px] font-bold uppercase tracking-[1px] text-[#7AA35A]">Ver perfil</Text>
        </Pressable>
      </View>
    </View>
  );
}

function VendorCardSkeleton() {
  return (
    <View className="rounded-[24px] border border-[#E8ECE7] bg-white px-4 py-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-row items-start gap-3">
          <SkeletonBlock width={40} height={40} borderRadius={12} />
          <View className="gap-2">
            <SkeletonBlock width={170} height={18} borderRadius={999} />
            <SkeletonBlock width={110} height={12} borderRadius={999} />
          </View>
        </View>
        <SkeletonBlock width={82} height={26} borderRadius={999} />
      </View>

      <View className="mt-4 h-px bg-[#EDF1EE]" />

      <View className="mt-3 flex-row items-end justify-between gap-3">
        <View className="gap-2">
          <SkeletonBlock width={52} height={10} borderRadius={999} />
          <SkeletonBlock width={130} height={12} borderRadius={999} />
        </View>
        <SkeletonBlock width={70} height={12} borderRadius={999} />
      </View>
    </View>
  );
}

export default function VendorsPage({}: VendorsScreenProps) {
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [totalApproved, setTotalApproved] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setErrorMessage("");
        }

        const result = await apiClient.searchVendors({
          pageNumber: 0,
          pageSize: 50,
          search: searchValue.trim() || undefined,
        });

        if (!isMounted) {
          return;
        }

        setVendors(result.vendors.items);
        setTotalApproved(result.totalApproved);
        setTotalPending(result.totalPending);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setVendors([]);
        setTotalApproved(0);
        setTotalPending(0);
        setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os fornecedores.");
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
  }, [searchValue]);

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="fornecedores">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 pb-10" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-[10px] font-semibold uppercase tracking-[1.5px] text-[#8AA1B6]">
              Transparencia e impacto
            </Text>

            <View className="h-9 w-9 items-center justify-center rounded-[12px] bg-[#2F7D32]">
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </View>
          </View>

          <View className="gap-1">
            <Text className="text-[35px] font-semibold leading-10 text-[#202124]">Lista de</Text>
            <Text className="text-[39px] font-semibold leading-10 text-[#2F7D32]">Fornecedores</Text>
          </View>

          <Text className="max-w-[320px] text-[13px] leading-5 text-[#6F7A75]">
            Nossa rede de parceiros verificados garante que cada recurso chegue ao seu destino final com total seguranca
            e rastreabilidade blockchain.
          </Text>
        </View>

        <VendorHeroCard />

        <View className="rounded-[22px] border border-[#E9EEEA] bg-white px-4 py-2.5">
          <View className="flex-row items-center gap-3">
            <Ionicons name="search-outline" size={18} color="#9AA59F" />
            <TextInput
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="Buscar por nome..."
              placeholderTextColor="#A1AAA5"
              className="flex-1 py-2 text-[14px] text-[#202124]"
            />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-[20px] border border-[#E7ECE8] bg-white px-4 py-4">
            <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#8A9590]">Verificados</Text>
            <Text className="mt-2 text-[28px] font-semibold leading-8 text-[#2F7D32]">{totalApproved}</Text>
          </View>

          <View className="flex-1 rounded-[20px] border border-[#E7ECE8] bg-white px-4 py-4">
            <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#8A9590]">Pendentes</Text>
            <Text className="mt-2 text-[28px] font-semibold leading-8 text-[#D28B2E]">{totalPending}</Text>
          </View>
        </View>

        {isLoading ? (
          <View className="gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <VendorCardSkeleton key={`vendor-skeleton-${index}`} />
            ))}
          </View>
        ) : null}

        {!isLoading && errorMessage ? <StateCard kind="error" title="Falha ao carregar fornecedores" message={errorMessage} /> : null}

        {!isLoading && !errorMessage && vendors.length === 0 ? (
          <View className="rounded-[24px] border border-[#E8ECE7] bg-white px-5 py-6">
            <Text className="text-[18px] font-semibold text-[#202124]">Nenhum fornecedor encontrado</Text>
            <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">
              Ajuste a busca para explorar outros parceiros homologados.
            </Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage ? (
          <View className="gap-3">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </AppLayout>
  );
}
