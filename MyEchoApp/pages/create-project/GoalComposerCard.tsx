import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { Button } from "../../components/common/Button";
import type { GoalTypeDto } from "../../types/api";

import { ProjectField } from "./ProjectField";
import { formatGoalTypeLabel, getGoalTypeTone, isMoneyGoalType } from "./utils";

type GoalComposerCardProps = {
  goalType: GoalTypeDto;
  title: string;
  description: string;
  targetAmount: string;
  onTargetAmountChange: (value: string) => void;
  costPerUnit: string;
  onCostPerUnitChange: (value: string) => void;
  onRemove: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
};

export function GoalComposerCard({
  goalType,
  title,
  description,
  targetAmount,
  onTargetAmountChange,
  costPerUnit,
  onCostPerUnitChange,
  onRemove,
  onConfirm,
  confirmDisabled,
}: GoalComposerCardProps) {
  const tone = getGoalTypeTone(goalType.name);
  const isMoneyGoal = isMoneyGoalType(goalType.name);

  return (
    <View
      className="overflow-hidden rounded-[24px] border border-[#EEF1EC] bg-white"
      style={{
        shadowColor: "#DCE4DC",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 2,
      }}
    >
      <View className="absolute bottom-0 left-0 top-0 w-[4px]" style={{ backgroundColor: tone.iconColor }} />
      <View className="absolute right-[-24px] top-[-18px] h-[92px] w-[92px] rounded-full bg-[#F3F5F3]" />

      <View className="gap-5 px-5 py-5">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-row items-center gap-3">
            <View className="h-8 w-8 items-center justify-center rounded-[10px]" style={{ backgroundColor: tone.backgroundColor }}>
              <MaterialCommunityIcons name={tone.iconName} size={18} color={tone.iconColor} />
            </View>
            <Text className="text-[11px] font-bold uppercase tracking-[1.3px]" style={{ color: tone.textColor }}>
              {formatGoalTypeLabel(goalType.name)}
            </Text>
          </View>

          <Pressable
            onPress={onRemove}
            className="h-8 w-8 items-center justify-center"
            style={({ pressed }) => (pressed ? { opacity: 0.65 } : undefined)}
          >
            <Ionicons name="trash-outline" size={18} color="#7E8781" />
          </Pressable>
        </View>

        <View className="gap-2">
          <Text className="text-[33px] font-semibold leading-[38px] text-[#202124]">{title.trim() || "Nova meta"}</Text>
          <Text className="text-[15px] leading-7 text-[#5F6763]">
            {description.trim() || goalType.description?.trim() || "Configure os detalhes para esta meta."}
          </Text>
        </View>

        {isMoneyGoal ? (
          <View className="gap-4 rounded-[20px] border border-[#E8DFFF] bg-[#F8F5FF] px-4 py-4">
            <View className="flex-row items-start gap-3">
              <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-[#EEE7FF]">
                <MaterialCommunityIcons name="bank-transfer-out" size={18} color="#6D4BCB" />
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-[12px] font-bold uppercase tracking-[1.1px] text-[#6D4BCB]">
                  Transferencia direta para a ONG
                </Text>
                <Text className="text-[13px] leading-5 text-[#5F5B72]">
                  Para metas em ETH, os fundos sao transferidos diretamente para voce. Isso ajuda a financiar custos
                  operacionais e terceirizados do projeto.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            <ProjectField
              label="Quantidade alvo"
              placeholder="Ex: 50 unidades"
              value={targetAmount}
              onChangeText={onTargetAmountChange}
              keyboardType="decimal-pad"
              labelClassName="text-[#4F5752]"
            />

            <ProjectField
              label="1 unidade equivale a quantos ETH?"
              placeholder="Ex: 0.0015"
              value={costPerUnit}
              onChangeText={onCostPerUnitChange}
              keyboardType="decimal-pad"
              labelClassName="text-[#4F5752]"
            />
          </>
        )}

        <Button
          label="Confirmar meta"
          onPress={onConfirm}
          disabled={confirmDisabled}
          className="min-h-[60px] rounded-[18px]"
          textClassName="text-[16px]"
          rightIcon={<Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />}
        />
      </View>
    </View>
  );
}
