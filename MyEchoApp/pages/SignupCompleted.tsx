import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../components/common/Button";
import { SignupCompletedScreenProps } from "../navigation/types";

function SuccessBadge() {
  return (
    <View className="items-center justify-center">
      <View className="h-40 w-40 items-center justify-center rounded-full border border-[#D8E4DB] bg-[#EEF5F0]">
        <View className="h-28 w-28 items-center justify-center rounded-full bg-white shadow-sm">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-[#1F6F2C]">
            <Ionicons name="checkmark" size={34} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </View>
  );
}

type CompletionCardProps = {
  onContinue: () => void;
};

function CompletionCard({ onContinue }: CompletionCardProps) {
  return (
    <View className="w-full rounded-[28px] border border-[#DDE5DF] bg-white px-6 py-7 shadow-sm">
      <View className="gap-4">
        <Text className="text-center text-[28px] font-extrabold leading-9 text-[#1F2529]">
          Cadastro concluído
        </Text>
        <Text className="text-center text-[17px] leading-8 text-[#5D646C]">
          Bem-vindo à ECHO. Sua conta foi criada com sucesso e você já pode começar a transformar realidades.
        </Text>
        <Button
          label="Ir para a página inicial"
          onPress={onContinue}
          className="mt-2 min-h-[58px] rounded-2xl"
          textClassName="text-[17px]"
          rightIcon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
        />
      </View>
    </View>
  );
}

export default function SignupCompletedPage({ navigation }: SignupCompletedScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-[#F3F7F3]">
      <View className="flex-1 px-5 py-8">
        <View className="absolute left-[-40] top-[220] h-72 w-72 rounded-full border border-[#DCE6DE]" />
        <View className="absolute bottom-[-110] right-[-70] h-80 w-80 rounded-full border border-[#DCE6DE]" />

        <View className="flex-1 items-center justify-center gap-10">
          <SuccessBadge />
          <CompletionCard onContinue={() => navigation.popToTop()} />
        </View>
      </View>
    </SafeAreaView>
  );
}
