import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { Button } from "../components/common/Button";
import { AppLayout } from "../components/layout/AppLayout";
import { DonationDetailsScreenProps } from "../navigation/types";
import { useUserStore } from "../stores/userStore";
import { normalizePercentageProgress } from "../components/project-details/projectDetailsUtils";

const SEPOLIA_CHAIN_ID = "11155111";
const WEI_DECIMALS = 18n;
const WEI_FACTOR = 10n ** WEI_DECIMALS;

function formatMilestoneIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

function shortenAddress(value?: string | null) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return "0x---";
  }

  if (normalizedValue.length <= 12) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, 6)}...${normalizedValue.slice(-4)}`;
}

function sanitizeDecimalString(value: string) {
  return value.trim().replace(",", ".");
}

function parseEthStringToWei(value: string) {
  const sanitizedValue = sanitizeDecimalString(value);

  if (!/^\d+(\.\d+)?$/.test(sanitizedValue)) {
    return 0n;
  }

  const [wholePart, fractionalPart = ""] = sanitizedValue.split(".");
  const normalizedFraction = `${fractionalPart}000000000000000000`.slice(0, 18);
  const wholeWei = BigInt(wholePart || "0") * WEI_FACTOR;
  const fractionWei = BigInt(normalizedFraction || "0");

  return wholeWei + fractionWei;
}

function formatWeiToEthDisplay(value: bigint) {
  const wholePart = value / WEI_FACTOR;
  const fractionalPart = value % WEI_FACTOR;

  if (fractionalPart === 0n) {
    return wholePart.toString();
  }

  const normalizedFraction = fractionalPart.toString().padStart(18, "0").replace(/0+$/, "");
  return `${wholePart.toString()}.${normalizedFraction}`;
}

function buildMetaMaskSendLink(recipientAddress: string, valueWei: bigint) {
  return `https://metamask.app.link/send/${encodeURIComponent(recipientAddress)}@${SEPOLIA_CHAIN_ID}?value=${valueWei.toString()}`;
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value <= 1 ? value * 100 : value)));
}

