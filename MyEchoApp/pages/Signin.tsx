import { Pressable, Text, View } from "react-native";

import { AppLayout } from "../components/layout/AppLayout";
import { SigninScreenProps } from "../navigation/types";

export default function SigninPage({ navigation }: SigninScreenProps) {
  return (
    <AppLayout headerVariant="logo-middle">
      <View className="flex-1 justify-center gap-6">
        <View className="gap-3">
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-echoDarkGreen">
            Account Access
          </Text>
          <Text className="text-4xl font-extrabold text-black">Sign in</Text>
          <Text className="text-lg leading-7 text-slate-600">
            This placeholder screen confirms navigation is working. We can replace it with the real auth form next.
          </Text>
        </View>

        <Pressable
          className="rounded-2xl bg-echoDarkGreen px-6 py-4"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-center text-base font-bold text-white">Back</Text>
        </Pressable>
      </View>
    </AppLayout>
  );
}
