import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Button } from "../../components/common/Button";

import { DecorativeCard } from "./DecorativeCard";
import { ProjectField } from "./ProjectField";

type GeneralStepProps = {
  projectName: string;
  projectDescription: string;
  onProjectNameChange: (value: string) => void;
  onProjectDescriptionChange: (value: string) => void;
  isGeneralComplete: boolean;
  onContinue: () => void;
};

export function GeneralStep({
  projectName,
  projectDescription,
  onProjectNameChange,
  onProjectDescriptionChange,
  isGeneralComplete,
  onContinue,
}: GeneralStepProps) {
  return (
    <DecorativeCard>
      <View className="gap-6">
        <ProjectField
          label="Nome do projeto"
          placeholder="Ex: Operacao Alimento e Saude 2024"
          value={projectName}
          onChangeText={onProjectNameChange}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <ProjectField
          label="Descricao detalhada"
          placeholder="Descreva o proposito, a localidade e o publico-alvo deste projeto..."
          value={projectDescription}
          onChangeText={onProjectDescriptionChange}
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
                Use um nome claro e uma descricao objetiva. Isso facilita a revisao interna e prepara o projeto para
                as proximas etapas de metas e fornecedores.
              </Text>
            </View>
          </View>
        </View>

        <Button
          label="Continuar para metas"
          onPress={onContinue}
          disabled={!isGeneralComplete}
          rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
          className="rounded-[22px]"
          textClassName="text-[16px]"
        />
      </View>
    </DecorativeCard>
  );
}
