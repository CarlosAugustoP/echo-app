import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { Button } from "../components/common/Button";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { AppLayout } from "../components/layout/AppLayout";
import { normalizePercentageProgress } from "../components/project-details/projectDetailsUtils";
import { DonationDetailsScreenProps } from "../navigation/types";
import { ApiServiceError } from "../services/ApiService";
import { apiClient } from "../services/apiClient";
import { sendSepoliaEthDonation } from "../services/donationWallet";
import { useUserStore } from "../stores/userStore";
import type { DonationRequestDto } from "../types/api";

const WEI_DECIMALS = 18n;
const WEI_FACTOR = 10n ** WEI_DECIMALS;
const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

type DonationFlowStep = "idle" | "waiting_sync" | "registering" | "success";

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

function parseDecimalNumber(value: string) {
  const parsedValue = Number(sanitizeDecimalString(value));
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function isMoneyGoalType(goalTypeName?: string | null) {
  return goalTypeName?.trim().toLowerCase() === "money";
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value <= 1 ? value * 100 : value)));
}

function isUserRejectedError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const errorCode = "code" in error ? (error as { code?: unknown }).code : undefined;
  const errorMessage = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";

  return errorCode === 4001 || /user rejected|cancelad|rejeitad/i.test(errorMessage);
}

function getDonationErrorMessage(error: unknown) {
  if (isUserRejectedError(error)) {
    return "A transa\u00E7\u00E3o foi cancelada na carteira.";
  }

  if (error instanceof ApiServiceError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "N\u00E3o foi poss\u00EDvel concluir a doa\u00E7\u00E3o agora. Tente novamente em instantes.";
}

function showDonationDialog(
  title: string,
  message: string,
  confirmAction?: {
    label: string;
    onPress?: () => void;
  },
) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    confirmAction?.onPress?.();
    return;
  }

  Alert.alert(
    title,
    message,
    confirmAction
      ? [
          {
            text: confirmAction.label,
            onPress: confirmAction.onPress,
          },
        ]
      : undefined,
  );
}

function wait(delayInMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delayInMs);
  });
}

function waitWithInterval(delayInMs: number) {
  return new Promise<void>((resolve) => {
    const intervalId = setInterval(() => {
      clearInterval(intervalId);
      resolve();
    }, delayInMs);
  });
}

async function registerDonationWithRetry(payload: DonationRequestDto) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const donationRegistered = await apiClient.donate(payload);

      if (!donationRegistered) {
        throw new Error("A API n\u00E3o confirmou o registro da doa\u00E7\u00E3o.");
      }

      return;
    } catch (error) {
      lastError = error;

      if (attempt === 2) {
        break;
      }

      await wait((attempt + 1) * 1200);
    }
  }

  throw lastError ?? new Error("A doa\u00E7\u00E3o n\u00E3o pode ser registrada.");
}

function getFlowContent(step: DonationFlowStep) {
  switch (step) {
    case "waiting_sync":
      return {
        badge: "AGUARDANDO REDE",
        description:
          "Sua transa\u00E7\u00E3o j\u00E1 foi enviada na Sepolia. Estamos aguardando alguns segundos para sincronizar o hash antes de registrar a doa\u00E7\u00E3o.",
        headline: "Estamos confirmando sua doa\u00E7\u00E3o",
        summaryTitle: "Doa\u00E7\u00E3o em valida\u00E7\u00E3o",
        supporting:
          "Assim que a rede estabilizar essa transa\u00E7\u00E3o, seguimos automaticamente para o registro da sua contribui\u00E7\u00E3o.",
      };
    case "registering":
      return {
        badge: "VALIDANDO API",
        description:
          "A blockchain j\u00E1 respondeu. Agora estamos confirmando sua doa\u00E7\u00E3o na API da Echo para vincular o recibo ao seu hist\u00F3rico.",
        headline: "Quase l\u00E1",
        summaryTitle: "Registrando doa\u00E7\u00E3o",
        supporting:
          "Esse passo garante que seu impacto fique vis\u00EDvel no ecossistema Echo com rastreabilidade completa.",
      };
    case "success":
      return {
        badge: "VERIFICADO",
        description:
          "Cada contribui\u00E7\u00E3o \u00E9 registrada no nosso livro-raz\u00E3o, garantindo que o seu impacto chegue de forma transparente e humana.",
        headline: "Obrigado!",
        summaryTitle: "Doa\u00E7\u00E3o conclu\u00EDda",
        supporting: "Seu apoio est\u00E1 transformando realidades no ecossistema Echo.",
      };
    default:
      return null;
  }
}

