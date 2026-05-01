import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { TextInputProps } from "react-native";

import type { CreateProjectRequestDto, GoalTypeDto, VendorDto } from "../../types/api";

export type CreateProjectStep = "general" | "goals" | "vendors" | "review";

export type ProjectFieldProps = TextInputProps & {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  labelClassName?: string;
};

export type StepTabsProps = {
  activeStep: CreateProjectStep;
  isGeneralComplete: boolean;
  isVendorsEnabled: boolean;
  isReviewEnabled: boolean;
  onPressStep: (step: CreateProjectStep) => void;
};

export type GoalTypeBadgeTone = {
  backgroundColor: string;
  iconColor: string;
  textColor: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

export type GoalTypeResponseShape =
  | GoalTypeDto[]
  | {
      items?: GoalTypeDto[];
      data?: {
        items?: GoalTypeDto[];
      } | null;
    };

export type VendorResponseShape =
  | VendorDto[]
  | {
      items?: VendorDto[];
      data?: {
        items?: VendorDto[];
      } | null;
    };

export type GoalDraft = {
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

export type SelectedVendorIdsByGoalId = Record<string, string[]>;

export type ToastState = {
  title: string;
  message: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
};

export type BuildCreateProjectPayloadParams = {
  projectName: string;
  projectDescription: string;
  createdGoals: GoalDraft[];
  selectedVendorIdsByGoalId: SelectedVendorIdsByGoalId;
};

export type CreateProjectPayload = CreateProjectRequestDto;
