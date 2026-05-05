import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

import { Button } from "../components/common/Button";
import { AppLayout } from "../components/layout/AppLayout";
import type { VendorOnboardingStatusScreenProps } from "../navigation/types";

function formatCreatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function shortenAddress(value: string) {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= 18) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, 10)}...${normalizedValue.slice(-6)}`;
}

export default function VendorOnboardingStatusPage({ navigation, route }: VendorOnboardingStatusScreenProps) {
  const { companyName, walletAddress, createdAt } = route.params;
  const createdAtLabel = formatCreatedAt(createdAt);

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="fornecedores">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 pb-10" showsVerticalScrollIndicator={false}>
        <View className="items-center pt-1">
          <View
            className="h-[78px] w-[78px] items-center justify-center rounded-full bg-[#9CE790]"
            style={{
              shadowColor: "#7DDB7A",
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.3,
              shadowRadius: 24,
              elevation: 6,
            }}
          >
            <View className="h-[42px] w-[42px] items-center justify-center rounded-full bg-[#1E6831]">
              <Ionicons name="checkmark" size={24} color="#FFFFFF" />
            </View>
          </View>

          <Text className="mt-5 text-center text-[30px] font-semibold leading-9 text-[#202124]">Parceiro criado com</Text>
          <Text className="text-center text-[30px] font-semibold leading-9 text-[#202124]">sucesso!</Text>

          <Text className="mt-4 max-w-[310px] text-center text-[13px] leading-5 text-[#6F7A75]">
            As informacoes foram registradas no Living Ledger e agora passarao por uma auditoria de conformidade
            blockchain.
          </Text>
        </View>

        <View className="rounded-[24px] bg-white px-4 py-5">
          <View className="gap-1">
            <Text className="text-[9px] font-semibold uppercase tracking-[1.1px] text-[#89A2C8]">Fase atual</Text>
            <Text className="text-[28px] font-semibold leading-8 text-[#202124]">Em análise</Text>
          </View>
        </View>

        <View className="rounded-[24px] bg-white px-4 py-5">
          <Text className="text-[13px] font-semibold text-[#202124]">Resumo do Cadastro</Text>

          <View className="mt-4 gap-4">
            <View>
              <Text className="text-[9px] font-semibold uppercase tracking-[0.9px] text-[#8E9892]">Nome da empresa</Text>
              <Text className="mt-1 text-[15px] font-semibold text-[#202124]">{companyName}</Text>
            </View>

            <View>
              <Text className="text-[9px] font-semibold uppercase tracking-[0.9px] text-[#8E9892]">Carteira ETH vinculada</Text>
              <View className="mt-1 flex-row items-center gap-2">
                <MaterialCommunityIcons name="wallet-outline" size={14} color="#5D79D3" />
                <Text className="text-[12px] text-[#5D79D3]">{shortenAddress(walletAddress)}</Text>
              </View>
            </View>

            <View>
              <Text className="text-[9px] font-semibold uppercase tracking-[0.9px] text-[#8E9892]">Data da submissao</Text>
              <Text className="mt-1 text-[15px] font-semibold text-[#202124]">{createdAtLabel}</Text>
            </View>
          </View>
        </View>

        <View className="gap-3">
          <Button
            label="Ir para Dashboard"
            onPress={() => navigation.replace("Dashboard")}
            className="min-h-[58px] rounded-[18px]"
            textClassName="text-[15px]"
            rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
          />

          <Button
            label="Ver Status da Verificacao"
            onPress={() => navigation.replace("Vendors")}
            variant="light"
            className="min-h-[58px] rounded-[18px]"
            textClassName="text-[15px]"
          />
        </View>
      </ScrollView>
    </AppLayout>
  );
}
