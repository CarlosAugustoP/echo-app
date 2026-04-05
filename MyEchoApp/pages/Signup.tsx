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
                        WELCOME TO ECHO
                    </Text>
                    <Text className="text-5xl font-extrabold text-black">
                        How would you like to begin?
                    </Text>
                    <Text className="leading-6 text-slate-600 text-xl">
                        Select your role in our community to begin your journey.
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
                    <Text className="text-[17px] text-slate-600">I already have an account.</Text>
                    <Pressable onPress={() => navigation.navigate("Signin")}>
                        <Strong className="text-echoDarkGreen text-[17px] text-extrabold underline">Sign in</Strong>
                    </Pressable>
                </View>
            </View>
        </AppLayout>     
    );
}
