import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { Button } from "../../components/common/Button";
import type { GoalTypeDto } from "../../types/api";

import { DecorativeCard } from "./DecorativeCard";
import { GoalComposerCard } from "./GoalComposerCard";
import { GoalTypeRow } from "./GoalTypeRow";
import { ProjectField } from "./ProjectField";
import { SavedGoalCard } from "./SavedGoalCard";
import type { GoalDraft } from "./types";
import { formatGoalTypeLabel } from "./utils";

type GoalsStepProps = {
  createdGoals: GoalDraft[];
  goalName: string;
  goalSummaryDescription: string;
  onGoalNameChange: (value: string) => void;
  onGoalSummaryDescriptionChange: (value: string) => void;
  isGoalBasicsReady: boolean;
  onUnlockGoalDraft: () => void;
  shouldShowItemsSection: boolean;
  isGoalTypePickerOpen: boolean;
  onToggleGoalTypePicker: () => void;
  selectedGoalType: GoalTypeDto | null;
  goalTypes: GoalTypeDto[];
  isLoadingGoalTypes: boolean;
  goalTypesError: string;
  onSelectGoalType: (goalType: GoalTypeDto) => void;
  onRemoveGoalType: () => void;
  targetAmount: string;
  onTargetAmountChange: (value: string) => void;
  costPerUnit: string;
  onCostPerUnitChange: (value: string) => void;
  onConfirmGoal: () => void;
  isConfirmGoalDisabled: boolean;
  onContinueToVendors: () => void;
};

export function GoalsStep({
  createdGoals,
  goalName,
  goalSummaryDescription,
  onGoalNameChange,
  onGoalSummaryDescriptionChange,
  isGoalBasicsReady,
  onUnlockGoalDraft,
  shouldShowItemsSection,
  isGoalTypePickerOpen,
  onToggleGoalTypePicker,
  selectedGoalType,
  goalTypes,
  isLoadingGoalTypes,
  goalTypesError,
  onSelectGoalType,
  onRemoveGoalType,
  targetAmount,
  onTargetAmountChange,
  costPerUnit,
  onCostPerUnitChange,
  onConfirmGoal,
  isConfirmGoalDisabled,
  onContinueToVendors,
}: GoalsStepProps) {
  const hasCreatedGoals = createdGoals.length > 0;

  return (
    <>
      {hasCreatedGoals ? (
        <View className="gap-4">
          <Text className="text-[12px] font-bold uppercase tracking-[1.8px] text-[#2F7D32]">Metas adicionadas</Text>
          {createdGoals.map((goal) => (
            <SavedGoalCard key={goal.id} goal={goal} />
          ))}
        </View>
      ) : null}

      <DecorativeCard>
        <View className="gap-5">
          <Text className="text-[14px] font-bold uppercase tracking-[2.6px] text-[#2F7D32]">Milestones</Text>

          <ProjectField
            label="Nome"
            placeholder="Digite o nome do milestone"
            value={goalName}
            onChangeText={onGoalNameChange}
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          <ProjectField
            label="Descricao"
            placeholder="Descreva o milestone"
            value={goalSummaryDescription}
            onChangeText={onGoalSummaryDescriptionChange}
            multiline
          />

          <View className="items-end pt-1">
            <Pressable
              onPress={onUnlockGoalDraft}
              disabled={!isGoalBasicsReady}
              className="h-9 w-9 items-center justify-center rounded-[10px] bg-[#2F7D32]"
              style={({ pressed }) => [
                !isGoalBasicsReady ? { opacity: 0.4 } : undefined,
                pressed && isGoalBasicsReady ? { opacity: 0.86 } : undefined,
              ]}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </DecorativeCard>

      {shouldShowItemsSection ? (
        <DecorativeCard>
          <View className="gap-5">
            <Text className="text-[14px] font-bold uppercase tracking-[2.6px] text-[#2F7D32]">Items</Text>

            <View className="gap-3">
              <Text className="text-[12px] font-extrabold uppercase tracking-[1.4px] text-[#4F5752]">Tipo</Text>

              <Pressable
                onPress={onToggleGoalTypePicker}
                className="min-h-[56px] flex-row items-center justify-between rounded-[18px] bg-[#F1F3F5] px-4"
                style={({ pressed }) => (pressed ? { opacity: 0.82 } : undefined)}
              >
                <Text className="text-[16px] text-[#7B8693]">
                  {selectedGoalType ? formatGoalTypeLabel(selectedGoalType.name) : "Selecione aqui o tipo de item"}
                </Text>
                <Ionicons name={isGoalTypePickerOpen ? "chevron-up" : "chevron-down"} size={18} color="#7B8693" />
              </Pressable>

              {isGoalTypePickerOpen ? (
                <View className="overflow-hidden rounded-[18px] border border-[#E8ECE7] bg-white">
                  {isLoadingGoalTypes ? (
                    <Text className="px-4 py-4 text-[14px] text-[#6F7A75]">Carregando tipos de item...</Text>
                  ) : null}

                  {!isLoadingGoalTypes && goalTypesError ? (
                    <Text className="px-4 py-4 text-[14px] leading-5 text-[#A33A3A]">{goalTypesError}</Text>
                  ) : null}

                  {!isLoadingGoalTypes && !goalTypesError && goalTypes.length === 0 ? (
                    <Text className="px-4 py-4 text-[14px] leading-5 text-[#6F7A75]">
                      Nenhum tipo de item disponivel no momento.
                    </Text>
                  ) : null}

                  {!isLoadingGoalTypes && !goalTypesError
                    ? goalTypes.map((goalType) => (
                        <Pressable
                          key={goalType.id}
                          onPress={() => onSelectGoalType(goalType)}
                          className="border-b border-[#EEF1EC] px-4 py-4 last:border-b-0"
                          style={({ pressed }) => (pressed ? { backgroundColor: "#F8FAF8" } : undefined)}
                        >
                          <Text className="text-[14px] font-semibold text-[#202124]">
                            {formatGoalTypeLabel(goalType.name)}
                          </Text>
                          <Text className="mt-1 text-[12px] leading-5 text-[#6F7A75]">{goalType.description}</Text>
                        </Pressable>
                      ))
                    : null}
                </View>
              ) : null}
            </View>

            {selectedGoalType ? <GoalTypeRow goalType={selectedGoalType} onRemove={onRemoveGoalType} /> : null}
          </View>
        </DecorativeCard>
      ) : null}

      {shouldShowItemsSection && selectedGoalType ? (
        <GoalComposerCard
          goalType={selectedGoalType}
          title={goalName}
          description={goalSummaryDescription}
          targetAmount={targetAmount}
          onTargetAmountChange={onTargetAmountChange}
          costPerUnit={costPerUnit}
          onCostPerUnitChange={onCostPerUnitChange}
          onRemove={onRemoveGoalType}
          onConfirm={onConfirmGoal}
          confirmDisabled={isConfirmGoalDisabled}
        />
      ) : null}

      {hasCreatedGoals ? (
        <Button
          label="Continuar para fornecedores"
          onPress={onContinueToVendors}
          className="rounded-[22px]"
          textClassName="text-[16px]"
          rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        />
      ) : null}
    </>
  );
}
