import { Pressable, Text, View } from "react-native";

import { AppLayout } from "../components/layout/AppLayout";
import { RoleCard } from "../components/signup/roleCard";
import { RoleEnum } from "../components/signup/roleEnum";
import { Strong } from "../components/common/Strong";
import { SignupScreenProps } from "../navigation/types";

export default function SignupPage({ navigation }: SignupScreenProps){
    return (
        <AppLayout headerVariant="logo-left">
            <View className="flex flex-col gap-6">
                <View className="flex flex-col gap-6">
                    <Text className="font-semibold text-[14px] leading-[15px] tracking-[2px] uppercase text-echoDarkGreen">
                        BEM-VINDO A ECHO
                    </Text>
                    <Text className="text-5xl font-extrabold text-black">
                        Como você gostaria de começar?
                    </Text>
                    <Text className="leading-6 text-slate-600 text-xl">
                        Escolha seu papel na comunidade para iniciar sua jornada.
                    </Text>
                </View>
                <RoleCard
                    role = {RoleEnum.DONOR}
                    onPress={() => navigation.navigate("RoleDetails", { role: RoleEnum.DONOR })}
                />
                <RoleCard
                    role = {RoleEnum.NGO}
                    onPress={() => navigation.navigate("RoleDetails", { role: RoleEnum.NGO })}
                />
                <View className="flex-row flex-wrap items-center justify-center gap-1">
                    <Text className="text-[17px] text-slate-600">Eu ja tenho uma conta.</Text>
                    <Pressable onPress={() => navigation.navigate("Signin")}>
                        <Strong className="text-echoDarkGreen text-[17px] text-extrabold underline">Entrar</Strong>
                    </Pressable>
                </View>
            </View>
        </AppLayout>     
    );
}
