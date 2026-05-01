import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { VendorDto } from "../../types/api";

import type { GoalDraft } from "./types";
import { formatGoalEthLabel, formatVendorSupplyLabel, getGoalTypeTone } from "./utils";

type VendorSelectionCardProps = {
  goal: GoalDraft;
  availableVendors: VendorDto[];
  selectedVendors: VendorDto[];
  isPickerOpen: boolean;
  onTogglePicker: () => void;
  onSelectVendor: (vendor: VendorDto) => void;
  onRemoveVendor: (vendorId: string) => void;
};

export function VendorSelectionCard({
  goal,
  availableVendors,
  selectedVendors,
  isPickerOpen,
  onTogglePicker,
  onSelectVendor,
  onRemoveVendor,
}: VendorSelectionCardProps) {
  const tone = getGoalTypeTone(goal.goalType.name);
  const hasVendor = selectedVendors.length > 0;
  const statusColor = hasVendor ? "#3564C9" : "#D54841";
  const ethLabel = formatGoalEthLabel(goal);
  const statusLabel =
    selectedVendors.length > 1
      ? "FORNECEDORES VINCULADOS"
      : hasVendor
        ? "FORNECEDOR VINCULADO"
        : "PENDENTE DE FORNECEDOR";
  const dropdownPlaceholder =
    availableVendors.length === 0
      ? "Nenhum fornecedor disponivel no momento."
      : selectedVendors.length > 0
        ? "Adicionar outro parceiro..."
        : "Escolha um parceiro...";

  return (
    <View
      className="overflow-hidden rounded-[24px] border border-[#EEF1EC] bg-white"
      style={{
        shadowColor: "#DCE4DC",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
        elevation: 2,
      }}
    >
      <View className="absolute right-[-22px] top-[-12px] h-[92px] w-[92px] rounded-full bg-[#F6F6F3]" />

      <View className="gap-4 px-5 py-5">
        <View className="flex-row items-start gap-4">
          <View
            className="mt-0.5 h-12 w-12 items-center justify-center rounded-[14px] border border-[#E8ECE7]"
            style={{ backgroundColor: tone.backgroundColor }}
          >
            <View className="h-10 w-10 items-center justify-center rounded-[12px]" style={{ backgroundColor: "#FFFFFFB2" }}>
              <MaterialCommunityIcons name={tone.iconName} size={20} color={tone.iconColor} />
            </View>
          </View>

          <View className="flex-1 gap-[2px] pt-[1px]">
            <Text className="text-[18px] font-semibold leading-7 text-[#202124]">{goal.title}</Text>
            <Text className="text-[15px] leading-5 text-[#68716D]">{`\u039E ${ethLabel}`}</Text>
            <View className="mt-[1px] flex-row items-center gap-[5px]">
              <View className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: statusColor }} />
              <Text className="text-[10px] font-bold uppercase tracking-[1.25px]" style={{ color: statusColor }}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-3 pt-[2px]">
          <Text className="text-[10px] font-extrabold uppercase tracking-[1.35px] text-[#9AA29D]">
            Selecionar fornecedor
          </Text>

          <Pressable
            onPress={onTogglePicker}
            disabled={availableVendors.length === 0}
            className="min-h-[46px] flex-row items-center justify-between rounded-[14px] bg-[#F2F4F7] px-4"
            style={({ pressed }) => [
              availableVendors.length === 0 ? { opacity: 0.58 } : undefined,
              pressed && availableVendors.length > 0 ? { opacity: 0.82 } : undefined,
            ]}
          >
            <Text className="flex-1 text-[14px] text-[#98A0A9]">{dropdownPlaceholder}</Text>
            <Ionicons
              name={isPickerOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={availableVendors.length > 0 ? "#8D96A0" : "#BEC5CC"}
            />
          </Pressable>

          {isPickerOpen ? (
            <View className="overflow-hidden rounded-[18px] border border-[#E8ECE7] bg-white">
              {availableVendors.map((vendor) => {
                const isSelected = selectedVendors.some((selectedVendor) => selectedVendor.id === vendor.id);

                return (
                  <Pressable
                    key={vendor.id}
                    onPress={() => onSelectVendor(vendor)}
                    className="border-b border-[#EEF1EC] px-4 py-4 last:border-b-0"
                    style={({ pressed }) => [
                      isSelected ? { backgroundColor: "#EEF4FF" } : undefined,
                      pressed ? { backgroundColor: "#F8FAF8" } : undefined,
                    ]}
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-[14px] font-medium text-[#202124]">{vendor.name}</Text>
                        <Text className="mt-1 text-[11px] leading-5 text-[#6F7A75]">
                          {formatVendorSupplyLabel(vendor.typeItemSupply)}
                        </Text>
                      </View>

                      {isSelected ? <Ionicons name="checkmark-circle" size={18} color="#3564C9" /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {selectedVendors.length > 0 ? (
            <View className="gap-2">
              {selectedVendors.map((vendor) => (
                <View
                  key={vendor.id}
                  className="w-full flex-row items-center justify-between gap-3 rounded-[12px] bg-[#6F8FE0] px-4 py-[11px]"
                >
                  <Text className="flex-1 text-[13px] font-medium text-white" numberOfLines={1}>
                    {vendor.name.toUpperCase()}
                  </Text>
                  <Pressable
                    onPress={() => onRemoveVendor(vendor.id)}
                    className="h-5 w-5 items-center justify-center rounded-full bg-[#FFFFFF26]"
                    style={({ pressed }) => (pressed ? { opacity: 0.72 } : undefined)}
                  >
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