export default function DonationDetailsPage({ navigation, route }: DonationDetailsScreenProps) {
  const { goal, goalIndex, projectTitle, smartContractAddress } = route.params;
  const { currentUser } = useUserStore();

  const [quantity, setQuantity] = useState(1);
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [flowStep, setFlowStep] = useState<DonationFlowStep>("idle");
  const [lastTransactionHash, setLastTransactionHash] = useState("");

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
  const totalAmountEth = parseDecimalNumber(totalPriceDisplay);
  const isMoneyGoal = isMoneyGoalType(goal.goalType?.name);
  const donationAmount = isMoneyGoal ? totalAmountEth : quantity;
  const hasValidWalletAddress = ETHEREUM_ADDRESS_REGEX.test(walletAddress);
  const hasValidContractAddress = ETHEREUM_ADDRESS_REGEX.test(normalizedContractAddress);

  const targetAmountValue = Number(goal.targetAmount);
  const currentAmountValue = Number(goal.currentAmount);
  const goalProgress = clampPercentage(Number(goal.progress));
  const progressPercentage = normalizePercentageProgress(goalProgress);
  const hasFiniteTarget = Number.isFinite(targetAmountValue) && targetAmountValue > 0;
  const hasFiniteCurrent = Number.isFinite(currentAmountValue);
  const isCompleted =
    progressPercentage >= 100 || (hasFiniteTarget && hasFiniteCurrent && currentAmountValue >= targetAmountValue);
  const milestoneLabel = `MILESTONE ${formatMilestoneIndex(goalIndex)} \u2022 ${isCompleted ? "COMPLETADO" : "EM PROGRESSO"}`;
  const maxQuantity =
    hasFiniteTarget && hasFiniteCurrent && targetAmountValue > currentAmountValue
      ? Math.max(1, Math.ceil(targetAmountValue - currentAmountValue))
      : 99;
  const contractLabel = `BLOCKCHAIN VERIFICADA: ${shortenAddress(normalizedContractAddress)}`;
  const walletLabel = walletAddress ? shortenAddress(walletAddress) : "Carteira n\u00E3o encontrada";
  const donationDisabledReason = !hasValidWalletAddress
    ? "Atualize sua carteira no perfil com um endere\u00E7o EVM v\u00E1lido para doar."
    : !hasValidContractAddress
      ? "Este projeto ainda n\u00E3o possui smart contract v\u00E1lido para receber doa\u00E7\u00F5es."
      : totalPriceWei <= 0n
        ? "Essa meta ainda n\u00E3o possui um valor definido para doa\u00E7\u00E3o."
        : isCompleted
          ? "Essa meta j\u00E1 foi conclu\u00EDda."
          : null;
  const canConfirmDonation =
    hasValidWalletAddress &&
    hasValidContractAddress &&
    totalPriceWei > 0n &&
    !isCompleted &&
    !isSubmittingDonation;
  const summaryItemLabel = isMoneyGoal ? "Contribui\u00E7\u00E3o direta" : `${quantity}x ${itemLabel}`;
  const flowContent = getFlowContent(flowStep);

  const handleShareJourney = async () => {
    try {
      await Share.share({
        message: `Acabei de apoiar ${projectTitle} na Echo. Minha contribui\u00E7\u00E3o ficou registrada na Sepolia e no ecossistema Echo.`,
        title: "Compartilhar jornada",
      });
    } catch {
      showDonationDialog("N\u00E3o foi poss\u00EDvel compartilhar", "Tente novamente em instantes.");
    }
  };

  const handleConfirmDonation = async () => {
    if (!canConfirmDonation) {
      return;
    }

    let transactionHash = "";

    try {
      setIsSubmittingDonation(true);

      const walletResult = await sendSepoliaEthDonation({
        expectedSenderAddress: walletAddress,
        recipientAddress: normalizedContractAddress,
        valueWei: totalPriceWei,
      });

      transactionHash = walletResult.transactionHash;
      setLastTransactionHash(transactionHash);
      setFlowStep("waiting_sync");

      await waitWithInterval(10_000);

      setFlowStep("registering");

      await registerDonationWithRetry({
        amount: donationAmount,
        goalId: goal.id,
        totalAmountETH: totalAmountEth,
        transactionHash,
      });

      setFlowStep("success");
    } catch (error) {
      setFlowStep("idle");

      if (transactionHash) {
        showDonationDialog(
          "Transa\u00E7\u00E3o enviada, mas a doa\u00E7\u00E3o n\u00E3o foi registrada",
          `O hash ${transactionHash} j\u00E1 foi gerado na carteira, mas a API n\u00E3o confirmou o registro. N\u00E3o envie novamente agora; use esse hash para reconcilia\u00E7\u00E3o.`,
        );
      } else {
        showDonationDialog("N\u00E3o foi poss\u00EDvel concluir a doa\u00E7\u00E3o", getDonationErrorMessage(error));
      }
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  const decreaseQuantity = () => {
    setQuantity((currentValue) => Math.max(1, currentValue - 1));
  };

  const increaseQuantity = () => {
    setQuantity((currentValue) => Math.min(maxQuantity, currentValue + 1));
  };

  if (flowContent) {
    const isSuccess = flowStep === "success";
    const statusIcon = isSuccess ? (
      <Ionicons name="checkmark" size={42} color="#FFFFFF" />
    ) : (
      <LoadingSpinner color="#FFFFFF" size="large" className="h-11 w-11 items-center justify-center" />
    );

    return (
      <AppLayout headerVariant="logged-in" authFooterTab="inicio">
        <ScrollView className="flex-1" contentContainerClassName="gap-5 pb-10" showsVerticalScrollIndicator={false}>
          <View className="items-center pt-1">
            <View
              className="h-[108px] w-[108px] items-center justify-center rounded-full bg-[#DDF7D0]"
              style={{
                shadowColor: "#8EE26B",
                shadowOffset: { width: 0, height: 14 },
                shadowOpacity: 0.34,
                shadowRadius: 22,
              }}
            >
              <View className="h-[82px] w-[82px] items-center justify-center rounded-full bg-[#2F7D32]">
                {statusIcon}
              </View>
            </View>

            <Text className="mt-5 text-center text-[28px] font-bold leading-8 text-[#2F7D32]">
              {flowContent.headline}
            </Text>
            <Text className="mt-2 max-w-[295px] text-center text-[16px] font-semibold leading-[21px] text-[#202124]">
              {flowContent.supporting}
            </Text>
            <Text className="mt-3 max-w-[304px] text-center text-[13px] leading-[21px] text-[#75817B]">
              {flowContent.description}
            </Text>

            <View className="mt-4 flex-row items-center gap-2 rounded-full bg-[#EEF3EE] px-4 py-2">
              <MaterialCommunityIcons
                name={isSuccess ? "check-decagram" : "progress-clock"}
                size={14}
                color="#2F7D32"
              />
              <Text className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#2F7D32]">
                {flowContent.badge}
              </Text>
            </View>
          </View>

          <View className="rounded-[22px] bg-[#2F7D32] px-4 py-5">
            <Text className="text-[16px] font-semibold text-white">{flowContent.summaryTitle}</Text>

            <View className="mt-4 gap-3">
              <View className="flex-row items-center justify-between gap-4">
                <Text className="flex-1 text-[12px] leading-5 text-[#E5F6E6]">{summaryItemLabel}</Text>
                <Text className="text-[12px] font-medium text-[#E5F6E6]">{`\u039E ${totalPriceDisplay}`}</Text>
              </View>

              <View className="flex-row items-center justify-between gap-4">
                <Text className="flex-1 text-[12px] leading-5 text-[#E5F6E6]">{shortenAddress(lastTransactionHash)}</Text>
                <Text className="text-[12px] font-medium text-[#E5F6E6]">{"Tx hash"}</Text>
              </View>

              <View className="border-t border-white/20 pt-4">
                <View className="flex-row items-center justify-between gap-4">
                  <Text className="text-[20px] font-semibold text-white">{"Impacto Total"}</Text>
                  <Text className="text-[34px] font-semibold leading-9 text-white">{`\u039E ${totalPriceDisplay}`}</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="rounded-[22px] border border-[#E5EAE4] bg-white px-4 py-4">
            <Text className="text-[16px] font-semibold text-[#202124]">
              {isSuccess ? "Seu impacto est\u00E1 em movimento" : "Estamos finalizando seu recibo"}
            </Text>
            <Text className="mt-2 text-[13px] leading-[21px] text-[#6F7A75]">
              {isSuccess
                ? "Seu recibo j\u00E1 est\u00E1 pronto e vinculado ao hist\u00F3rico da sua conta. Voc\u00EA pode compartilhar essa jornada ou voltar para acompanhar mais projetos."
                : "Mantenha esta tela aberta por mais alguns segundos. Assim que a API confirmar o registro, mostramos o agradecimento final automaticamente."}
            </Text>
            <View className="mt-4 flex-row items-center gap-2">
              <MaterialCommunityIcons name="check-decagram-outline" size={14} color="#315FCB" />
              <Text className="text-[9px] font-medium tracking-[1.6px] text-[#315FCB]">{contractLabel}</Text>
            </View>
          </View>

          {isSuccess ? (
            <>
              <Button
                label="Compartilhar jornada"
                onPress={() => {
                  void handleShareJourney();
                }}
                variant="light"
                className="min-h-[58px] rounded-[18px]"
                textClassName="text-[16px] text-[#2F7D32]"
                rightIcon={<Ionicons name="share-social-outline" size={18} color="#2F7D32" />}
              />

              <Pressable
                className="items-center py-2"
                onPress={() => navigation.replace("AppHome")}
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              >
                <Text className="text-[13px] font-semibold text-[#315FCB]">{"Ir para Dashboard"}</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </AppLayout>
    );
  }

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
              <Text className="flex-1 text-[28px] font-semibold leading-8 text-[#2B5BB5]">{`\u039E ${unitPriceDisplay}`}</Text>

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
          label={isSubmittingDonation ? "Processando doa\u00E7\u00E3o..." : "Confirmar doa\u00E7\u00E3o"}
          onPress={() => {
            void handleConfirmDonation();
          }}
          disabled={!canConfirmDonation}
          className="min-h-[64px] rounded-[18px]"
          textClassName="text-[17px]"
          rightIcon={<MaterialCommunityIcons name="hand-heart-outline" size={18} color="#FFFFFF" />}
        />

        {donationDisabledReason ? (
          <Text className="px-2 text-center text-[12px] leading-5 text-[#A33A3A]">{donationDisabledReason}</Text>
        ) : null}

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
            {"Sua contribui\u00E7\u00E3o \u00E9 processada com seguran\u00E7a. Um recibo digital ser\u00E1 vinculado ao seu hist\u00F3rico assim que a confirma\u00E7\u00E3o for conclu\u00EDda."}
          </Text>
        </View>
      </ScrollView>
    </AppLayout>
  );
}
