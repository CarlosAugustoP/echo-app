import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { VendorDto } from "../../types/api";

import { DecorativeCard } from "./DecorativeCard";
import type { GoalDraft, SelectedVendorIdsByGoalId } from "./types";
import {
  formatGoalTypeLabel,
  formatVendorSupplyLabel,
  getGoalTypeTone,
  getSelectedVendorsForGoal,
  isMoneyGoalType,
} from "./utils";

function ReviewMetricTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 rounded-[16px] bg-[#F6F8F6] px-4 py-3">
      <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#8B948D]">{label}</Text>
      <Text className="mt-2 text-[15px] font-semibold text-[#202124]">{value}</Text>
    </View>
  );
}

export function ReviewBasicCard({
  projectName,
  projectDescription,
  goalsCount,
  vendorsCount,
}: {
  projectName: string;
  projectDescription: string;
  goalsCount: number;
  vendorsCount: number;
}) {
  return (
    <DecorativeCard>
      <View className="gap-5">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-2">
            <Text className="text-[12px] font-bold uppercase tracking-[2.1px] text-[#2F7D32]">DADOS BASICOS</Text>
            <Text className="text-[31px] font-semibold leading-[37px] text-[#202124]">
              {projectName.trim() || "Projeto sem nome"}
            </Text>
          </View>

          <View className="mt-1 h-10 w-10 items-center justify-center rounded-[14px] bg-[#F2F6F2]">
            <Ionicons name="document-text-outline" size={18} color="#7C857E" />
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[11px] font-semibold uppercase tracking-[1.3px] text-[#B2B8B3]">
            DESCRICAO DO PROJETO
          </Text>
          <Text className="text-[14px] leading-6 text-[#5F6763]">
            {projectDescription.trim() || "Adicione uma descricao para revisar o escopo completo do projeto."}
          </Text>
        </View>

        <View className="h-px bg-[#EEF1EC]" />

        <View className="flex-row gap-3">
          <ReviewMetricTile label="METAS" value={`${goalsCount}`} />
          <ReviewMetricTile label="FORNECEDORES" value={`${vendorsCount}`} />
        </View>
      </View>
    </DecorativeCard>
  );
}

export function ReviewGoalSummaryCard({
  goals,
  vendors,
  selectedVendorIdsByGoalId,
}: {
  goals: GoalDraft[];
  vendors: VendorDto[];
  selectedVendorIdsByGoalId: SelectedVendorIdsByGoalId;
}) {
  return (
    <DecorativeCard>
      <View className="gap-4">
        <Text className="text-[12px] font-bold uppercase tracking-[2.1px] text-[#2F7D32]">METAS E PARCEIROS</Text>

        {goals.map((goal) => {
          const tone = getGoalTypeTone(goal.goalType.name);
          const isMoneyGoal = isMoneyGoalType(goal.goalType.name);
          const selectedVendors = getSelectedVendorsForGoal(goal.id, selectedVendorIdsByGoalId, vendors);

          return (
            <View key={goal.id} className="rounded-[18px] border border-[#E8ECE7] bg-white px-4 py-4">
              <View className="flex-row items-start gap-3">
                <View
                  className="mt-0.5 h-10 w-10 items-center justify-center rounded-[12px]"
                  style={{ backgroundColor: tone.backgroundColor }}
                >
                  <MaterialCommunityIcons name={tone.iconName} size={19} color={tone.iconColor} />
                </View>

                <View className="flex-1">
                  <Text className="text-[11px] font-bold uppercase tracking-[1.2px]" style={{ color: tone.textColor }}>
                    {formatGoalTypeLabel(goal.goalType.name)}
                  </Text>
                  <Text className="mt-2 text-[18px] font-semibold leading-6 text-[#202124]">{goal.title}</Text>
                  <Text className="mt-1 text-[13px] leading-5 text-[#6F7A75]">{goal.description}</Text>
                </View>
              </View>

              {isMoneyGoal ? (
                <View className="mt-4 rounded-[16px] bg-[#F7F3FF] px-4 py-3">
                  <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#7C6AAE]">
                    REPASSE DIRETO
                  </Text>
                  <Text className="mt-2 text-[13px] leading-5 text-[#5F5B72]">
                    Esta meta sera direcionada para a ONG sem etapa de fornecedor homologado.
                  </Text>
                </View>
              ) : (
                <View className="mt-4 gap-3">
                  <View className="flex-row gap-3">
                    <ReviewMetricTile label="QUANTIDADE" value={goal.targetAmount} />
                    <ReviewMetricTile label="ETH POR UNIDADE" value={goal.costPerUnit?.trim() || "0"} />
                  </View>

                  <View className="gap-2">
                    <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#8B948D]">
                      FORNECEDORES CONFIRMADOS
                    </Text>

                    {selectedVendors.length > 0 ? (
                      <View className="gap-2">
                        {selectedVendors.map((vendor) => (
                          <View
                            key={`${goal.id}-${vendor.id}`}
                            className="flex-row items-center justify-between gap-3 rounded-[12px] bg-[#EDF3FF] px-4 py-3"
                          >
                            <Text className="flex-1 text-[13px] font-semibold text-[#35539B]">{vendor.name}</Text>
                            <Text className="text-[10px] font-bold uppercase tracking-[1px] text-[#6D84C4]">
                              {formatVendorSupplyLabel(vendor.typeItemSupply)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View className="rounded-[12px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-3">
                        <Text className="text-[13px] leading-5 text-[#A33A3A]">
                          Esta meta ainda nao tem fornecedor confirmado.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </DecorativeCard>
  );
}

export function ReviewReadinessCard({
  isReviewReady,
  linkedSupplyGoalsCount,
  supplyGoalsCount,
}: {
  isReviewReady: boolean;
  linkedSupplyGoalsCount: number;
  supplyGoalsCount: number;
}) {
  const title = isReviewReady ? "Pronto para a Blockchain" : "Ajustes antes do registro";
  const description = isReviewReady
    ? "Este projeto gera um hash de verificacao unico na rede ECHO assim que o registro for confirmado."
    : "Vincule todos os fornecedores necessarios para concluir a revisao antes do registro no Living Ledger.";

  return (
    <View
      className="overflow-hidden rounded-[20px] border px-4 py-4"
      style={{
        borderColor: isReviewReady ? "#D7E6D7" : "#F0D5A7",
        backgroundColor: isReviewReady ? "#ECF5EC" : "#FFF7EA",
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="mt-0.5 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: isReviewReady ? "#D8EAD9" : "#FCE8BE" }}
        >
          <MaterialCommunityIcons
            name={isReviewReady ? "check-decagram-outline" : "progress-clock"}
            size={20}
            color={isReviewReady ? "#2F7D32" : "#A87113"}
          />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-[14px] font-semibold text-[#202124]">{title}</Text>
          <Text className="text-[12px] leading-5 text-[#5F6763]">{description}</Text>
        </View>
      </View>

      <View className="mt-4">
        <ReviewMetricTile
          label="METAS COM VINCULO"
          value={supplyGoalsCount > 0 ? `${linkedSupplyGoalsCount}/${supplyGoalsCount}` : "N/A"}
        />
      </View>
    </View>
  );
}
