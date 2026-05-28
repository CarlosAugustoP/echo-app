import { useEffect, useMemo } from "react";
import { Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../navigation/types";
import { setCurrentUser, useUserStore } from "../../stores/userStore";
import { advanceAppTour, dismissAppTour, useAppTourStore } from "../../stores/appTourStore";
import type { UserDto } from "../../types/api";
import { isAdminUserRole, isDonorUserRole, isNgoUserRole } from "../../utils/userRoles";

type TourStepAction =
  | { type: "next" }
  | { type: "navigate"; screen: keyof RootStackParamList; params?: Record<string, unknown> | undefined }
  | { type: "finish" };

type TourStep = {
  id: string;
  routeName: keyof RootStackParamList;
  targetId: string;
  title: string;
  description: string;
  primaryLabel: string;
  accentColor: string;
  action: TourStepAction;
};

function buildDonorSteps(): TourStep[] {
  return [
    {
      id: "donor-home",
      routeName: "AppHome",
      targetId: "tour-donor-home-hero",
      title: "Sua base de impacto",
      description: "A home reune destaques, impacto acumulado e atalhos para voce comecar a explorar o ecossistema Echo.",
      primaryLabel: "Continuar",
      accentColor: "#2F7D32",
      action: { type: "next" },
    },
    {
      id: "donor-go-search",
      routeName: "AppHome",
      targetId: "tour-footer-pesquisa",
      title: "Primeiro pare na busca",
      description: "Esse atalho leva voce para descobrir ONGs, projetos e perfis institucionais da rede.",
      primaryLabel: "Abrir busca",
      accentColor: "#3F67C9",
      action: { type: "navigate", screen: "Search" },
    },
    {
      id: "donor-search",
      routeName: "Search",
      targetId: "tour-search-panel",
      title: "Descubra onde apoiar",
      description: "Use a pesquisa para comparar causas, abrir perfis institucionais e chegar aos projetos certos com contexto.",
      primaryLabel: "Continuar",
      accentColor: "#3F67C9",
      action: { type: "next" },
    },
    {
      id: "donor-go-history",
      routeName: "Search",
      targetId: "tour-footer-historico",
      title: "Agora veja seu historico",
      description: "Aqui voce acompanha doacoes feitas e cada evento importante do caminho da contribuicao.",
      primaryLabel: "Abrir historico",
      accentColor: "#B7791F",
      action: { type: "navigate", screen: "DonationHistory" },
    },
    {
      id: "donor-history",
      routeName: "DonationHistory",
      targetId: "tour-donation-history-intro",
      title: "Rastreabilidade completa",
      description: "O historico mostra os registros das suas contribuicoes para que voce acompanhe tudo com transparencia.",
      primaryLabel: "Continuar",
      accentColor: "#B7791F",
      action: { type: "next" },
    },
    {
      id: "donor-go-dashboard",
      routeName: "DonationHistory",
      targetId: "tour-footer-dashboard",
      title: "Painel de impacto",
      description: "No dashboard voce enxerga uma leitura rapida da sua evolucao e distribuicao de impacto.",
      primaryLabel: "Abrir dashboard",
      accentColor: "#2C8F7B",
      action: { type: "navigate", screen: "Dashboard" },
    },
    {
      id: "donor-dashboard",
      routeName: "Dashboard",
      targetId: "tour-dashboard-summary",
      title: "Resumo do que voce gerou",
      description: "Esse cartao resume seu impacto mais recente e ajuda a perceber a tendencia das suas contribuicoes.",
      primaryLabel: "Continuar",
      accentColor: "#2C8F7B",
      action: { type: "next" },
    },
    {
      id: "donor-go-profile",
      routeName: "Dashboard",
      targetId: "tour-footer-perfil",
      title: "Finalize no seu perfil",
      description: "O perfil guarda seus dados, identidade e configuracoes da conta.",
      primaryLabel: "Abrir perfil",
      accentColor: "#8A5CF6",
      action: { type: "navigate", screen: "Profile" },
    },
    {
      id: "donor-profile",
      routeName: "Profile",
      targetId: "tour-profile-identity",
      title: "Tudo certo para comecar",
      description: "Seu perfil e o lugar para revisar dados, carteira e a forma como voce aparece dentro da Echo.",
      primaryLabel: "Concluir tour",
      accentColor: "#8A5CF6",
      action: { type: "finish" },
    },
  ];
}

function buildNgoSteps(currentUser: UserDto): TourStep[] {
  return [
    {
      id: "ngo-home",
      routeName: "AppHome",
      targetId: "tour-ngo-home-hero",
      title: "Centro da sua operacao",
      description: "A home da ONG destaca o que esta ativo e ajuda a acompanhar a frente mais importante do momento.",
      primaryLabel: "Continuar",
      accentColor: "#2F7D32",
      action: { type: "next" },
    },
    {
      id: "ngo-go-search",
      routeName: "AppHome",
      targetId: "tour-footer-pesquisa",
      title: "Explore a rede",
      description: "Na busca voce encontra perfis institucionais, projetos publicos e outras organizacoes da comunidade.",
      primaryLabel: "Abrir busca",
      accentColor: "#3F67C9",
      action: { type: "navigate", screen: "Search" },
    },
    {
      id: "ngo-search",
      routeName: "Search",
      targetId: "tour-search-panel",
      title: "Perfil institucional e descoberta",
      description: "A pesquisa tambem abre perfis detalhados das ONGs para reforcar transparencia e visibilidade institucional.",
      primaryLabel: "Continuar",
      accentColor: "#3F67C9",
      action: { type: "next" },
    },
    {
      id: "ngo-go-projects",
      routeName: "Search",
      targetId: "tour-footer-projetos",
      title: "Gerencie seus projetos",
      description: "Esse atalho leva para a area onde sua organizacao publica e acompanha os projetos ativos.",
      primaryLabel: "Abrir projetos",
      accentColor: "#2C8F7B",
      action: {
        type: "navigate",
        screen: "ProjectsList",
        params: { managerId: currentUser.id },
      },
    },
    {
      id: "ngo-projects",
      routeName: "ProjectsList",
      targetId: "tour-projects-list-header",
      title: "Sua vitrine operacional",
      description: "Aqui voce revisa os projetos da ONG, abre detalhes e acompanha a evolucao de cada iniciativa.",
      primaryLabel: "Continuar",
      accentColor: "#2C8F7B",
      action: { type: "next" },
    },
    {
      id: "ngo-go-vendors",
      routeName: "ProjectsList",
      targetId: "tour-footer-fornecedores",
      title: "Rede de fornecedores",
      description: "Essa area concentra parceiros homologados e o relacionamento operacional com fornecedores.",
      primaryLabel: "Abrir fornecedores",
      accentColor: "#B7791F",
      action: { type: "navigate", screen: "Vendors" },
    },
    {
      id: "ngo-vendors",
      routeName: "Vendors",
      targetId: "tour-vendors-hero",
      title: "Confianca operacional",
      description: "Os fornecedores ajudam a transformar recursos em entrega concreta com rastreabilidade e curadoria.",
      primaryLabel: "Continuar",
      accentColor: "#B7791F",
      action: { type: "next" },
    },
    {
      id: "ngo-go-profile",
      routeName: "Vendors",
      targetId: "tour-footer-perfil",
      title: "Feche com o seu perfil",
      description: "Mantenha os dados institucionais em ordem para fortalecer a confianca publica na sua organizacao.",
      primaryLabel: "Abrir perfil",
      accentColor: "#8A5CF6",
      action: { type: "navigate", screen: "Profile" },
    },
    {
      id: "ngo-profile",
      routeName: "Profile",
      targetId: "tour-profile-identity",
      title: "Organizacao pronta para operar",
      description: "O perfil institucional e a base para identidade, comunicacao e confianca dentro da plataforma.",
      primaryLabel: "Concluir tour",
      accentColor: "#8A5CF6",
      action: { type: "finish" },
    },
  ];
}

function buildAdminSteps(): TourStep[] {
  return [
    {
      id: "admin-home",
      routeName: "AppHome",
      targetId: "tour-admin-home-hero",
      title: "Seu painel de curadoria",
      description: "A home administrativa concentra as decisoes mais sensiveis da rede, como aprovacoes e revisoes operacionais.",
      primaryLabel: "Continuar",
      accentColor: "#2F7D32",
      action: { type: "next" },
    },
    {
      id: "admin-go-search",
      routeName: "AppHome",
      targetId: "tour-footer-pesquisa",
      title: "Busca para revisar usuarios",
      description: "Use a pesquisa para abrir ONGs, verificar perfis e navegar pelos sinais de confianca do ecossistema.",
      primaryLabel: "Abrir busca",
      accentColor: "#3F67C9",
      action: { type: "navigate", screen: "Search" },
    },
    {
      id: "admin-search",
      routeName: "Search",
      targetId: "tour-search-panel",
      title: "Ferramenta de validacao",
      description: "Aqui voce localiza organizacoes e faz a curadoria de usuarios com mais contexto.",
      primaryLabel: "Continuar",
      accentColor: "#3F67C9",
      action: { type: "next" },
    },
    {
      id: "admin-go-profile",
      routeName: "Search",
      targetId: "tour-footer-perfil",
      title: "Seu contexto administrativo",
      description: "No perfil ficam os dados da sua conta e a identidade administrativa usada nas operacoes da Echo.",
      primaryLabel: "Abrir perfil",
      accentColor: "#8A5CF6",
      action: { type: "navigate", screen: "Profile" },
    },
    {
      id: "admin-profile",
      routeName: "Profile",
      targetId: "tour-profile-identity",
      title: "Pronto para curar a rede",
      description: "Agora voce conhece os atalhos principais para revisar usuarios, fornecedores e o contexto da operacao.",
      primaryLabel: "Concluir tour",
      accentColor: "#8A5CF6",
      action: { type: "finish" },
    },
  ];
}

function buildTourSteps(currentUser: UserDto | null) {
  if (!currentUser) {
    return [];
  }

  if (isAdminUserRole(currentUser.role)) {
    return buildAdminSteps();
  }

  if (isNgoUserRole(currentUser.role)) {
    return buildNgoSteps(currentUser);
  }

  if (isDonorUserRole(currentUser.role)) {
    return buildDonorSteps();
  }

  return [];
}

export function AppTourOverlay() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { currentUser } = useUserStore();
  const { active, stepIndex, targetLayouts } = useAppTourStore();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const steps = useMemo(() => buildTourSteps(currentUser), [currentUser]);
  const currentStep = steps[stepIndex];
  const currentTargetLayout = currentStep ? targetLayouts[currentStep.targetId] : undefined;

  useEffect(() => {
    if (!active || !currentStep) {
      return;
    }

    if (stepIndex >= steps.length) {
      dismissAppTour();
    }
  }, [active, currentStep, stepIndex, steps.length]);

  if (!active || !currentUser || !currentUser.isFirstAccess || !currentStep) {
    return null;
  }

  if (route.name !== currentStep.routeName) {
    return null;
  }

  const handleCloseTour = () => {
    dismissAppTour();
    setCurrentUser({
      ...currentUser,
      isFirstAccess: false,
    });
  };

  const handlePrimaryAction = () => {
    if (currentStep.action.type === "next") {
      advanceAppTour();
      return;
    }

    if (currentStep.action.type === "navigate") {
      advanceAppTour();
      navigation.dispatch(
        CommonActions.navigate({
          name: currentStep.action.screen,
          params: currentStep.action.params,
        }),
      );
      return;
    }

    handleCloseTour();
  };

  if (!currentTargetLayout) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={handleCloseTour}>
        <View className="flex-1 items-center justify-center bg-[#09110D]/72 px-5">
          <View className="w-full max-w-md rounded-[28px] bg-white px-5 py-5">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-[#7F8E86]">
              Tour guiado {stepIndex + 1}/{steps.length}
            </Text>
            <Text className="mt-3 text-[26px] font-semibold leading-8 text-[#202124]">{currentStep.title}</Text>
            <Text className="mt-3 text-[14px] leading-6 text-[#66736C]">{currentStep.description}</Text>
            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={handleCloseTour}
                className="flex-1 items-center justify-center rounded-[18px] border border-[#DCE4DD] bg-[#FAFCFA] px-4 py-4"
              >
                <Text className="text-[14px] font-semibold text-[#65726A]">Pular tour</Text>
              </Pressable>
              <Pressable
                onPress={handlePrimaryAction}
                className="flex-1 items-center justify-center rounded-[18px] px-4 py-4"
                style={{ backgroundColor: currentStep.accentColor }}
              >
                <Text className="text-[14px] font-semibold text-white">{currentStep.primaryLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const spotlightPadding = 10;
  const spotlightX = Math.max(0, currentTargetLayout.x - spotlightPadding);
  const spotlightY = Math.max(0, currentTargetLayout.y - spotlightPadding);
  const spotlightWidth = Math.min(windowWidth - spotlightX, currentTargetLayout.width + spotlightPadding * 2);
  const spotlightHeight = currentTargetLayout.height + spotlightPadding * 2;
  const tooltipWidth = Math.min(windowWidth - 24, 320);
  const tooltipLeft = Math.min(
    Math.max(12, spotlightX + spotlightWidth / 2 - tooltipWidth / 2),
    windowWidth - tooltipWidth - 12,
  );
  const shouldPlaceTooltipBelow = spotlightY < windowHeight * 0.5;
  const tooltipPositionStyle = shouldPlaceTooltipBelow
    ? { top: spotlightY + spotlightHeight + 18 }
    : { bottom: Math.max(24, windowHeight - spotlightY + 18) };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleCloseTour}>
      <View className="flex-1">
        <View
          className="absolute left-0 right-0 bg-black/65"
          style={{ top: 0, height: spotlightY }}
        />
        <View
          className="absolute left-0 bg-black/65"
          style={{ top: spotlightY, width: spotlightX, height: spotlightHeight }}
        />
        <View
          className="absolute right-0 bg-black/65"
          style={{
            top: spotlightY,
            left: spotlightX + spotlightWidth,
            height: spotlightHeight,
          }}
        />
        <View
          className="absolute left-0 right-0 bg-black/65"
          style={{
            top: spotlightY + spotlightHeight,
            bottom: 0,
          }}
        />

        <Pressable
          onPress={handlePrimaryAction}
          className="absolute rounded-[26px] border-[3px]"
          style={{
            left: spotlightX,
            top: spotlightY,
            width: spotlightWidth,
            height: spotlightHeight,
            borderColor: currentStep.accentColor,
            shadowColor: currentStep.accentColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.45,
            shadowRadius: 18,
            elevation: 8,
          }}
        />

        <View
          className="absolute rounded-[28px] bg-white px-5 py-5"
          style={[
            {
              left: tooltipLeft,
              width: tooltipWidth,
              shadowColor: "#0D1511",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.22,
              shadowRadius: 28,
              elevation: 10,
            },
            tooltipPositionStyle,
          ]}
        >
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-[#7F8E86]">
                Tour guiado {stepIndex + 1}/{steps.length}
              </Text>
              <Text className="mt-3 text-[24px] font-semibold leading-8 text-[#202124]">{currentStep.title}</Text>
              <Text className="mt-3 text-[14px] leading-6 text-[#66736C]">{currentStep.description}</Text>
            </View>

            <Pressable
              onPress={handleCloseTour}
              className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F5F2]"
              style={({ pressed }) => (pressed ? { opacity: 0.82 } : undefined)}
            >
              <Ionicons name="close" size={20} color="#607068" />
            </Pressable>
          </View>

          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={handleCloseTour}
              className="flex-1 items-center justify-center rounded-[18px] border border-[#DCE4DD] bg-[#FAFCFA] px-4 py-4"
              style={({ pressed }) => (pressed ? { opacity: 0.86 } : undefined)}
            >
              <Text className="text-[14px] font-semibold text-[#65726A]">Pular tour</Text>
            </Pressable>

            <Pressable
              onPress={handlePrimaryAction}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-[18px] px-4 py-4"
              style={({ pressed }) => [
                { backgroundColor: currentStep.accentColor },
                pressed ? { opacity: 0.9 } : undefined,
              ]}
            >
              <MaterialCommunityIcons name="cursor-default-click-outline" size={18} color="#FFFFFF" />
              <Text className="text-[14px] font-semibold text-white">{currentStep.primaryLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
