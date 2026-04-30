import type { ReactNode } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, type TextInputProps, View } from "react-native";

import { Button } from "../components/common/Button";
import { PageHeader } from "../components/common/PageHeader";
import { StateCard } from "../components/common/StateCard";
import { AppLayout } from "../components/layout/AppLayout";
import { formatEth } from "../components/project-details/projectDetailsUtils";
import type { CreateProjectScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import type { GoalTypeDto, VendorDto } from "../types/api";

type CreateProjectStep = "general" | "goals" | "vendors";

type ProjectFieldProps = TextInputProps & {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  labelClassName?: string;
};

type StepTabsProps = {
  activeStep: CreateProjectStep;
  isGeneralComplete: boolean;
  isVendorsEnabled: boolean;
  onPressStep: (step: CreateProjectStep) => void;
};

type GoalTypeBadgeTone = {
  backgroundColor: string;
  iconColor: string;
  textColor: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

type GoalTypeResponseShape =
  | GoalTypeDto[]
  | {
      items?: GoalTypeDto[];
      data?: {
        items?: GoalTypeDto[];
      } | null;
    };

type VendorResponseShape =
  | VendorDto[]
  | {
      items?: VendorDto[];
      data?: {
        items?: VendorDto[];
      } | null;
    };

type GoalDraft = {
  id: string;
  title: string;
  description: string;
  targetAmount: string;
  currentAmount: number;
  costPerUnit: string | null;
  goalType: GoalTypeDto;
  quantityConstraints?: {
    minimum: number;
    maximum: number;
  };
};

const disabledStepTextColor = "#B5B8BB";
const enabledStepTextColor = "#2F7D32";
const activeStepLineColor = "#2F7D32";
const inactiveStepLineColor = "#E5E7EA";

function ProjectField({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  labelClassName = "text-[#2F7D32]",
  ...inputProps
}: ProjectFieldProps) {
  return (
    <View className="gap-3">
      <Text className={`text-[12px] font-extrabold uppercase tracking-[1.4px] ${labelClassName}`}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CAABA"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        className={`rounded-[18px] bg-[#F1F3F5] px-4 text-[17px] leading-6 text-[#1F2933] ${
          multiline ? "min-h-[132px] py-4" : "min-h-[58px] py-4"
        }`}
        {...inputProps}
      />
    </View>
  );
}

function DecorativeCard({ children }: { children: ReactNode }) {
  return (
    <View
      className="overflow-hidden rounded-[24px] border border-[#EEF1EC] bg-white px-5 py-5"
      style={{
        shadowColor: "#DCE4DC",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 2,
      }}
    >
      <View className="absolute right-[-24px] top-[-18px] h-[92px] w-[92px] rounded-full bg-[#F3F5F3]" />
      {children}
    </View>
  );
}

function StepTabs({ activeStep, isGeneralComplete, isVendorsEnabled, onPressStep }: StepTabsProps) {
  const steps = [
    { key: "general" as const, label: "GERAL", enabled: true },
    { key: "goals" as const, label: "METAS", enabled: isGeneralComplete },
    { key: "vendors" as const, label: "FORNECEDORES", enabled: isVendorsEnabled },
    { key: "review", label: "REVIEW", enabled: false },
  ];

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-2">
        {steps.map((step) => {
          const isActive = step.key === activeStep;
          const isEnabled = step.enabled;

          return (
            <Pressable
              key={step.key}
              disabled={!isEnabled || (step.key !== "general" && step.key !== "goals" && step.key !== "vendors")}
              onPress={() => {
                if (step.key === "general" || step.key === "goals" || step.key === "vendors") {
                  onPressStep(step.key);
                }
              }}
              className="flex-1 items-center"
              style={({ pressed }) => (pressed && isEnabled ? { opacity: 0.72 } : undefined)}
            >
              <Text
                className="text-[11px] font-bold uppercase tracking-[1.5px]"
                style={{ color: isEnabled ? enabledStepTextColor : disabledStepTextColor, opacity: isActive ? 1 : 0.92 }}
              >
                {step.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-2">
        {steps.map((step) => {
          const isGreen =
            step.key === "general" ||
            (step.key === "goals" && isGeneralComplete) ||
            (step.key === "vendors" && isVendorsEnabled);

          return (
            <View
              key={`${step.key}-indicator`}
              className="h-[4px] flex-1 rounded-full"
              style={{ backgroundColor: isGreen ? activeStepLineColor : inactiveStepLineColor }}
            />
          );
        })}
      </View>
    </View>
  );
}

function getGoalTypeTone(goalTypeName: string): GoalTypeBadgeTone {
  const normalizedName = goalTypeName.trim().toLowerCase();

  if (normalizedName.includes("higiene") || normalizedName.includes("saude")) {
    return {
      backgroundColor: "#EEF4FF",
      iconColor: "#3564C9",
      textColor: "#3564C9",
      iconName: "hand-wash-outline",
    };
  }

  if (normalizedName.includes("urgencia") || normalizedName.includes("medic")) {
    return {
      backgroundColor: "#FFF0F0",
      iconColor: "#E2483D",
      textColor: "#E2483D",
      iconName: "medical-bag",
    };
  }

  if (normalizedName.includes("money")) {
    return {
      backgroundColor: "#F5F2FF",
      iconColor: "#6D4BCB",
      textColor: "#6D4BCB",
      iconName: "currency-eth",
    };
  }

  if (normalizedName.includes("well") || normalizedName.includes("water")) {
    return {
      backgroundColor: "#EDF7FF",
      iconColor: "#2D7DBA",
      textColor: "#2D7DBA",
      iconName: "water-outline",
    };
  }

  return {
    backgroundColor: "#EEF7EF",
    iconColor: "#2F7D32",
    textColor: "#2F7D32",
    iconName: "shopping-outline",
  };
}

function normalizeGoalTypesResponse(payload: GoalTypeResponseShape | null | undefined) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  return [];
}

function normalizeVendorsResponse(payload: VendorResponseShape | null | undefined) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  return [];
}

function formatGoalTypeLabel(goalTypeName: string) {
  return goalTypeName.replaceAll("_", " ").trim().toUpperCase();
}

function formatVendorSupplyLabel(typeItemSupply: string) {
  return typeItemSupply.replaceAll("_", " ").trim();
}

function isPositiveNumberInput(value: string) {
  const parsedValue = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsedValue) && parsedValue > 0;
}

function parseDecimalValue(value?: string | number | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsedValue) ? parsedValue : NaN;
  }

  return NaN;
}

function isMoneyGoalType(goalTypeName?: string | null) {
  return goalTypeName?.trim().toLowerCase() === "money";
}

function normalizeComparableText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function vendorMatchesGoal(vendor: VendorDto, goal: GoalDraft) {
  const vendorSupply = normalizeComparableText(vendor.typeItemSupply);

  if (!vendorSupply) {
    return false;
  }

  const goalCandidates = [goal.goalType.name, goal.goalType.description, goal.title, goal.description];

  return goalCandidates.some((candidate) => {
    const normalizedCandidate = normalizeComparableText(candidate);

    if (!normalizedCandidate) {
      return false;
    }

    if (
      vendorSupply === normalizedCandidate ||
      vendorSupply.includes(normalizedCandidate) ||
      normalizedCandidate.includes(vendorSupply)
    ) {
      return true;
    }

    return normalizedCandidate
      .split(" ")
      .filter((token) => token.length >= 4)
      .some((token) => vendorSupply.includes(token));
  });
}

function formatGoalEthLabel(goal: GoalDraft) {
  const quantity = parseDecimalValue(goal.targetAmount);
  const pricePerUnit = parseDecimalValue(goal.costPerUnit);
  const totalAmount = Number.isFinite(quantity) && Number.isFinite(pricePerUnit) ? quantity * pricePerUnit : pricePerUnit;

  if (!Number.isFinite(totalAmount)) {
    return "0";
  }

  return formatEth(totalAmount).replace(" ETH", "");
}

function GoalTypeRow({
  goalType,
  onRemove,
}: {
  goalType: GoalTypeDto;
  onRemove: () => void;
}) {
  const tone = getGoalTypeTone(goalType.name);

  return (
    <View className="flex-row items-center gap-3 border-b border-[#EAEDEA] py-3 last:border-b-0">
      <View className="h-8 w-8 items-center justify-center rounded-[10px]" style={{ backgroundColor: tone.backgroundColor }}>
        <MaterialCommunityIcons name={tone.iconName} size={18} color={tone.iconColor} />
      </View>

      <Text className="flex-1 text-[11px] font-bold uppercase tracking-[1.3px]" style={{ color: tone.textColor }}>
        {formatGoalTypeLabel(goalType.name)}
      </Text>

      <Pressable onPress={onRemove} className="h-8 w-8 items-center justify-center" style={({ pressed }) => (pressed ? { opacity: 0.65 } : undefined)}>
        <Ionicons name="trash-outline" size={18} color="#7E8781" />
      </Pressable>
    </View>
  );
}

function GoalComposerCard({
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
}: {
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
}) {
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

          <Pressable onPress={onRemove} className="h-8 w-8 items-center justify-center" style={({ pressed }) => (pressed ? { opacity: 0.65 } : undefined)}>
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
                  Para metas em ETH, os fundos sao transferidos diretamente para você. Isso ajuda a financiar
                  custos operacionais e terceirizados do projeto.
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

function SavedGoalCard({ goal }: { goal: GoalDraft }) {
  const tone = getGoalTypeTone(goal.goalType.name);
  const isMoneyGoal = isMoneyGoalType(goal.goalType.name);

  return (
    <View className="overflow-hidden rounded-[20px] border border-[#E8ECE7] bg-white px-4 py-4">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-8 w-8 items-center justify-center rounded-[10px]" style={{ backgroundColor: tone.backgroundColor }}>
            <MaterialCommunityIcons name={tone.iconName} size={18} color={tone.iconColor} />
          </View>
          <Text className="text-[11px] font-bold uppercase tracking-[1.2px]" style={{ color: tone.textColor }}>
            {formatGoalTypeLabel(goal.goalType.name)}
          </Text>
        </View>

        <View className="rounded-full bg-[#EEF6EE] px-3 py-1">
          <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#2F7D32]">Salva</Text>
        </View>
      </View>

      <Text className="mt-4 text-[20px] font-semibold leading-7 text-[#202124]">{goal.title}</Text>
      <Text className="mt-2 text-[13px] leading-5 text-[#6F7A75]">{goal.description}</Text>

      {isMoneyGoal ? (
        <View className="mt-4 rounded-[16px] bg-[#F7F3FF] px-4 py-3">
          <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#7C6AAE]">Transferencia direta</Text>
          <Text className="mt-2 text-[13px] leading-5 text-[#5F5B72]">
            Os fundos desta meta entram direto para a ONG e podem financiar custos de apoio do projeto, como equipe,
            passagens, logistica, execucao operacional e outras despesas indiretas necessarias para a entrega final.
          </Text>
        </View>
      ) : (
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-[16px] bg-[#F7F8F7] px-4 py-3">
            <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#86908A]">Quantidade</Text>
            <Text className="mt-2 text-[16px] font-semibold text-[#202124]">{goal.targetAmount}</Text>
          </View>

          <View className="flex-1 rounded-[16px] bg-[#F7F8F7] px-4 py-3">
            <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-[#86908A]">ETH por unidade</Text>
            <Text className="mt-2 text-[16px] font-semibold text-[#202124]">{goal.costPerUnit}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function VendorSelectionCard({
  goal,
  availableVendors,
  selectedVendors,
  isPickerOpen,
  onTogglePicker,
  onSelectVendor,
  onRemoveVendor,
}: {
  goal: GoalDraft;
  availableVendors: VendorDto[];
  selectedVendors: VendorDto[];
  isPickerOpen: boolean;
  onTogglePicker: () => void;
  onSelectVendor: (vendor: VendorDto) => void;
  onRemoveVendor: (vendorId: string) => void;
}) {
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
      ? "Nenhum fornecedor disponivel para esta categoria."
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

export default function CreateProjectPage({ navigation }: CreateProjectScreenProps) {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeStep, setActiveStep] = useState<CreateProjectStep>("general");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [goalName, setGoalName] = useState("");
  const [goalSummaryDescription, setGoalSummaryDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [isGoalDraftUnlocked, setIsGoalDraftUnlocked] = useState(false);
  const [isGoalTypePickerOpen, setIsGoalTypePickerOpen] = useState(false);
  const [goalTypes, setGoalTypes] = useState<GoalTypeDto[]>([]);
  const [selectedGoalType, setSelectedGoalType] = useState<GoalTypeDto | null>(null);
  const [createdGoals, setCreatedGoals] = useState<GoalDraft[]>([]);
  const [goalTypesError, setGoalTypesError] = useState("");
  const [isLoadingGoalTypes, setIsLoadingGoalTypes] = useState(false);
  const [hasLoadedGoalTypes, setHasLoadedGoalTypes] = useState(false);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [vendorsError, setVendorsError] = useState("");
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [hasLoadedVendors, setHasLoadedVendors] = useState(false);
  const [selectedVendorIdsByGoalId, setSelectedVendorIdsByGoalId] = useState<Record<string, string[]>>({});
  const [openVendorGoalId, setOpenVendorGoalId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const isGeneralComplete = useMemo(() => {
    return projectName.trim().length > 0 && projectDescription.trim().length > 0;
  }, [projectDescription, projectName]);

  const isGoalBasicsReady = useMemo(() => {
    return goalName.trim().length > 0 && goalSummaryDescription.trim().length > 0;
  }, [goalName, goalSummaryDescription]);

  const shouldShowItemsSection = isGoalDraftUnlocked && isGoalBasicsReady;
  const hasCreatedGoals = createdGoals.length > 0;
  const supplyGoals = useMemo(
    () => createdGoals.filter((goal) => !isMoneyGoalType(goal.goalType.name)),
    [createdGoals],
  );
  const moneyGoalsCount = createdGoals.length - supplyGoals.length;

  const isConfirmGoalDisabled = useMemo(() => {
    if (!selectedGoalType) {
      return true;
    }

    if (isMoneyGoalType(selectedGoalType.name)) {
      return false;
    }

    return !isPositiveNumberInput(targetAmount) || !isPositiveNumberInput(costPerUnit);
  }, [costPerUnit, selectedGoalType, targetAmount]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeStep !== "goals" || hasLoadedGoalTypes) {
      return;
    }

    let isMounted = true;

    const loadGoalTypes = async () => {
      try {
        setIsLoadingGoalTypes(true);
        setGoalTypesError("");

        const result = await apiClient.getGoalTypes({ pageSize: 50, pageNumber: 0 });
        const nextGoalTypes = normalizeGoalTypesResponse(result as GoalTypeResponseShape);

        if (!isMounted) {
          return;
        }

        setGoalTypes(nextGoalTypes);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setGoalTypes([]);
        setGoalTypesError(error instanceof Error ? error.message : "Nao foi possivel carregar os tipos de item.");
      } finally {
        if (isMounted) {
          setIsLoadingGoalTypes(false);
          setHasLoadedGoalTypes(true);
        }
      }
    };

    void loadGoalTypes();

    return () => {
      isMounted = false;
    };
  }, [activeStep, hasLoadedGoalTypes]);

  useEffect(() => {
    if (activeStep !== "vendors" || hasLoadedVendors) {
      return;
    }

    let isMounted = true;

    const loadVendors = async () => {
      try {
        setIsLoadingVendors(true);
        setVendorsError("");

        const result = await apiClient.getVendors({ pageSize: 100, pageNumber: 0 });
        const nextVendors = normalizeVendorsResponse(result as VendorResponseShape);

        if (!isMounted) {
          return;
        }

        setVendors(nextVendors);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setVendors([]);
        setVendorsError(error instanceof Error ? error.message : "Nao foi possivel carregar os fornecedores.");
      } finally {
        if (isMounted) {
          setIsLoadingVendors(false);
          setHasLoadedVendors(true);
        }
      }
    };

    void loadVendors();

    return () => {
      isMounted = false;
    };
  }, [activeStep, hasLoadedVendors]);

  const showToast = (message: string) => {
    setToastMessage(message);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage("");
      toastTimeoutRef.current = null;
    }, 2800);
  };

  const resetGoalDraft = () => {
    setGoalName("");
    setGoalSummaryDescription("");
    setTargetAmount("");
    setCostPerUnit("");
    setSelectedGoalType(null);
    setIsGoalDraftUnlocked(false);
    setIsGoalTypePickerOpen(false);
  };

  const handleContinueToGoals = () => {
    if (!isGeneralComplete) {
      return;
    }

    setActiveStep("goals");
  };

  const handleStepPress = (step: CreateProjectStep) => {
    if (step === "goals" && !isGeneralComplete) {
      return;
    }

    if (step === "vendors" && !hasCreatedGoals) {
      return;
    }

    setActiveStep(step);
  };

  const handleContinueToVendors = () => {
    if (!hasCreatedGoals) {
      return;
    }

    setActiveStep("vendors");
  };

  const handleUnlockGoalDraft = () => {
    if (!isGoalBasicsReady) {
      return;
    }

    setIsGoalDraftUnlocked(true);
  };

  const handleSelectGoalType = (goalType: GoalTypeDto) => {
    if (selectedGoalType?.id !== goalType.id) {
      setTargetAmount(isMoneyGoalType(goalType.name) ? "9999999" : "");
      setCostPerUnit("");
    }

    setSelectedGoalType(goalType);
    setIsGoalTypePickerOpen(false);
  };

  const handleRemoveGoalType = () => {
    setSelectedGoalType(null);
    setTargetAmount("");
    setCostPerUnit("");
    setIsGoalTypePickerOpen(false);
  };

  const handleConfirmGoal = () => {
    if (isConfirmGoalDisabled || !selectedGoalType) {
      return;
    }

    setCreatedGoals((currentGoals) => [
      {
        id: `${Date.now()}-${currentGoals.length}`,
        title: goalName.trim(),
        description: goalSummaryDescription.trim(),
        targetAmount: isMoneyGoalType(selectedGoalType.name) ? "9999999" : targetAmount.trim(),
        currentAmount: 0,
        costPerUnit: isMoneyGoalType(selectedGoalType.name) ? null : costPerUnit.trim(),
        goalType: selectedGoalType,
        quantityConstraints: isMoneyGoalType(selectedGoalType.name)
          ? {
              minimum: 0,
              maximum: 9999999,
            }
          : undefined,
      },
      ...currentGoals,
    ]);

    resetGoalDraft();
    showToast("Meta salva com sucesso. Voce pode adicionar outras metas agora.");

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 10);
  };

  const handleToggleVendorPicker = (goalId: string) => {
    setOpenVendorGoalId((currentGoalId) => (currentGoalId === goalId ? null : goalId));
  };

  const handleSelectVendorForGoal = (goalId: string, vendor: VendorDto) => {
    setSelectedVendorIdsByGoalId((currentSelections) => ({
      ...currentSelections,
      [goalId]: currentSelections[goalId]?.includes(vendor.id)
        ? currentSelections[goalId].filter((vendorId) => vendorId !== vendor.id)
        : [...(currentSelections[goalId] ?? []), vendor.id],
    }));
    setOpenVendorGoalId(null);
  };

  const handleRemoveVendorFromGoal = (goalId: string, vendorId: string) => {
    setSelectedVendorIdsByGoalId((currentSelections) => {
      const currentVendorIds = currentSelections[goalId] ?? [];

      if (!currentVendorIds.includes(vendorId)) {
        return currentSelections;
      }

      const nextVendorIds = currentVendorIds.filter((currentVendorId) => currentVendorId !== vendorId);
      const nextSelections = { ...currentSelections };

      if (nextVendorIds.length === 0) {
        delete nextSelections[goalId];
        return nextSelections;
      }

      nextSelections[goalId] = nextVendorIds;
      return nextSelections;
    });
  };

  const pageTitle =
    activeStep === "general"
      ? "Criar novo projeto"
      : activeStep === "goals"
        ? "Definir metas detalhadas"
        : "Selecionar fornecedores";
  const pageDescription =
    activeStep === "general"
      ? "Inicie um novo registro no Living Ledger. Defina os parametros fundamentais para iniciar a captacao de impacto."
      : activeStep === "goals"
        ? "Estabeleca as quantidades especificas e valores para o seu novo projeto de impacto. Essas metas serao visiveis para os doadores."
        : "Vincule cada meta de suprimentos a um fornecedor homologado. Metas financeiras ficam fora desta etapa porque o repasse vai direto para a ONG.";

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="projetos">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerClassName="gap-6 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          onBackPress={() => navigation.goBack()}
          backLabel="Novo projeto"
          title={pageTitle}
          description={pageDescription}
        />

        <StepTabs
          activeStep={activeStep}
          isGeneralComplete={isGeneralComplete}
          isVendorsEnabled={hasCreatedGoals}
          onPressStep={handleStepPress}
        />

        {toastMessage ? (
          <View className="rounded-[18px] border border-[#CFE7D1] bg-[#F3FBF4] px-4 py-4">
            <View className="flex-row items-start gap-3">
              <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-[#DDF1DF]">
                <Ionicons name="checkmark" size={18} color="#2F7D32" />
              </View>
              <View className="flex-1">
                <Text className="text-[12px] font-bold uppercase tracking-[1.1px] text-[#2F7D32]">Meta confirmada</Text>
                <Text className="mt-1 text-[13px] leading-5 text-[#5F6763]">{toastMessage}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {activeStep === "general" ? (
          <DecorativeCard>
            <View className="gap-6">
              <ProjectField
                label="Nome do projeto"
                placeholder="Ex: Operacao Alimento e Saude 2024"
                value={projectName}
                onChangeText={setProjectName}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <ProjectField
                label="Descricao detalhada"
                placeholder="Descreva o proposito, a localidade e o publico-alvo deste projeto..."
                value={projectDescription}
                onChangeText={setProjectDescription}
                multiline
              />

              <View className="rounded-[20px] border border-[#E7EDE6] bg-[#F8FBF8] px-4 py-4">
                <View className="flex-row items-start gap-3">
                  <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-[#E6F3E7]">
                    <Ionicons name="leaf-outline" size={18} color="#2F7D32" />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="text-[12px] font-bold uppercase tracking-[1.1px] text-[#2F7D32]">
                      Dica para esta etapa
                    </Text>
                    <Text className="text-[13px] leading-5 text-[#66736D]">
                      Use um nome claro e uma descricao objetiva. Isso facilita a revisao interna e prepara o projeto
                      para as proximas etapas de metas e fornecedores.
                    </Text>
                  </View>
                </View>
              </View>

              <Button
                label="Continuar para metas"
                onPress={handleContinueToGoals}
                disabled={!isGeneralComplete}
                rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
                className="rounded-[22px]"
                textClassName="text-[16px]"
              />
            </View>
          </DecorativeCard>
        ) : null}

        {activeStep === "goals" ? (
          <>
            {createdGoals.length > 0 ? (
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
                  onChangeText={setGoalName}
                  autoCapitalize="sentences"
                  returnKeyType="next"
                />

                <ProjectField
                  label="Descricao"
                  placeholder="Descreva o milestone"
                  value={goalSummaryDescription}
                  onChangeText={setGoalSummaryDescription}
                  multiline
                />

                <View className="items-end pt-1">
                  <Pressable
                    onPress={handleUnlockGoalDraft}
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
                      onPress={() => setIsGoalTypePickerOpen((currentValue) => !currentValue)}
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
                                onPress={() => handleSelectGoalType(goalType)}
                                className="border-b border-[#EEF1EC] px-4 py-4 last:border-b-0"
                                style={({ pressed }) => (pressed ? { backgroundColor: "#F8FAF8" } : undefined)}
                              >
                                <Text className="text-[14px] font-semibold text-[#202124]">{formatGoalTypeLabel(goalType.name)}</Text>
                                <Text className="mt-1 text-[12px] leading-5 text-[#6F7A75]">{goalType.description}</Text>
                              </Pressable>
                            ))
                          : null}
                      </View>
                    ) : null}
                  </View>

                  {selectedGoalType ? <GoalTypeRow goalType={selectedGoalType} onRemove={handleRemoveGoalType} /> : null}
                </View>
              </DecorativeCard>
            ) : null}

            {shouldShowItemsSection && selectedGoalType ? (
              <GoalComposerCard
                goalType={selectedGoalType}
                title={goalName}
                description={goalSummaryDescription}
                targetAmount={targetAmount}
                onTargetAmountChange={setTargetAmount}
                costPerUnit={costPerUnit}
                onCostPerUnitChange={setCostPerUnit}
                onRemove={handleRemoveGoalType}
                onConfirm={handleConfirmGoal}
                confirmDisabled={isConfirmGoalDisabled}
              />
            ) : null}

            {hasCreatedGoals ? (
              <Button
                label="Continuar para fornecedores"
                onPress={handleContinueToVendors}
                className="rounded-[22px]"
                textClassName="text-[16px]"
                rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
              />
            ) : null}
          </>
        ) : null}

        {activeStep === "vendors" ? (
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

                {supplyGoals.map((goal) => {
                  const availableVendors = vendors.filter((vendor) => vendorMatchesGoal(vendor, goal));
                  const selectedVendorIds = selectedVendorIdsByGoalId[goal.id] ?? [];
                  const selectedVendors = selectedVendorIds
                    .map((vendorId) => vendors.find((vendor) => vendor.id === vendorId) ?? null)
                    .filter((vendor): vendor is VendorDto => vendor !== null);

                  return (
                    <VendorSelectionCard
                      key={goal.id}
                      goal={goal}
                      availableVendors={availableVendors}
                      selectedVendors={selectedVendors}
                      isPickerOpen={openVendorGoalId === goal.id}
                      onTogglePicker={() => handleToggleVendorPicker(goal.id)}
                      onSelectVendor={(vendor) => handleSelectVendorForGoal(goal.id, vendor)}
                      onRemoveVendor={(vendorId) => handleRemoveVendorFromGoal(goal.id, vendorId)}
                    />
                  );
                })}
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
                      Este projeto tem apenas metas financeiras no momento. Como esse valor vai direto para a ONG, nao
                      ha fornecedor para selecionar nesta etapa.
                    </Text>
                  </View>
                </View>
              </DecorativeCard>
            )}

            <Button
              label="Voltar para metas"
              onPress={() => setActiveStep("goals")}
              variant="light"
              className="rounded-[22px]"
              textClassName="text-[16px]"
              leftIcon={<Ionicons name="arrow-back" size={18} color="#22272B" />}
            />
          </>
        ) : null}
      </ScrollView>
    </AppLayout>
  );
}
