import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { StateCard } from "../common/StateCard";
import { AppLayout } from "../layout/AppLayout";
import type { AppHomeScreenProps } from "../../navigation/types";
import { apiClient } from "../../services/apiClient";
import type { UserDto, VendorDto } from "../../types/api";

type AdminHomeContentProps = {
  currentUser: UserDto;
  navigation: AppHomeScreenProps["navigation"];
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

function PendingVendorCard({
  vendor,
  isSubmitting,
  onApprove,
  onDeny,
}: {
  vendor: VendorDto;
  isSubmitting: boolean;
  onApprove: () => void;
  onDeny: () => void;
}) {
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
          <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#FFF5E9]">
            <MaterialCommunityIcons name="clock-outline" size={20} color="#C37A14" />
          </View>

          <View className="flex-1 gap-1">
            <Text className="max-w-[190px] text-[17px] font-semibold leading-6 text-[#202124]">{vendor.name}</Text>
            <Text className="text-[12px] leading-5 text-[#6F7A75]">{formatSupplyLabel(vendor.typeItemSupply)}</Text>
            <Text className="text-[11px] leading-4 text-[#98A19C]">{formatDocumentLabel(vendor.document?.value)}</Text>
          </View>
        </View>

        <View className="rounded-full bg-[#FFF5E9] px-2.5 py-1.5">
          <Text className="text-[9px] font-bold uppercase tracking-[0.9px] text-[#C37A14]">PENDENTE</Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        <Pressable
          disabled={isSubmitting}
          onPress={onApprove}
          className={`flex-1 flex-row items-center justify-center rounded-[16px] px-4 py-3 ${isSubmitting ? "bg-[#DDE9DE]" : "bg-[#2F7D32]"}`}
          style={({ pressed }) => (!isSubmitting && pressed ? { opacity: 0.86 } : undefined)}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text className="ml-2 text-[13px] font-semibold text-white">Aprovar</Text>
            </>
          )}
        </Pressable>

        <Pressable
          disabled={isSubmitting}
          onPress={onDeny}
          className={`flex-1 flex-row items-center justify-center rounded-[16px] border px-4 py-3 ${isSubmitting ? "border-[#E6D2D2] bg-[#FFF5F5]" : "border-[#F1D1D1] bg-[#FFF7F7]"}`}
          style={({ pressed }) => (!isSubmitting && pressed ? { opacity: 0.86 } : undefined)}
        >
          <Ionicons name="close" size={16} color="#C13C3C" />
          <Text className="ml-2 text-[13px] font-semibold text-[#C13C3C]">Rejeitar</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AdminHomeContent({ currentUser }: AdminHomeContentProps) {
  const [pendingVendors, setPendingVendors] = useState<VendorDto[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [totalApproved, setTotalApproved] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittingVendorId, setSubmittingVendorId] = useState<string | null>(null);

  const loadPendingVendors = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const result = await apiClient.searchVendors({
        pageNumber: 0,
        pageSize: 50,
      });

      const nextPendingVendors = result.vendors.items.filter((vendor) => vendor.status === 1);
      setPendingVendors(nextPendingVendors);
      setTotalPending(result.totalPending);
      setTotalApproved(result.totalApproved);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os fornecedores pendentes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPendingVendors();
  }, []);

  const handleVendorDecision = async (vendor: VendorDto, decision: "approve" | "deny") => {
    try {
      setSubmittingVendorId(vendor.id);

      if (decision === "approve") {
        await apiClient.approveVendor(vendor.id);
        setTotalApproved((currentValue) => currentValue + 1);
      } else {
        await apiClient.denyVendor(vendor.id);
      }

      setPendingVendors((currentVendors) => currentVendors.filter((currentVendor) => currentVendor.id !== vendor.id));
      setTotalPending((currentValue) => Math.max(0, currentValue - 1));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel atualizar o fornecedor.";
      Alert.alert("Falha ao processar fornecedor", message);
    } finally {
      setSubmittingVendorId(null);
    }
  };

  const firstName = currentUser.name?.split(" ")[0] ?? "Admin";

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="inicio">
      <ScrollView className="flex-1" contentContainerClassName="gap-6 pb-10" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text className="text-[10px] font-semibold uppercase tracking-[1.8px] text-[#8AA1B6]">Painel EchoAdmin</Text>
          <Text className="text-[32px] font-semibold leading-9 text-[#202124]">Olá, {firstName}</Text>
          <Text className="max-w-[320px] text-[14px] leading-5 text-[#6F7A75]">
            Revise fornecedores pendentes e libere apenas os parceiros confiáveis para a rede Echo.
          </Text>
        </View>

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
              <Text className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#92D8FF]">Curadoria ativa</Text>
            </View>

            <Text className="text-[18px] font-semibold leading-6 text-white">A única missão aqui é aprovar fornecedores com critério.</Text>
            <Text className="max-w-[280px] text-[12px] leading-5 text-[#C2D7E7]">
              Um fornecedor aprovado pode ser vinculado a metas e receber fundos. Rejeições bloqueiam essa entrada na operação.
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-[20px] border border-[#E7ECE8] bg-white px-4 py-4">
            <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#8A9590]">Pendentes</Text>
            <Text className="mt-2 text-[28px] font-semibold leading-8 text-[#D28B2E]">{totalPending}</Text>
          </View>

          <View className="flex-1 rounded-[20px] border border-[#E7ECE8] bg-white px-4 py-4">
            <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#8A9590]">Aprovados</Text>
            <Text className="mt-2 text-[28px] font-semibold leading-8 text-[#2F7D32]">{totalApproved}</Text>
          </View>
        </View>

        {isLoading ? <StateCard kind="loading" message="Carregando fornecedores pendentes..." /> : null}
        {!isLoading && errorMessage ? (
          <StateCard kind="error" title="Falha ao carregar painel" message={errorMessage} />
        ) : null}

        {!isLoading && !errorMessage && pendingVendors.length === 0 ? (
          <View className="rounded-[24px] border border-[#E8ECE7] bg-white px-5 py-6">
            <Text className="text-[18px] font-semibold text-[#202124]">Nenhum fornecedor pendente</Text>
            <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">
              Tudo certo por enquanto. Assim que uma nova solicitação entrar, ela aparece aqui.
            </Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage ? (
          <View className="gap-3">
            {pendingVendors.map((vendor) => (
              <PendingVendorCard
                key={vendor.id}
                vendor={vendor}
                isSubmitting={submittingVendorId === vendor.id}
                onApprove={() => {
                  void handleVendorDecision(vendor, "approve");
                }}
                onDeny={() => {
                  void handleVendorDecision(vendor, "deny");
                }}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </AppLayout>
  );
}