export default function DonationDetailsPage({ route }: DonationDetailsScreenProps) {
  const { goal, goalIndex, smartContractAddress } = route.params;
  const { currentUser } = useUserStore();
  const [quantity, setQuantity] = useState(1);
  const [isOpeningWallet, setIsOpeningWallet] = useState(false);

  const walletAddress = currentUser?.walletAddress?.trim() || "";
  const goalTypeDescription = goal.goalType?.description?.trim() || "";
  const goalDescription = goal.description?.trim() || goalTypeDescription || "Selecione a quantidade para doar.";
  const itemLabel = goalTypeDescription || goal.title?.trim() || "Item";
  const normalizedContractAddress = smartContractAddress?.trim() || "";
  const unitPriceInput =
    goal.costPerUnit !== null && goal.costPerUnit !== undefined ? sanitizeDecimalString(String(goal.costPerUnit)) : "0";
  const unitPriceWei = parseEthStringToWei(unitPriceInput);
  const totalPriceWei = unitPriceWei * BigInt(quantity);
  const unitPriceDisplay = formatWeiToEthDisplay(unitPriceWei);
  const totalPriceDisplay = formatWeiToEthDisplay(totalPriceWei);

  const targetAmountValue = Number(goal.targetAmount);
  const currentAmountValue = Number(goal.currentAmount);
  const goalProgress = clampPercentage(Number(goal.progress));
  const progressPercentage = normalizePercentageProgress(goalProgress);
  const hasFiniteTarget = Number.isFinite(targetAmountValue) && targetAmountValue > 0;
  const hasFiniteCurrent = Number.isFinite(currentAmountValue);
  const isCompleted = progressPercentage >= 100 || (hasFiniteTarget && hasFiniteCurrent && currentAmountValue >= targetAmountValue);
  const milestoneLabel = `MILESTONE ${formatMilestoneIndex(goalIndex)} \u2022 ${isCompleted ? "COMPLETADO" : "EM PROGRESSO"}`;
  const maxQuantity =
    hasFiniteTarget && hasFiniteCurrent && targetAmountValue > currentAmountValue
      ? Math.max(1, Math.ceil(targetAmountValue - currentAmountValue))
      : 99;
  const contractLabel = `BLOCKCHAIN VERIFICADA: ${shortenAddress(normalizedContractAddress)}`;
  const walletLabel = walletAddress ? shortenAddress(walletAddress) : "Carteira n\u00E3o encontrada";
  const canConfirmDonation =
    walletAddress.length > 0 &&
    normalizedContractAddress.length > 0 &&
    totalPriceWei > 0n &&
    !isCompleted &&
    !isOpeningWallet;

  const handleConfirmDonation = async () => {
    if (!canConfirmDonation) {
      return;
    }

    const metaMaskUrl = buildMetaMaskSendLink(normalizedContractAddress, totalPriceWei);

    try {
      setIsOpeningWallet(true);
      await Linking.openURL(metaMaskUrl);
    } catch {
      Alert.alert(
        "N\u00E3o foi poss\u00EDvel abrir o MetaMask",
        "Verifique se o MetaMask est\u00E1 instalado no dispositivo e tente novamente.",
      );
    } finally {
      setIsOpeningWallet(false);
    }
  };

  const decreaseQuantity = () => {
    setQuantity((currentValue) => Math.max(1, currentValue - 1));
  };

  const increaseQuantity = () => {
    setQuantity((currentValue) => Math.min(maxQuantity, currentValue + 1));
  };

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="inicio">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 pb-10" showsVerticalScrollIndicator={false}>
        <View>
          <View className="flex-row items-center gap-2">
            <View className="h-[5px] w-[5px] rounded-full bg-[#2F7D32]" />
            <Text className="text-[10px] font-semibold uppercase tracking-[2px] text-[#2F7D32]">
              {"Etapa final"}
            </Text>
          </View>

          <Text className="mt-2 text-[34px] font-semibold leading-9 text-[#202124]">{"Doa\u00E7\u00E3o"}</Text>
          <Text className="mt-2 text-[14px] leading-5 text-[#6B7280]">{"Selecione o quanto deseja doar"}</Text>
        </View>

        <View className="overflow-hidden rounded-[22px] border border-[#E8ECE7] bg-white px-4 py-5">
          <Text className="text-[10px] font-semibold uppercase tracking-[2px] text-[#2F7D32]">{milestoneLabel}</Text>
          <Text className="mt-3 text-[19px] font-semibold leading-7 text-[#202124]">{goal.title?.trim() || " "}</Text>
          <Text className="mt-3 text-[13px] leading-[21px] text-[#5E6763]">
            {goalDescription}{" "}
            <Text className="font-medium text-[#46504C]">
              {`Atualmente em ${progressPercentage}% de conclus\u00E3o f\u00EDsica.`}
            </Text>
          </Text>

          <View className="mt-5 gap-4">
            <Text className="text-[12px] font-semibold text-[#525B57]">{itemLabel}</Text>

            <View className="flex-row items-center justify-between gap-4">
              <Text className="flex-1 text-[28px] font-semibold leading-8 text-[#2B5BB5]">
                {`\u039E ${unitPriceDisplay}`}
              </Text>

              <View className="flex-row items-center rounded-[16px] border border-[#E6EBE7] bg-[#FBFCFB] px-2 py-1">
                <Pressable
                  disabled={quantity <= 1}
                  className="h-10 w-10 items-center justify-center"
                  onPress={decreaseQuantity}
                  style={({ pressed }) =>
                    quantity <= 1 ? { opacity: 0.35 } : pressed ? { opacity: 0.7 } : undefined
                  }
                >
                  <Ionicons name="remove" size={18} color="#2B5BB5" />
                </Pressable>

                <Text className="min-w-[20px] text-center text-[16px] font-semibold text-[#202124]">{quantity}</Text>

                <Pressable
                  disabled={quantity >= maxQuantity}
                  className="h-10 w-10 items-center justify-center"
                  onPress={increaseQuantity}
                  style={({ pressed }) =>
                    quantity >= maxQuantity ? { opacity: 0.35 } : pressed ? { opacity: 0.7 } : undefined
                  }
                >
                  <Ionicons name="add" size={18} color="#2B5BB5" />
                </Pressable>
              </View>
            </View>
          </View>

          <View className="mt-6 rounded-[18px] border border-[#E3ECFD] bg-[#F6F9FF] px-4 py-4">
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="text-box-check-outline" size={16} color="#315FCB" />
              <Text className="text-[14px] font-semibold text-[#1D3D8F]">{"Resumo da Doa\u00E7\u00E3o"}</Text>
            </View>

            <View className="mt-4 gap-2">
              <View className="flex-row items-center justify-between gap-4">
                <Text className="flex-1 text-[12px] leading-5 text-[#5B6E97]">{`${quantity}x ${itemLabel}`}</Text>
                <Text className="text-[12px] font-medium text-[#5B6E97]">{`\u039E ${totalPriceDisplay}`}</Text>
              </View>

              <View className="mt-2 flex-row items-center justify-between gap-4 border-t border-[#D9E5FB] pt-3">
                <Text className="text-[22px] font-semibold text-[#202124]">{"Impacto Total"}</Text>
                <Text className="text-[34px] font-semibold leading-9 text-[#315FCB]">{`\u039E ${totalPriceDisplay}`}</Text>
              </View>
            </View>
          </View>

          <View className="mt-5 flex-row items-center gap-2">
            <MaterialCommunityIcons name="check-decagram-outline" size={14} color="#315FCB" />
            <Text className="text-[9px] font-medium tracking-[1.8px] text-[#315FCB]">{contractLabel}</Text>
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-[14px] font-semibold text-[#202124]">{"M\u00E9todo de Pagamento"}</Text>

          <View className="rounded-[22px] border border-[#E8ECE7] bg-white px-4 py-4">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-[14px] bg-[#EEF3FF]">
                <MaterialCommunityIcons name="wallet-outline" size={22} color="#315FCB" />
              </View>

              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-[#202124]">{walletLabel}</Text>
                <Text className="mt-1 text-[11px] leading-4 text-[#7A8480]">
                  {walletAddress ? walletAddress : "Atualize a carteira no seu perfil para concluir a doa\u00E7\u00E3o."}
                </Text>
                <Text className="mt-1 text-[11px] font-medium text-[#7A8480]">{"MetaMask \u00B7 Rede Sepolia"}</Text>
              </View>

              <Pressable
                className="px-2 py-2"
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              >
                <Text className="text-[13px] font-semibold text-[#315FCB]">{"Trocar"}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Button
          label={isOpeningWallet ? "Abrindo MetaMask..." : "Confirmar doa\u00E7\u00E3o"}
          onPress={() => {
            void handleConfirmDonation();
          }}
          disabled={!canConfirmDonation}
          className="min-h-[64px] rounded-[18px]"
          textClassName="text-[17px]"
          rightIcon={<MaterialCommunityIcons name="hand-heart-outline" size={18} color="#FFFFFF" />}
        />

        <View className="items-center gap-3">
          <View className="flex-row items-center gap-2 rounded-full bg-[#EEF6EE] px-3 py-2">
            <View className="h-[6px] w-[6px] rounded-full bg-[#2F7D32]" />
            <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#2F7D32]">
              {"Transa\u00E7\u00E3o pronta"}
            </Text>
          </View>

          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <Ionicons name="lock-closed-outline" size={12} color="#7A8480" />
              <Text className="text-[10px] font-medium uppercase tracking-[1px] text-[#7A8480]">{"Seguran\u00E7a SSL"}</Text>
            </View>

            <View className="flex-row items-center gap-1">
              <MaterialCommunityIcons name="shield-lock-outline" size={12} color="#7A8480" />
              <Text className="text-[10px] font-medium uppercase tracking-[1px] text-[#7A8480]">{"Criptografado"}</Text>
            </View>
          </View>

          <Text className="px-2 text-center text-[11px] leading-[18px] text-[#8A918D]">
            {
              "Sua contribui\u00E7\u00E3o \u00E9 processada com seguran\u00E7a. Um recibo digital ser\u00E1 vinculado ao seu hist\u00F3rico assim que a confirma\u00E7\u00E3o for conclu\u00EDda."
            }
          </Text>
        </View>
      </ScrollView>
    </AppLayout>
  );
}
