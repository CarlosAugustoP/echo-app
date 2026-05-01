import { Ionicons } from "@expo/vector-icons";

import { Button } from "../../components/common/Button";
import { StateCard } from "../../components/common/StateCard";
import type { VendorDto } from "../../types/api";

import { ReviewBasicCard, ReviewGoalSummaryCard, ReviewReadinessCard } from "./ReviewCards";
import type { GoalDraft, SelectedVendorIdsByGoalId } from "./types";

type ReviewStepProps = {
  projectName: string;
  projectDescription: string;
  createdGoals: GoalDraft[];
  vendors: VendorDto[];
  selectedVendorIdsByGoalId: SelectedVendorIdsByGoalId;
  linkedSupplyGoalsCount: number;
  supplyGoalsCount: number;
  totalSelectedVendors: number;
  onBackToVendors: () => void;
  onSubmit: () => void;
  isSubmittingProject: boolean;
  submitError: string;
};

export function ReviewStep({
  projectName,
  projectDescription,
  createdGoals,
  vendors,
  selectedVendorIdsByGoalId,
  linkedSupplyGoalsCount,
  supplyGoalsCount,
  totalSelectedVendors,
  onBackToVendors,
  onSubmit,
  isSubmittingProject,
  submitError,
}: ReviewStepProps) {
  return (
    <>
      <ReviewBasicCard
        projectName={projectName}
        projectDescription={projectDescription}
        goalsCount={createdGoals.length}
        vendorsCount={totalSelectedVendors}
      />

      <ReviewGoalSummaryCard
        goals={createdGoals}
        vendors={vendors}
        selectedVendorIdsByGoalId={selectedVendorIdsByGoalId}
      />

      <ReviewReadinessCard
        isReviewReady
        linkedSupplyGoalsCount={linkedSupplyGoalsCount}
        supplyGoalsCount={supplyGoalsCount}
      />

      {submitError ? (
        <StateCard kind="error" title="Nao foi possivel criar o projeto" message={submitError} />
      ) : null}

      <Button
        label="Voltar para fornecedores"
        onPress={onBackToVendors}
        variant="light"
        className="rounded-[22px]"
        textClassName="text-[16px]"
        leftIcon={<Ionicons name="arrow-back" size={18} color="#22272B" />}
      />

      <Button
        label={isSubmittingProject ? "Registrando..." : "Concluir revisao"}
        onPress={onSubmit}
        disabled={isSubmittingProject}
        className="rounded-[22px]"
        textClassName="text-[16px]"
        rightIcon={<Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />}
      />
    </>
  );
}
