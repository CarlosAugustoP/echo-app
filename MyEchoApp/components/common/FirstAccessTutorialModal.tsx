import { useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import type { UserRoleCode } from "../../types/api";
import { isAdminUserRole, isDonorUserRole, isNgoUserRole } from "../../utils/userRoles";

type TutorialStep = {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"] | React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconLibrary?: "ionicons" | "material";
  accent: string;
};

type FirstAccessTutorialModalProps = {
  visible: boolean;
  role: UserRoleCode | undefined | null;
  onClose: () => void;
};

function buildTutorialSteps(role: UserRoleCode | undefined | null): TutorialStep[] {
  if (isAdminUserRole(role)) {
    return [
      {
        title: "Painel de curadoria",
        description: "Aqui voce acompanha pendencias operacionais e decide quem entra com confianca no ecossistema Echo.",
        icon: "shield-checkmark-outline",
        accent: "#2F7D32",
      },
      {
        title: "Pesquisa administrativa",
        description: "Use a busca para revisar ONGs, abrir o perfil institucional e validar usuarios quando necessario.",
        icon: "search-outline",
        accent: "#3F67C9",
      },
      {
        title: "Perfil e contexto",
        description: "Seu perfil concentra os dados da conta e ajuda a manter a operacao administrativa transparente.",
        icon: "person-outline",
        accent: "#B7791F",
      },
    ];
  }

  if (isNgoUserRole(role)) {
    return [
      {
        title: "Inicio institucional",
        description: "A home da ONG mostra o panorama da sua operacao e te ajuda a priorizar o que precisa ser publicado ou acompanhado.",
        icon: "home-outline",
        accent: "#2F7D32",
      },
      {
        title: "Pesquisa e rede",
        description: "Na busca voce encontra outras organizacoes, projetos publicos e perfis institucionais dentro da rede Echo.",
        icon: "search-outline",
        accent: "#3F67C9",
      },
      {
        title: "Projetos",
        description: "Aqui voce gerencia os projetos da sua ONG, publica metas, imagens e atualizacoes para os doadores.",
        icon: "notebook-outline",
        iconLibrary: "material",
        accent: "#2C8F7B",
      },
      {
        title: "Fornecedores e perfil",
        description: "Cadastre fornecedores, acompanhe aprovacoes e mantenha seu perfil institucional completo e confiavel.",
        icon: "handshake-outline",
        iconLibrary: "material",
        accent: "#B7791F",
      },
    ];
  }

  if (isDonorUserRole(role)) {
    return [
      {
        title: "Inicio e impacto",
        description: "Na home voce encontra projetos em destaque, recomendacoes e o resumo do impacto que voce ja gerou.",
        icon: "home-outline",
        accent: "#2F7D32",
      },
      {
        title: "Busca e descoberta",
        description: "Explore ONGs, projetos e perfis institucionais para decidir com mais seguranca onde apoiar.",
        icon: "search-outline",
        accent: "#3F67C9",
      },
      {
        title: "Historico e dashboard",
        description: "Acompanhe doacoes, eventos e distribuicao do seu impacto com rastreabilidade publica.",
        icon: "bar-chart-outline",
        accent: "#2C8F7B",
      },
      {
        title: "Perfil",
        description: "Seu perfil guarda identidade, carteira e dados da conta para manter a experiencia personalizada.",
        icon: "person-outline",
        accent: "#B7791F",
      },
    ];
  }

  return [
    {
      title: "Bem-vindo a Echo",
      description: "Explore as areas principais do app para descobrir projetos, acompanhar impacto e manter seu perfil em dia.",
      icon: "compass-outline",
      accent: "#2F7D32",
    },
  ];
}

export function FirstAccessTutorialModal({ visible, role, onClose }: FirstAccessTutorialModalProps) {
  const steps = useMemo(() => buildTutorialSteps(role), [role]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const IconComponent = currentStep.iconLibrary === "material" ? MaterialCommunityIcons : Ionicons;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-[#0B1510]/55 px-5">
        <View className="w-full max-w-md rounded-[30px] bg-white px-5 py-5">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.7px] text-[#7F8E86]">Primeiro acesso</Text>
              <Text className="mt-2 text-[28px] font-semibold leading-8 text-[#202124]">Tour rapido pela Echo</Text>
              <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">
                Um resumo simples do que cada parte do app faz para voce comecar com contexto.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-[#F1F4F1]"
              style={({ pressed }) => (pressed ? { opacity: 0.82 } : undefined)}
            >
              <Ionicons name="close" size={20} color="#607068" />
            </Pressable>
          </View>

          <View
            className="mt-5 overflow-hidden rounded-[26px] px-5 py-5"
            style={{ backgroundColor: `${currentStep.accent}12` }}
          >
            <View
              className="h-14 w-14 items-center justify-center rounded-[18px]"
              style={{ backgroundColor: currentStep.accent }}
            >
              <IconComponent name={currentStep.icon as never} size={26} color="#FFFFFF" />
            </View>

            <Text className="mt-5 text-[24px] font-semibold leading-8 text-[#202124]">{currentStep.title}</Text>
            <Text className="mt-3 text-[15px] leading-6 text-[#56635C]">{currentStep.description}</Text>
          </View>

          <View className="mt-5 flex-row items-center justify-center gap-2">
            {steps.map((step, index) => (
              <View
                key={`${step.title}-${index}`}
                className={`h-2.5 rounded-full ${index === currentStepIndex ? "w-8" : "w-2.5"}`}
                style={{ backgroundColor: index === currentStepIndex ? currentStep.accent : "#D7DED8" }}
              />
            ))}
          </View>

          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center justify-center rounded-[18px] border border-[#DCE5DD] bg-[#FAFCFA] px-4 py-4"
              style={({ pressed }) => (pressed ? { opacity: 0.86 } : undefined)}
            >
              <Text className="text-[14px] font-semibold text-[#637067]">Pular</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (isLastStep) {
                  onClose();
                  return;
                }

                setCurrentStepIndex((currentValue) => currentValue + 1);
              }}
              className="flex-1 items-center justify-center rounded-[18px] px-4 py-4"
              style={({ pressed }) => [
                { backgroundColor: currentStep.accent },
                pressed ? { opacity: 0.9 } : undefined,
              ]}
            >
              <Text className="text-[14px] font-semibold text-white">{isLastStep ? "Comecar" : "Proximo"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
