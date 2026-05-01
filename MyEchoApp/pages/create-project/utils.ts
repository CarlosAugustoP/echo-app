import { formatEth } from "../../components/project-details/projectDetailsUtils";
import type { CreateProjectGoalRequestDto, VendorDto } from "../../types/api";

import type {
  BuildCreateProjectPayloadParams,
  CreateProjectPayload,
  GoalDraft,
  GoalTypeBadgeTone,
  GoalTypeResponseShape,
  SelectedVendorIdsByGoalId,
  VendorResponseShape,
} from "./types";

export function getGoalTypeTone(goalTypeName: string): GoalTypeBadgeTone {
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

export function normalizeGoalTypesResponse(payload: GoalTypeResponseShape | null | undefined) {
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

export function normalizeVendorsResponse(payload: VendorResponseShape | null | undefined) {
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

export function formatGoalTypeLabel(goalTypeName: string) {
  return goalTypeName.replaceAll("_", " ").trim().toUpperCase();
}

export function formatVendorSupplyLabel(typeItemSupply: string) {
  return typeItemSupply.replaceAll("_", " ").trim();
}

export function isPositiveNumberInput(value: string) {
  const parsedValue = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsedValue) && parsedValue > 0;
}

export function parseDecimalValue(value?: string | number | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsedValue) ? parsedValue : NaN;
  }

  return NaN;
}

export function isMoneyGoalType(goalTypeName?: string | null) {
  return goalTypeName?.trim().toLowerCase() === "money";
}

export function formatGoalEthLabel(goal: GoalDraft) {
  const quantity = parseDecimalValue(goal.targetAmount);
  const pricePerUnit = parseDecimalValue(goal.costPerUnit);
  const totalAmount = Number.isFinite(quantity) && Number.isFinite(pricePerUnit) ? quantity * pricePerUnit : pricePerUnit;

  if (!Number.isFinite(totalAmount)) {
    return "0";
  }

  return formatEth(totalAmount).replace(" ETH", "");
}

export function getSelectedVendorsForGoal(
  goalId: string,
  selectedVendorIdsByGoalId: SelectedVendorIdsByGoalId,
  vendors: VendorDto[],
) {
  const selectedVendorIds = selectedVendorIdsByGoalId[goalId] ?? [];

  return selectedVendorIds
    .map((vendorId) => vendors.find((vendor) => vendor.id === vendorId) ?? null)
    .filter((vendor): vendor is VendorDto => vendor !== null);
}

export function getAvailableVendorsForGoal(vendors: VendorDto[]) {
  return vendors;
}

function buildGoalPayload(
  goal: GoalDraft,
  selectedVendorIdsByGoalId: SelectedVendorIdsByGoalId,
): CreateProjectGoalRequestDto {
  const normalizedTargetAmount = parseDecimalValue(goal.targetAmount);
  const normalizedCostPerUnit = parseDecimalValue(goal.costPerUnit);
  const isMoneyGoal = isMoneyGoalType(goal.goalType.name);

  if (!Number.isFinite(normalizedTargetAmount) || normalizedTargetAmount <= 0) {
    throw new Error(`A meta "${goal.title}" precisa de uma quantidade ou valor valido.`);
  }

  if (!isMoneyGoal && (!Number.isFinite(normalizedCostPerUnit) || normalizedCostPerUnit <= 0)) {
    throw new Error(`A meta "${goal.title}" precisa de um custo por unidade valido.`);
  }

  return {
    title: goal.title.trim(),
    description: goal.description.trim() || null,
    targetAmount: normalizedTargetAmount,
    currentAmount: goal.currentAmount,
    costPerUnit: isMoneyGoal ? null : normalizedCostPerUnit,
    vendorIds: isMoneyGoal ? null : (selectedVendorIdsByGoalId[goal.id] ?? []),
    goalTypeId: goal.goalType.id,
  };
}

export function buildCreateProjectPayload({
  projectName,
  projectDescription,
  createdGoals,
  selectedVendorIdsByGoalId,
}: BuildCreateProjectPayloadParams): CreateProjectPayload {
  if (createdGoals.length === 0) {
    throw new Error("Adicione pelo menos uma meta antes de concluir a revisao.");
  }

  return {
    title: projectName.trim(),
    description: projectDescription.trim(),
    goals: createdGoals.map((goal) => buildGoalPayload(goal, selectedVendorIdsByGoalId)),
  };
}
