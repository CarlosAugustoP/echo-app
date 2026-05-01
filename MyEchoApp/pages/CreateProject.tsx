import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { PageHeader } from "../components/common/PageHeader";
import { AppLayout } from "../components/layout/AppLayout";
import type { CreateProjectScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import type { GoalTypeDto, VendorDto } from "../types/api";

import {
  buildCreateProjectPayload,
  GeneralStep,
  GoalsStep,
  isMoneyGoalType,
  isPositiveNumberInput,
  normalizeGoalTypesResponse,
  normalizeVendorsResponse,
  ReviewStep,
  StepTabs,
  type CreateProjectStep,
  type GoalDraft,
  type GoalTypeResponseShape,
  type ToastState,
  type VendorResponseShape,
  VendorsStep,
} from "./create-project";

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
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isGeneralComplete = useMemo(
    () => projectName.trim().length > 0 && projectDescription.trim().length > 0,
    [projectDescription, projectName],
  );
  const isGoalBasicsReady = useMemo(
    () => goalName.trim().length > 0 && goalSummaryDescription.trim().length > 0,
    [goalName, goalSummaryDescription],
  );
  const shouldShowItemsSection = isGoalDraftUnlocked && isGoalBasicsReady;
  const hasCreatedGoals = createdGoals.length > 0;
  const supplyGoals = useMemo(
    () => createdGoals.filter((goal) => !isMoneyGoalType(goal.goalType.name)),
    [createdGoals],
  );
  const moneyGoalsCount = createdGoals.length - supplyGoals.length;
  const linkedSupplyGoalsCount = useMemo(
    () => supplyGoals.filter((goal) => (selectedVendorIdsByGoalId[goal.id] ?? []).length > 0).length,
    [selectedVendorIdsByGoalId, supplyGoals],
  );
  const totalSelectedVendors = useMemo(
    () => Object.values(selectedVendorIdsByGoalId).reduce((total, vendorIds) => total + vendorIds.length, 0),
    [selectedVendorIdsByGoalId],
  );
  const pendingSupplyGoalsCount = supplyGoals.length - linkedSupplyGoalsCount;
  const isReviewEnabled = hasCreatedGoals && pendingSupplyGoalsCount === 0;
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

  const showToast = (title: string, message: string, iconName: React.ComponentProps<typeof Ionicons>["name"] = "checkmark") => {
    setToastState({ title, message, iconName });

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToastState(null);
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

    if (step === "review" && !isReviewEnabled) {
      return;
    }

    setSubmitError("");
    setActiveStep(step);
  };

  const handleContinueToVendors = () => {
    if (!hasCreatedGoals) {
      return;
    }

    setSubmitError("");
    setActiveStep("vendors");
  };

  const handleContinueToReview = () => {
    if (!isReviewEnabled) {
      return;
    }

    setSubmitError("");
    setActiveStep("review");
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
    showToast("Meta confirmada", "Meta salva com sucesso. Voce pode adicionar outras metas agora.");

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

  const handleSubmitProject = async () => {
    if (isSubmittingProject) {
      return;
    }

    try {
      setIsSubmittingProject(true);
      setSubmitError("");

      const payload = buildCreateProjectPayload({
        projectName,
        projectDescription,
        createdGoals,
        selectedVendorIdsByGoalId,
      });
      const project = await apiClient.createProject(payload);

      navigation.replace("ProjectDetails", { projectId: project.id });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Nao foi possivel criar o projeto.");
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const pageTitle =
    activeStep === "general"
      ? "Criar novo projeto"
      : activeStep === "goals"
        ? "Definir metas detalhadas"
        : activeStep === "vendors"
          ? "Selecionar fornecedores"
          : "Revise Seu Projeto";
  const pageDescription =
    activeStep === "general"
      ? "Inicie um novo registro no Living Ledger. Defina os parametros fundamentais para iniciar a captacao de impacto."
      : activeStep === "goals"
        ? "Estabeleca as quantidades especificas e valores para o seu novo projeto de impacto. Essas metas serao visiveis para os doadores."
        : activeStep === "vendors"
          ? "Vincule cada meta de suprimentos a um fornecedor homologado. Metas financeiras ficam fora desta etapa porque o repasse vai direto para a ONG."
          : "Confira todos os detalhes antes de registrar no Living Ledger. Esta acao e imutavel e define a transparencia do seu impacto.";
  const pageEyebrow = activeStep === "review" ? "REVIEW" : undefined;

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
          eyebrow={pageEyebrow}
          title={pageTitle}
          description={pageDescription}
        />

        <StepTabs
          activeStep={activeStep}
          isGeneralComplete={isGeneralComplete}
          isVendorsEnabled={hasCreatedGoals}
          isReviewEnabled={isReviewEnabled}
          onPressStep={handleStepPress}
        />

        {toastState ? (
          <View className="rounded-[18px] border border-[#CFE7D1] bg-[#F3FBF4] px-4 py-4">
            <View className="flex-row items-start gap-3">
              <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-[#DDF1DF]">
                <Ionicons name={toastState.iconName} size={18} color="#2F7D32" />
              </View>
              <View className="flex-1">
                <Text className="text-[12px] font-bold uppercase tracking-[1.1px] text-[#2F7D32]">{toastState.title}</Text>
                <Text className="mt-1 text-[13px] leading-5 text-[#5F6763]">{toastState.message}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {activeStep === "general" ? (
          <GeneralStep
            projectName={projectName}
            projectDescription={projectDescription}
            onProjectNameChange={setProjectName}
            onProjectDescriptionChange={setProjectDescription}
            isGeneralComplete={isGeneralComplete}
            onContinue={handleContinueToGoals}
          />
        ) : null}

        {activeStep === "goals" ? (
          <GoalsStep
            createdGoals={createdGoals}
            goalName={goalName}
            goalSummaryDescription={goalSummaryDescription}
            onGoalNameChange={setGoalName}
            onGoalSummaryDescriptionChange={setGoalSummaryDescription}
            isGoalBasicsReady={isGoalBasicsReady}
            onUnlockGoalDraft={handleUnlockGoalDraft}
            shouldShowItemsSection={shouldShowItemsSection}
            isGoalTypePickerOpen={isGoalTypePickerOpen}
            onToggleGoalTypePicker={() => setIsGoalTypePickerOpen((currentValue) => !currentValue)}
            selectedGoalType={selectedGoalType}
            goalTypes={goalTypes}
            isLoadingGoalTypes={isLoadingGoalTypes}
            goalTypesError={goalTypesError}
            onSelectGoalType={handleSelectGoalType}
            onRemoveGoalType={handleRemoveGoalType}
            targetAmount={targetAmount}
            onTargetAmountChange={setTargetAmount}
            costPerUnit={costPerUnit}
            onCostPerUnitChange={setCostPerUnit}
            onConfirmGoal={handleConfirmGoal}
            isConfirmGoalDisabled={isConfirmGoalDisabled}
            onContinueToVendors={handleContinueToVendors}
          />
        ) : null}

        {activeStep === "vendors" ? (
          <VendorsStep
            isLoadingVendors={isLoadingVendors}
            vendorsError={vendorsError}
            moneyGoalsCount={moneyGoalsCount}
            supplyGoals={supplyGoals}
            vendors={vendors}
            selectedVendorIdsByGoalId={selectedVendorIdsByGoalId}
            openVendorGoalId={openVendorGoalId}
            onToggleVendorPicker={handleToggleVendorPicker}
            onSelectVendorForGoal={handleSelectVendorForGoal}
            onRemoveVendorFromGoal={handleRemoveVendorFromGoal}
            onBackToGoals={() => setActiveStep("goals")}
            onContinueToReview={handleContinueToReview}
            isReviewEnabled={isReviewEnabled}
            pendingSupplyGoalsCount={pendingSupplyGoalsCount}
          />
        ) : null}

        {activeStep === "review" ? (
          <ReviewStep
            projectName={projectName}
            projectDescription={projectDescription}
            createdGoals={createdGoals}
            vendors={vendors}
            selectedVendorIdsByGoalId={selectedVendorIdsByGoalId}
            linkedSupplyGoalsCount={linkedSupplyGoalsCount}
            supplyGoalsCount={supplyGoals.length}
            totalSelectedVendors={totalSelectedVendors}
            onBackToVendors={() => setActiveStep("vendors")}
            onSubmit={handleSubmitProject}
            isSubmittingProject={isSubmittingProject}
            submitError={submitError}
          />
        ) : null}
      </ScrollView>
    </AppLayout>
  );
}
