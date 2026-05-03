import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "../components/common/Button";
import { PageHeader } from "../components/common/PageHeader";
import { SkeletonBlock } from "../components/common/Skeleton";
import { StateCard } from "../components/common/StateCard";
import { AppLayout } from "../components/layout/AppLayout";
import { MilestoneCard } from "../components/project-details/MilestoneCard";
import { NgoInfoCard } from "../components/project-details/NgoInfoCard";
import { ProjectImageCarousel } from "../components/project-details/ProjectImageCarousel";
import { ProjectUpdateCard } from "../components/project-details/ProjectUpdateCard";
import { SectionCard } from "../components/project-details/SectionCard";
import { TransparencyProtocolDropdown } from "../components/project-details/TransparencyProtocolDropdown";
import {
  defaultProjectImage,
  normalizeImageUrl,
  normalizeProgress,
  sumGoalAmounts,
} from "../components/project-details/projectDetailsUtils";
import { ProjectDetailsScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import { useUserStore } from "../stores/userStore";
import type {
  CreateBlogPostRequestDto,
  GoalDto,
  GoalTypeDto,
  ProjectBlogPostHeaderDto,
  ProjectDto,
  UpdateProjectRequestDto,
  UserDto,
  VendorDto,
} from "../types/api";
import { isNgoUserRole } from "../utils/userRoles";
import { normalizeGoalTypesResponse, normalizeVendorsResponse } from "./create-project";
import { formatGoalTypeLabel, isMoneyGoalType, parseDecimalValue } from "./create-project/utils";

const projectDescriptionPreviewLines = 5;
const projectDescriptionToggleCharThreshold = 120;

type EditProjectModalProps = {
  visible: boolean;
  isSaving: boolean;
  errorMessage: string;
  titleDraft: string;
  descriptionDraft: string;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

type CreateBlogPostModalProps = {
  visible: boolean;
  isSaving: boolean;
  errorMessage: string;
  titleDraft: string;
  contentDraft: string;
  onChangeTitle: (value: string) => void;
  onChangeContent: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

type AddGoalModalProps = {
  visible: boolean;
  isSaving: boolean;
  isLoadingGoalTypes: boolean;
  isLoadingVendors: boolean;
  goalTypesError: string;
  vendorsError: string;
  errorMessage: string;
  goalTitleDraft: string;
  goalDescriptionDraft: string;
  targetAmountDraft: string;
  costPerUnitDraft: string;
  selectedGoalType: GoalTypeDto | null;
  goalTypes: GoalTypeDto[];
  vendors: VendorDto[];
  selectedVendorIds: string[];
  onChangeGoalTitle: (value: string) => void;
  onChangeGoalDescription: (value: string) => void;
  onChangeTargetAmount: (value: string) => void;
  onChangeCostPerUnit: (value: string) => void;
  onSelectGoalType: (goalType: GoalTypeDto) => void;
  onToggleVendor: (vendorId: string) => void;
  onClose: () => void;
  onSave: () => void;
};

type SectionActionButtonProps = {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
};

function SectionActionButton({ icon, label, onPress }: SectionActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2 rounded-full bg-[#EEF6EE] px-3 py-2"
      style={({ pressed }) => (pressed ? { opacity: 0.82 } : undefined)}
    >
      <Feather name={icon} size={14} color="#2F7D32" />
      <Text className="text-[12px] font-semibold uppercase tracking-[0.8px] text-[#2F7D32]">{label}</Text>
    </Pressable>
  );
}

function EditProjectModal({
  visible,
  isSaving,
  errorMessage,
  titleDraft,
  descriptionDraft,
  onChangeTitle,
  onChangeDescription,
  onClose,
  onSave,
}: EditProjectModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center bg-black/45 px-5"
      >
        <View className="w-full max-w-md rounded-[28px] bg-white px-5 py-5">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[24px] font-semibold text-[#202124]">Editar projeto</Text>
              <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">
                Atualize o titulo e a descricao exibidos para os doadores.
              </Text>
            </View>

            <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F5F2]">
              <MaterialCommunityIcons name="close" size={20} color="#5E6A63" />
            </Pressable>
          </View>

          <ScrollView className="mt-5" showsVerticalScrollIndicator={false}>
            <View className="gap-2">
              <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">Titulo</Text>
              <TextInput
                value={titleDraft}
                onChangeText={onChangeTitle}
                placeholder="Digite o nome do projeto"
                placeholderTextColor="#97A19B"
                className="min-h-[58px] rounded-[18px] bg-[#F2F5F2] px-4 text-[16px] text-[#202124]"
              />
            </View>

            <View className="mt-4 gap-2">
              <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">Descricao</Text>
              <TextInput
                value={descriptionDraft}
                onChangeText={onChangeDescription}
                placeholder="Conte um pouco mais sobre este projeto"
                placeholderTextColor="#97A19B"
                multiline
                textAlignVertical="top"
                className="min-h-[160px] rounded-[18px] bg-[#F2F5F2] px-4 py-4 text-[16px] text-[#202124]"
              />
            </View>

            {errorMessage ? (
              <View className="mt-4 rounded-[18px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-3">
                <Text className="text-[13px] leading-5 text-[#A33A3A]">{errorMessage}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View className="mt-5">
            <Button
              label={isSaving ? "Salvando..." : "Salvar alteracoes"}
              onPress={onSave}
              disabled={isSaving}
              className="rounded-[18px]"
              textClassName="text-[16px]"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CreateBlogPostModal({
  visible,
  isSaving,
  errorMessage,
  titleDraft,
  contentDraft,
  onChangeTitle,
  onChangeContent,
  onClose,
  onSave,
}: CreateBlogPostModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center bg-black/45 px-5"
      >
        <View className="w-full max-w-md rounded-[28px] bg-white px-5 py-5">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[24px] font-semibold text-[#202124]">Nova atualizacao</Text>
              <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">
                Publique uma nova historia para manter os apoiadores por dentro do projeto.
              </Text>
            </View>

            <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F5F2]">
              <MaterialCommunityIcons name="close" size={20} color="#5E6A63" />
            </Pressable>
          </View>

          <ScrollView className="mt-5" showsVerticalScrollIndicator={false}>
            <View className="gap-2">
              <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">Titulo</Text>
              <TextInput
                value={titleDraft}
                onChangeText={onChangeTitle}
                placeholder="Titulo da atualizacao"
                placeholderTextColor="#97A19B"
                className="min-h-[58px] rounded-[18px] bg-[#F2F5F2] px-4 text-[16px] text-[#202124]"
              />
            </View>

            <View className="mt-4 gap-2">
              <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">Conteudo</Text>
              <TextInput
                value={contentDraft}
                onChangeText={onChangeContent}
                placeholder="Escreva o andamento, conquistas e proximos passos do projeto"
                placeholderTextColor="#97A19B"
                multiline
                textAlignVertical="top"
                className="min-h-[180px] rounded-[18px] bg-[#F2F5F2] px-4 py-4 text-[16px] text-[#202124]"
              />
            </View>

            {errorMessage ? (
              <View className="mt-4 rounded-[18px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-3">
                <Text className="text-[13px] leading-5 text-[#A33A3A]">{errorMessage}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View className="mt-5">
            <Button
              label={isSaving ? "Publicando..." : "Publicar atualizacao"}
              onPress={onSave}
              disabled={isSaving}
              className="rounded-[18px]"
              textClassName="text-[16px]"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AddGoalModal({
  visible,
  isSaving,
  isLoadingGoalTypes,
  isLoadingVendors,
  goalTypesError,
  vendorsError,
  errorMessage,
  goalTitleDraft,
  goalDescriptionDraft,
  targetAmountDraft,
  costPerUnitDraft,
  selectedGoalType,
  goalTypes,
  vendors,
  selectedVendorIds,
  onChangeGoalTitle,
  onChangeGoalDescription,
  onChangeTargetAmount,
  onChangeCostPerUnit,
  onSelectGoalType,
  onToggleVendor,
  onClose,
  onSave,
}: AddGoalModalProps) {
  const shouldShowVendorPicker = selectedGoalType && !isMoneyGoalType(selectedGoalType.name);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center bg-black/45 px-5"
      >
        <View className="max-h-[88%] w-full max-w-md rounded-[28px] bg-white px-5 py-5">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[24px] font-semibold text-[#202124]">Adicionar meta</Text>
              <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">
                Crie uma nova meta para este projeto com tipo, quantidade e custo por unidade quando necessario.
              </Text>
            </View>

            <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F5F2]">
              <MaterialCommunityIcons name="close" size={20} color="#5E6A63" />
            </Pressable>
          </View>

          <ScrollView className="mt-5" showsVerticalScrollIndicator={false}>
            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">Nome</Text>
                <TextInput
                  value={goalTitleDraft}
                  onChangeText={onChangeGoalTitle}
                  placeholder="Nome da meta"
                  placeholderTextColor="#97A19B"
                  className="min-h-[58px] rounded-[18px] bg-[#F2F5F2] px-4 text-[16px] text-[#202124]"
                />
              </View>

              <View className="gap-2">
                <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">Descricao</Text>
                <TextInput
                  value={goalDescriptionDraft}
                  onChangeText={onChangeGoalDescription}
                  placeholder="Descreva o objetivo desta meta"
                  placeholderTextColor="#97A19B"
                  multiline
                  textAlignVertical="top"
                  className="min-h-[120px] rounded-[18px] bg-[#F2F5F2] px-4 py-4 text-[16px] text-[#202124]"
                />
              </View>

              <View className="gap-2">
                <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">Tipo</Text>
                {isLoadingGoalTypes ? (
                  <View className="rounded-[18px] bg-[#F2F5F2] px-4 py-4">
                    <Text className="text-[14px] text-[#6F7A75]">Carregando tipos de meta...</Text>
                  </View>
                ) : goalTypesError ? (
                  <View className="rounded-[18px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-4">
                    <Text className="text-[13px] leading-5 text-[#A33A3A]">{goalTypesError}</Text>
                  </View>
                ) : (
                  <View className="gap-2">
                    {goalTypes.map((goalType) => {
                      const isSelected = selectedGoalType?.id === goalType.id;

                      return (
                        <Pressable
                          key={goalType.id}
                          onPress={() => onSelectGoalType(goalType)}
                          className={`rounded-[18px] border px-4 py-4 ${
                            isSelected ? "border-[#2F7D32] bg-[#F4FBF4]" : "border-[#E7ECE8] bg-white"
                          }`}
                          style={({ pressed }) => (pressed ? { opacity: 0.82 } : undefined)}
                        >
                          <Text className={`text-[14px] font-semibold ${isSelected ? "text-[#2F7D32]" : "text-[#202124]"}`}>
                            {formatGoalTypeLabel(goalType.name)}
                          </Text>
                          <Text className="mt-1 text-[12px] leading-5 text-[#6F7A75]">{goalType.description}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              <View className="gap-2">
                <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">Quantidade alvo</Text>
                <TextInput
                  value={targetAmountDraft}
                  onChangeText={onChangeTargetAmount}
                  placeholder="Ex: 50"
                  placeholderTextColor="#97A19B"
                  keyboardType="decimal-pad"
                  className="min-h-[58px] rounded-[18px] bg-[#F2F5F2] px-4 text-[16px] text-[#202124]"
                />
              </View>

              {shouldShowVendorPicker ? (
                <>
                  <View className="gap-2">
                    <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">Custo por unidade</Text>
                    <TextInput
                      value={costPerUnitDraft}
                      onChangeText={onChangeCostPerUnit}
                      placeholder="Ex: 0.0015"
                      placeholderTextColor="#97A19B"
                      keyboardType="decimal-pad"
                      className="min-h-[58px] rounded-[18px] bg-[#F2F5F2] px-4 text-[16px] text-[#202124]"
                    />
                  </View>

                  <View className="gap-2">
                    <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">Fornecedores</Text>
                    {isLoadingVendors ? (
                      <View className="rounded-[18px] bg-[#F2F5F2] px-4 py-4">
                        <Text className="text-[14px] text-[#6F7A75]">Carregando fornecedores...</Text>
                      </View>
                    ) : vendorsError ? (
                      <View className="rounded-[18px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-4">
                        <Text className="text-[13px] leading-5 text-[#A33A3A]">{vendorsError}</Text>
                      </View>
                    ) : vendors.length === 0 ? (
                      <View className="rounded-[18px] bg-[#F2F5F2] px-4 py-4">
                        <Text className="text-[14px] text-[#6F7A75]">Nenhum fornecedor disponivel.</Text>
                      </View>
                    ) : (
                      <View className="gap-2">
                        {vendors.map((vendor) => {
                          const isSelected = selectedVendorIds.includes(vendor.id);

                          return (
                            <Pressable
                              key={vendor.id}
                              onPress={() => onToggleVendor(vendor.id)}
                              className={`rounded-[18px] border px-4 py-4 ${
                                isSelected ? "border-[#2F7D32] bg-[#F4FBF4]" : "border-[#E7ECE8] bg-white"
                              }`}
                              style={({ pressed }) => (pressed ? { opacity: 0.82 } : undefined)}
                            >
                              <View className="flex-row items-center justify-between gap-3">
                                <View className="flex-1">
                                  <Text className={`text-[14px] font-semibold ${isSelected ? "text-[#2F7D32]" : "text-[#202124]"}`}>
                                    {vendor.name}
                                  </Text>
                                  <Text className="mt-1 text-[12px] leading-5 text-[#6F7A75]">{vendor.typeItemSupply}</Text>
                                </View>
                                <MaterialCommunityIcons
                                  name={isSelected ? "check-circle" : "checkbox-blank-circle-outline"}
                                  size={20}
                                  color={isSelected ? "#2F7D32" : "#9AA59F"}
                                />
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </>
              ) : null}

              {errorMessage ? (
                <View className="rounded-[18px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-3">
                  <Text className="text-[13px] leading-5 text-[#A33A3A]">{errorMessage}</Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View className="mt-5">
            <Button
              label={isSaving ? "Salvando..." : "Adicionar meta"}
              onPress={onSave}
              disabled={isSaving}
              className="rounded-[18px]"
              textClassName="text-[16px]"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ProjectDetailsPage({ navigation, route }: ProjectDetailsScreenProps) {
  const { currentUser } = useUserStore();
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [manager, setManager] = useState<UserDto | null>(null);
  const [blogPosts, setBlogPosts] = useState<ProjectBlogPostHeaderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const [descriptionWidth, setDescriptionWidth] = useState(0);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [projectTitleDraft, setProjectTitleDraft] = useState("");
  const [projectDescriptionDraft, setProjectDescriptionDraft] = useState("");
  const [editProjectError, setEditProjectError] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isBlogPostModalOpen, setIsBlogPostModalOpen] = useState(false);
  const [blogPostTitleDraft, setBlogPostTitleDraft] = useState("");
  const [blogPostContentDraft, setBlogPostContentDraft] = useState("");
  const [blogPostError, setBlogPostError] = useState("");
  const [isSavingBlogPost, setIsSavingBlogPost] = useState(false);
  const [isUpdatingMainImage, setIsUpdatingMainImage] = useState(false);
  const [isAddingGalleryImage, setIsAddingGalleryImage] = useState(false);
  const [removingImageUrl, setRemovingImageUrl] = useState<string | null>(null);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [goalTypes, setGoalTypes] = useState<GoalTypeDto[]>([]);
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [isLoadingGoalTypes, setIsLoadingGoalTypes] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [goalTypesError, setGoalTypesError] = useState("");
  const [vendorsError, setVendorsError] = useState("");
  const [goalTitleDraft, setGoalTitleDraft] = useState("");
  const [goalDescriptionDraft, setGoalDescriptionDraft] = useState("");
  const [targetAmountDraft, setTargetAmountDraft] = useState("");
  const [costPerUnitDraft, setCostPerUnitDraft] = useState("");
  const [selectedGoalType, setSelectedGoalType] = useState<GoalTypeDto | null>(null);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [addGoalError, setAddGoalError] = useState("");
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [removingGoalId, setRemovingGoalId] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    setLoadError(null);
    const [projectResult, blogPostsResult] = await Promise.all([
      apiClient.getProjectById(route.params.projectId),
      apiClient.getBlogPosts(route.params.projectId, { pageSize: 3 }),
    ]);
    let managerResult: UserDto | null = null;

    try {
      managerResult = await apiClient.getUserById(projectResult.managerId);
    } catch {
      managerResult = null;
    }

    setProject(projectResult);
    setManager(managerResult);
    setBlogPosts(blogPostsResult.items);
    setProjectTitleDraft(projectResult.title ?? "");
    setProjectDescriptionDraft(projectResult.description ?? "");
  }, [route.params.projectId]);

  useEffect(() => {
    setIsDescriptionExpanded(false);
    setIsDescriptionTruncated(false);
    setDescriptionWidth(0);
    setManager(null);

    let isMounted = true;

    const run = async () => {
      try {
        setIsLoading(true);
        await loadProject();
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Nao foi possivel carregar este projeto agora.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [loadProject]);

  const goals = project?.goals ?? [];
  const targetAmount = useMemo(() => sumGoalAmounts(goals, "targetAmount"), [goals]);
  const currentAmount = useMemo(() => sumGoalAmounts(goals, "currentAmount"), [goals]);
  const totalProgressValue = Number(project?.progress);
  const totalProgress = Number.isFinite(totalProgressValue)
    ? Math.max(0, Math.min(100, Math.round(totalProgressValue <= 1 ? totalProgressValue * 100 : totalProgressValue)))
    : normalizeProgress(currentAmount, targetAmount);
  const mainImageUrl = normalizeImageUrl(project?.mainImage);
  const galleryImages = [project?.mainImage, ...(project?.images ?? [])];
  const validGalleryImages = galleryImages
    .map((image) => normalizeImageUrl(image))
    .filter((image): image is string => Boolean(image));
  const projectDescription = project?.description?.trim() || " ";
  const shouldShowDescriptionToggle = useMemo(() => {
    return (
      isDescriptionTruncated ||
      projectDescription.trim().length > projectDescriptionToggleCharThreshold
    );
  }, [isDescriptionTruncated, projectDescription]);
  const managerImageUrl = normalizeImageUrl(manager?.profilePicture?.url ?? null);
  const managerName = manager?.name?.trim() || project?.createdByName?.trim() || " ";
  const managerDescription =
    manager?.description?.trim() ||
    manager?.bio?.trim() ||
    project?.description?.trim() ||
    " ";
  const canDonate = !isNgoUserRole(currentUser?.role);
  const isProjectManager = Boolean(currentUser?.id && project?.createdById && currentUser.id === project.createdById);
  const shouldShowGallerySection = isProjectManager || validGalleryImages.length > 0;
  const shouldShowBlogPostsSection = isProjectManager || blogPosts.length > 0;

  const handleOpenDonation = (goal: GoalDto, goalIndex: number) => {
    navigation.navigate("DonationDetails", {
      projectId: project?.id ?? route.params.projectId,
      projectTitle: project?.title?.trim() || "Projeto",
      goal,
      goalIndex,
      smartContractAddress: project?.smartContractAddress ?? null,
    });
  };

  const handleOpenPrimaryDonation = () => {
    const firstOpenGoalIndex = goals.findIndex((goal) => {
      const progressValue = Number(goal.progress);
      const normalizedProgress = Number.isFinite(progressValue)
        ? Math.max(0, Math.min(100, Math.round(progressValue <= 1 ? progressValue * 100 : progressValue)))
        : 0;
      const targetAmountValue = Number(goal.targetAmount);
      const currentAmountValue = Number(goal.currentAmount);
      const hasFiniteTarget = Number.isFinite(targetAmountValue) && targetAmountValue > 0;
      const hasFiniteCurrent = Number.isFinite(currentAmountValue);
      const isCompleted =
        normalizedProgress >= 100 || (hasFiniteTarget && hasFiniteCurrent && currentAmountValue >= targetAmountValue);

      return !isCompleted;
    });

    if (firstOpenGoalIndex < 0) {
      return;
    }

    handleOpenDonation(goals[firstOpenGoalIndex], firstOpenGoalIndex);
  };

  const pickBase64Image = async (allowsEditing = true) => {
    if (Platform.OS !== "web") {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permissao necessaria", "Permita acesso as fotos para selecionar uma imagem.");
        return null;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing,
      quality: 0.82,
      base64: true,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    const base64 = asset?.base64?.trim();

    if (!base64) {
      throw new Error("Nao foi possivel ler a imagem selecionada.");
    }

    return base64;
  };

  const handleSaveProject = async () => {
    if (!project?.id || isSavingProject) {
      return;
    }

    const payload: UpdateProjectRequestDto = {
      title: projectTitleDraft.trim(),
      description: projectDescriptionDraft.trim(),
    };

    if (!payload.title || !payload.description) {
      setEditProjectError("Preencha o titulo e a descricao antes de salvar.");
      return;
    }

    try {
      setIsSavingProject(true);
      setEditProjectError("");
      const updatedProject = await apiClient.updateProject(project.id, payload);
      setProject(updatedProject);
      setIsEditProjectModalOpen(false);
    } catch (error) {
      setEditProjectError(error instanceof Error ? error.message : "Nao foi possivel atualizar o projeto.");
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleChangeMainImage = async () => {
    if (!project?.id || isUpdatingMainImage) {
      return;
    }

    try {
      setIsUpdatingMainImage(true);
      const base64Image = await pickBase64Image(true);

      if (!base64Image) {
        return;
      }

      const updatedProject = await apiClient.updateProjectMainImage(project.id, { base64String: base64Image });
      setProject(updatedProject);
    } catch (error) {
      Alert.alert("Nao foi possivel atualizar", error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setIsUpdatingMainImage(false);
    }
  };

  const handleAddGalleryImage = async () => {
    if (!project?.id || isAddingGalleryImage) {
      return;
    }

    try {
      setIsAddingGalleryImage(true);
      const base64Image = await pickBase64Image(false);

      if (!base64Image) {
        return;
      }

      const updatedProject = await apiClient.addProjectImage(project.id, { base64String: base64Image });
      setProject(updatedProject);
    } catch (error) {
      Alert.alert("Nao foi possivel adicionar", error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setIsAddingGalleryImage(false);
    }
  };

  const confirmRemoveGalleryImage = (imageUrl: string) => {
    if (!project?.id || removingImageUrl) {
      return;
    }

    Alert.alert("Remover imagem", "Deseja remover esta imagem da galeria?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              setRemovingImageUrl(imageUrl);
              const updatedProject = await apiClient.removeProjectImage(project.id, { imageUrl });
              setProject(updatedProject);
            } catch (error) {
              Alert.alert("Nao foi possivel remover", error instanceof Error ? error.message : "Tente novamente.");
            } finally {
              setRemovingImageUrl(null);
            }
          })();
        },
      },
    ]);
  };

  const handleCreateBlogPost = async () => {
    if (!project?.id || isSavingBlogPost) {
      return;
    }

    const payload: CreateBlogPostRequestDto = {
      title: blogPostTitleDraft.trim(),
      content: blogPostContentDraft.trim(),
    };

    if (!payload.title || !payload.content) {
      setBlogPostError("Preencha o titulo e o conteudo da atualizacao.");
      return;
    }

    try {
      setIsSavingBlogPost(true);
      setBlogPostError("");
      await apiClient.addBlogPost(project.id, payload);
      await loadProject();
      setBlogPostTitleDraft("");
      setBlogPostContentDraft("");
      setIsBlogPostModalOpen(false);
    } catch (error) {
      setBlogPostError(error instanceof Error ? error.message : "Nao foi possivel publicar a atualizacao.");
    } finally {
      setIsSavingBlogPost(false);
    }
  };

  const openEditProjectModal = () => {
    setEditProjectError("");
    setProjectTitleDraft(project?.title ?? "");
    setProjectDescriptionDraft(project?.description ?? "");
    setIsEditProjectModalOpen(true);
  };

  const openCreateBlogPostModal = () => {
    setBlogPostError("");
    setBlogPostTitleDraft("");
    setBlogPostContentDraft("");
    setIsBlogPostModalOpen(true);
  };

  const resetGoalDraft = () => {
    setGoalTitleDraft("");
    setGoalDescriptionDraft("");
    setTargetAmountDraft("");
    setCostPerUnitDraft("");
    setSelectedGoalType(null);
    setSelectedVendorIds([]);
    setAddGoalError("");
  };

  const openAddGoalModal = async () => {
    setIsAddGoalModalOpen(true);
    resetGoalDraft();
    setGoalTypesError("");
    setVendorsError("");

    try {
      setIsLoadingGoalTypes(true);
      const result = await apiClient.getGoalTypes({ pageSize: 50, pageNumber: 0 });
      setGoalTypes(normalizeGoalTypesResponse(result));
    } catch (error) {
      setGoalTypes([]);
      setGoalTypesError(error instanceof Error ? error.message : "Nao foi possivel carregar os tipos de meta.");
    } finally {
      setIsLoadingGoalTypes(false);
    }

    try {
      setIsLoadingVendors(true);
      const result = await apiClient.getVendors({ pageSize: 100, pageNumber: 0 });
      setVendors(normalizeVendorsResponse(result));
    } catch (error) {
      setVendors([]);
      setVendorsError(error instanceof Error ? error.message : "Nao foi possivel carregar os fornecedores.");
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const handleToggleVendor = (vendorId: string) => {
    setSelectedVendorIds((currentValue) =>
      currentValue.includes(vendorId) ? currentValue.filter((id) => id !== vendorId) : [...currentValue, vendorId],
    );
  };

  const handleSelectGoalType = (goalType: GoalTypeDto) => {
    setSelectedGoalType(goalType);
    setSelectedVendorIds([]);
    setCostPerUnitDraft("");
  };

  const handleSaveGoal = async () => {
    if (!project?.id || isSavingGoal) {
      return;
    }

    if (!goalTitleDraft.trim() || !goalDescriptionDraft.trim()) {
      setAddGoalError("Preencha nome e descricao da meta.");
      return;
    }

    if (!selectedGoalType) {
      setAddGoalError("Selecione um tipo de meta.");
      return;
    }

    const targetAmount = parseDecimalValue(targetAmountDraft);
    const isMoneyGoal = isMoneyGoalType(selectedGoalType.name);
    const costPerUnit = parseDecimalValue(costPerUnitDraft);

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setAddGoalError("Informe uma quantidade alvo valida.");
      return;
    }

    if (!isMoneyGoal && (!Number.isFinite(costPerUnit) || costPerUnit <= 0)) {
      setAddGoalError("Informe um custo por unidade valido.");
      return;
    }

    if (!isMoneyGoal && selectedVendorIds.length === 0) {
      setAddGoalError("Selecione pelo menos um fornecedor para esta meta.");
      return;
    }

    try {
      setIsSavingGoal(true);
      setAddGoalError("");
      await apiClient.addGoal(project.id, {
        title: goalTitleDraft.trim(),
        description: goalDescriptionDraft.trim(),
        targetAmount,
        currentAmount: 0,
        costPerUnit: isMoneyGoal ? null : costPerUnit,
        vendorIds: isMoneyGoal ? null : selectedVendorIds,
        goalTypeId: selectedGoalType.id,
      });
      await loadProject();
      setIsAddGoalModalOpen(false);
      resetGoalDraft();
    } catch (error) {
      setAddGoalError(error instanceof Error ? error.message : "Nao foi possivel adicionar a meta.");
    } finally {
      setIsSavingGoal(false);
    }
  };

  const confirmRemoveGoal = (goal: GoalDto) => {
    if (!project?.id || removingGoalId) {
      return;
    }

    Alert.alert("Remover meta", `Deseja remover a meta "${goal.title}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              setRemovingGoalId(goal.id);
              await apiClient.removeGoal(project.id, goal.id);
              await loadProject();
            } catch (error) {
              Alert.alert("Nao foi possivel remover", error instanceof Error ? error.message : "Tente novamente.");
            } finally {
              setRemovingGoalId(null);
            }
          })();
        },
      },
    ]);
  };

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="inicio">
      <ScrollView className="flex-1" contentContainerClassName="gap-6 pb-10" showsVerticalScrollIndicator={false}>
        <PageHeader
          title={project?.title?.trim() || " "}
          description={project?.createdByName ? `Por ${project.createdByName}` : undefined}
          backLabel="Conheca o projeto"
          onBackPress={() => navigation.goBack()}
          rightSlot={
            isProjectManager ? (
              <SectionActionButton icon="edit-2" label="Editar" onPress={openEditProjectModal} />
            ) : (
              <View className="mt-10 h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF6EE]">
                <MaterialCommunityIcons name="hand-heart-outline" size={22} color="#2F7D32" />
              </View>
            )
          }
        />

        {isLoading && !project ? (
          <View className="gap-4">
            <SkeletonBlock height={212} borderRadius={24} />
            <View className="rounded-[18px] border border-[#EEF1EB] bg-white px-4 py-6">
              <SkeletonBlock height={20} width="36%" borderRadius={999} />
              <View className="mt-4 gap-3">
                <SkeletonBlock height={16} width="100%" borderRadius={999} />
                <SkeletonBlock height={16} width="90%" borderRadius={999} />
                <SkeletonBlock height={16} width="76%" borderRadius={999} />
              </View>
            </View>
          </View>
        ) : (
          <View className="overflow-hidden rounded-[24px] bg-[#EEF2EE]">
            {mainImageUrl ? (
              <Image source={{ uri: mainImageUrl }} className="h-[212px] w-full" resizeMode="cover" />
            ) : (
              <View className="h-[212px] w-full items-center justify-center bg-[#EEF2EE]">
                <Image
                  source={defaultProjectImage}
                  className="h-[92px] w-[92px]"
                  resizeMode="contain"
                  style={{ opacity: 0.18 }}
                />
              </View>
            )}

            {isProjectManager ? (
              <View className="absolute right-4 top-4">
                <SectionActionButton
                  icon="image"
                  label={isUpdatingMainImage ? "Enviando..." : mainImageUrl ? "Trocar capa" : "Adicionar capa"}
                  onPress={() => {
                    void handleChangeMainImage();
                  }}
                />
              </View>
            ) : null}

            <View className="absolute bottom-4 left-4 right-4 rounded-[18px] bg-white/95 px-4 py-3">
              <Text className="text-[9px] font-normal uppercase tracking-[1px] text-[#94A3B8]">
                Acumulado ate agora
              </Text>
              <View className="mt-2">
                <Text className="text-[30px] font-bold leading-8 text-[#2F7D32]">{totalProgress}%</Text>
                <View className="mt-3 h-[6px] overflow-hidden rounded-full bg-[#E4E7E5]">
                  <View className="h-full rounded-full bg-[#2F7D32]" style={{ width: `${totalProgress}%` }} />
                </View>
              </View>
            </View>
          </View>
        )}

        {isLoading && !project ? null : isLoading ? <StateCard kind="loading" message="Carregando projeto..." /> : null}

        {loadError ? <StateCard kind="error" message={loadError} /> : null}

        <View className="overflow-hidden rounded-[18px] border border-[#EEF1EB] bg-white px-4 py-6">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-[20px] font-semibold leading-6 text-[#202124]">Sobre o projeto</Text>
            {isProjectManager ? <SectionActionButton icon="edit-2" label="Editar" onPress={openEditProjectModal} /> : null}
          </View>

          <View
            className="relative mt-[10px]"
            onLayout={({ nativeEvent }) => {
              const nextWidth = Math.round(nativeEvent.layout.width);

              if (nextWidth > 0 && nextWidth !== descriptionWidth) {
                setDescriptionWidth(nextWidth);
              }
            }}
          >
            {descriptionWidth > 0 && !isDescriptionExpanded ? (
              <Text
                className="absolute text-[18px] leading-7 text-[#525B57] opacity-0"
                style={{ width: descriptionWidth }}
                onTextLayout={({ nativeEvent }) => {
                  setIsDescriptionTruncated(nativeEvent.lines.length > projectDescriptionPreviewLines);
                }}
              >
                {projectDescription}
              </Text>
            ) : null}

            <Text
              className="text-[18px] leading-7 text-[#525B57]"
              numberOfLines={isDescriptionExpanded ? undefined : projectDescriptionPreviewLines}
              ellipsizeMode="tail"
            >
              {projectDescription}
            </Text>
          </View>

          {shouldShowDescriptionToggle ? (
            <Pressable
              className="mt-1 self-end"
              onPress={() => setIsDescriptionExpanded((currentValue) => !currentValue)}
              style={({ pressed }) => (pressed ? { opacity: 0.72 } : undefined)}
            >
              <Text className="text-[12px]  mt-2 font-semibold uppercase tracking-[0.08em] leading-[18px] text-[#202124]">
                {isDescriptionExpanded ? "ler menos" : "ler mais"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View className="overflow-hidden rounded-[18px] border border-[#EEF1EB] bg-white px-4 py-6">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-[20px] font-semibold leading-6 text-[#202124]">Metas do projeto</Text>
            {isProjectManager ? <SectionActionButton icon="plus" label="Meta" onPress={() => void openAddGoalModal()} /> : null}
          </View>

          <View className="mt-4 gap-3">
            {goals.length > 0 ? (
              goals.map((goal, index) => (
                <MilestoneCard
                  key={goal.id}
                  goal={goal}
                  index={index}
                  contractAddress={project?.smartContractAddress}
                  onDonatePress={canDonate ? () => handleOpenDonation(goal, index) : undefined}
                  topRightSlot={
                    isProjectManager ? (
                      <Pressable
                        onPress={() => confirmRemoveGoal(goal)}
                        disabled={removingGoalId === goal.id}
                        className="rounded-full bg-[#FFF1F1] px-3 py-2"
                        style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}
                      >
                        <Text className="text-[11px] font-semibold uppercase tracking-[0.7px] text-[#C84D4D]">
                          {removingGoalId === goal.id ? "Removendo..." : "Remover"}
                        </Text>
                      </Pressable>
                    ) : null
                  }
                />
              ))
            ) : (
              <SectionCard
                title={isProjectManager ? "Nenhuma meta criada ainda" : "Nenhuma meta disponivel"}
                description={
                  isProjectManager
                    ? "Assim que novas metas forem cadastradas, elas aparecerao aqui para voce acompanhar."
                    : "Esta ONG ainda nao publicou metas para este projeto."
                }
              />
            )}
          </View>
        </View>

        <TransparencyProtocolDropdown contractAddress={project?.smartContractAddress} />

        <NgoInfoCard name={managerName} description={managerDescription} imageUrl={managerImageUrl} />

        {shouldShowGallerySection ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-[24px] font-semibold leading-7 text-[#202124]">Observe seu impacto em acao</Text>
              {isProjectManager ? (
                <SectionActionButton
                  icon="plus"
                  label={isAddingGalleryImage ? "Enviando..." : "Imagem"}
                  onPress={() => {
                    void handleAddGalleryImage();
                  }}
                />
              ) : null}
            </View>

            {validGalleryImages.length > 0 ? (
              <>
                <ProjectImageCarousel images={galleryImages} />

                {isProjectManager ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                    {validGalleryImages.map((imageUrl) => {
                      const isRemovingCurrentImage = removingImageUrl === imageUrl;

                      return (
                        <View key={imageUrl} className="w-[124px] gap-2">
                          <Image source={{ uri: imageUrl }} className="h-[88px] w-full rounded-[16px]" resizeMode="cover" />
                          <Pressable
                            onPress={() => confirmRemoveGalleryImage(imageUrl)}
                            disabled={isRemovingCurrentImage}
                            className="items-center rounded-full bg-[#FFF1F1] px-3 py-2"
                            style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}
                          >
                            <Text className="text-[11px] font-semibold uppercase tracking-[0.7px] text-[#C84D4D]">
                              {isRemovingCurrentImage ? "Removendo..." : "Remover"}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </ScrollView>
                ) : null}

                {canDonate ? (
                  <Button
                    label="Doar agora"
                    onPress={handleOpenPrimaryDonation}
                    className="min-h-[60px] rounded-[18px]"
                    textClassName="text-[17px]"
                    rightIcon={<MaterialCommunityIcons name="hand-heart-outline" size={18} color="#FFFFFF" />}
                  />
                ) : null}
              </>
            ) : (
              <SectionCard
                title="Monte a galeria visual do projeto"
                description="A ONG responsavel sempre ve esta secao, mesmo vazia, para poder incluir imagens assim que quiser."
              />
            )}
          </View>
        ) : null}

        {shouldShowBlogPostsSection ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-[24px] font-semibold leading-7 text-[#202124]">Faca parte dessa historia</Text>
              {isProjectManager ? <SectionActionButton icon="plus" label="Post" onPress={openCreateBlogPostModal} /> : null}
            </View>

            {blogPosts.length > 0 ? (
              <ProjectUpdateCard
                blogPost={blogPosts[0]}
                onPress={() =>
                  navigation.navigate("ProjectBlogPost", {
                    blogPostId: blogPosts[0].id,
                    projectId: route.params.projectId,
                    projectTitle: project?.title?.trim() || undefined,
                  })
                }
              />
            ) : (
              <SectionCard
                title="Nenhuma atualizacao publicada ainda"
                description={
                  isProjectManager
                    ? "Crie a primeira atualizacao para compartilhar marcos, fotos e proximos passos com os apoiadores."
                    : "A ONG ainda nao publicou atualizacoes deste projeto."
                }
              />
            )}
          </View>
        ) : null}
      </ScrollView>

      <EditProjectModal
        visible={isEditProjectModalOpen}
        isSaving={isSavingProject}
        errorMessage={editProjectError}
        titleDraft={projectTitleDraft}
        descriptionDraft={projectDescriptionDraft}
        onChangeTitle={setProjectTitleDraft}
        onChangeDescription={setProjectDescriptionDraft}
        onClose={() => {
          if (!isSavingProject) {
            setIsEditProjectModalOpen(false);
          }
        }}
        onSave={() => {
          void handleSaveProject();
        }}
      />

      <CreateBlogPostModal
        visible={isBlogPostModalOpen}
        isSaving={isSavingBlogPost}
        errorMessage={blogPostError}
        titleDraft={blogPostTitleDraft}
        contentDraft={blogPostContentDraft}
        onChangeTitle={setBlogPostTitleDraft}
        onChangeContent={setBlogPostContentDraft}
        onClose={() => {
          if (!isSavingBlogPost) {
            setIsBlogPostModalOpen(false);
          }
        }}
        onSave={() => {
          void handleCreateBlogPost();
        }}
      />

      <AddGoalModal
        visible={isAddGoalModalOpen}
        isSaving={isSavingGoal}
        isLoadingGoalTypes={isLoadingGoalTypes}
        isLoadingVendors={isLoadingVendors}
        goalTypesError={goalTypesError}
        vendorsError={vendorsError}
        errorMessage={addGoalError}
        goalTitleDraft={goalTitleDraft}
        goalDescriptionDraft={goalDescriptionDraft}
        targetAmountDraft={targetAmountDraft}
        costPerUnitDraft={costPerUnitDraft}
        selectedGoalType={selectedGoalType}
        goalTypes={goalTypes}
        vendors={vendors}
        selectedVendorIds={selectedVendorIds}
        onChangeGoalTitle={setGoalTitleDraft}
        onChangeGoalDescription={setGoalDescriptionDraft}
        onChangeTargetAmount={setTargetAmountDraft}
        onChangeCostPerUnit={setCostPerUnitDraft}
        onSelectGoalType={handleSelectGoalType}
        onToggleVendor={handleToggleVendor}
        onClose={() => {
          if (!isSavingGoal) {
            setIsAddGoalModalOpen(false);
          }
        }}
        onSave={() => {
          void handleSaveGoal();
        }}
      />
    </AppLayout>
  );
}
