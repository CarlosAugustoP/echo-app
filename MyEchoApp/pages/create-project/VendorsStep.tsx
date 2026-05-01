import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Button } from "../../components/common/Button";
import { StateCard } from "../../components/common/StateCard";
import type { VendorDto } from "../../types/api";

import { DecorativeCard } from "./DecorativeCard";
import { VendorSelectionCard } from "./VendorSelectionCard";
import type { GoalDraft, SelectedVendorIdsByGoalId } from "./types";
import { getAvailableVendorsForGoal, getSelectedVendorsForGoal } from "./utils";

type VendorsStepProps = {
  isLoadingVendors: boolean;
  vendorsError: string;
  moneyGoalsCount: number;
  supplyGoals: GoalDraft[];
  vendors: VendorDto[];
  selectedVendorIdsByGoalId: SelectedVendorIdsByGoalId;
  openVendorGoalId: string | null;
  onToggleVendorPicker: (goalId: string) => void;
  onSelectVendorForGoal: (goalId: string, vendor: VendorDto) => void;
  onRemoveVendorFromGoal: (goalId: string, vendorId: string) => void;
  onBackToGoals: () => void;
  onContinueToReview: () => void;
  isReviewEnabled: boolean;
  pendingSupplyGoalsCount: number;
};

export function VendorsStep({
  isLoadingVendors,
  vendorsError,
  moneyGoalsCount,
  supplyGoals,
  vendors,
  selectedVendorIdsByGoalId,
  openVendorGoalId,
  onToggleVendorPicker,
  onSelectVendorForGoal,
  onRemoveVendorFromGoal,
  onBackToGoals,
  onContinueToReview,
  isReviewEnabled,
  pendingSupplyGoalsCount,
}: VendorsStepProps) {
  return (
    <>
      {isLoadingVendors ? <StateCard kind="loading" message="Carregando fornecedores homologados..." /> : null}

      {!isLoadingVendors && vendorsError ? (
        <StateCard kind="error" title="Falha ao carregar fornecedores" message={vendorsError} />
      ) : null}

      {moneyGoalsCount > 0 ? (
        <View className="rounded-[20px] border border-[#E8DFFF] bg-[#F8F5FF] px-4 py-4">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-[#EEE7FF]">
              <MaterialCommunityIcons name="bank-transfer-out" size={18} color="#6D4BCB" />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-[12px] font-bold uppercase tracking-[1.1px] text-[#6D4BCB]">
                Metas financeiras fora desta etapa
              </Text>
              <Text className="text-[13px] leading-5 text-[#5F5B72]">
                {moneyGoalsCount} meta{moneyGoalsCount > 1 ? "s" : ""} financeira
                {moneyGoalsCount > 1 ? "s foram" : " foi"} mantida
                {moneyGoalsCount > 1 ? "s" : ""} fora da selecao de fornecedores.
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {supplyGoals.length > 0 ? (
        <View className="gap-4">
          <Text className="text-[12px] font-bold uppercase tracking-[1.8px] text-[#2F7D32]">Itens</Text>

          {supplyGoals.map((goal) => (
            <VendorSelectionCard
              key={goal.id}
              goal={goal}
              availableVendors={getAvailableVendorsForGoal(vendors)}
              selectedVendors={getSelectedVendorsForGoal(goal.id, selectedVendorIdsByGoalId, vendors)}
              isPickerOpen={openVendorGoalId === goal.id}
              onTogglePicker={() => onToggleVendorPicker(goal.id)}
              onSelectVendor={(vendor) => onSelectVendorForGoal(goal.id, vendor)}
              onRemoveVendor={(vendorId) => onRemoveVendorFromGoal(goal.id, vendorId)}
            />
          ))}
        </View>
      ) : (
        <DecorativeCard>
          <View className="gap-4">
            <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#F7F3FF]">
              <MaterialCommunityIcons name="bank-transfer-out" size={22} color="#6D4BCB" />
            </View>
            <View className="gap-2">
              <Text className="text-[20px] font-semibold leading-7 text-[#202124]">
                Nenhuma meta de suprimento para vincular
              </Text>
              <Text className="text-[14px] leading-6 text-[#66736D]">
                Este projeto tem apenas metas financeiras no momento. Como esse valor vai direto para a ONG, nao ha
                fornecedor para selecionar nesta etapa.
              </Text>
            </View>
          </View>
        </DecorativeCard>
      )}

      <Button
        label="Voltar para metas"
        onPress={onBackToGoals}
        variant="light"
        className="rounded-[22px]"
        textClassName="text-[16px]"
        leftIcon={<Ionicons name="arrow-back" size={18} color="#22272B" />}
      />

      <Button
        label="Continuar para review"
        onPress={onContinueToReview}
        disabled={!isReviewEnabled}
        className="rounded-[22px]"
        textClassName="text-[16px]"
        rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
      />

      {!isReviewEnabled ? (
        <View className="rounded-[18px] border border-[#F0D7AF] bg-[#FFF8ED] px-4 py-4">
          <Text className="text-[12px] font-bold uppercase tracking-[1.1px] text-[#A87113]">Revisao bloqueada</Text>
          <Text className="mt-1 text-[13px] leading-5 text-[#8A6A34]">
            Vincule fornecedores para {pendingSupplyGoalsCount} meta{pendingSupplyGoalsCount > 1 ? "s" : ""} de
            suprimento antes de abrir a revisao final.
          </Text>
        </View>
      ) : null}
    </>
  );
}
