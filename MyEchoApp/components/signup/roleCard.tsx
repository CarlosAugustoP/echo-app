import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { RoleEnum } from "./roleEnum";

type RoleCardProps = {
    role : RoleEnum;
    onPress?: () => void;
}
export const RoleCard = ({ role, onPress }: RoleCardProps) => {
    const isNgo = role === RoleEnum.NGO;
    const ngoText = "Crie campanhas, arrecade recursos e transforme realidades.";
    const donorText = "Apoie causas verificadas e acompanhe seu impacto em tempo real.";
    const iconBackgroundClass = isNgo ? "bg-[#DDE4FF]" : "bg-[#A7F3A0]";
    const iconColor = isNgo ? "#0F4AA1" : "#166534";
    const title = isNgo ? "Represento uma ONG" : "Sou doador";

    return (
        <Pressable
            className="w-full rounded-[28px] border border-[#EDEDED] bg-white px-6 py-7 shadow-sm active:opacity-90"
            onPress={onPress}
        >
            <View className="flex-row items-center">
                <View className={`mr-5 h-[68px] w-[68px] items-center justify-center rounded-3xl ${iconBackgroundClass}`}>
                    <Ionicons
                        name={isNgo ? "business" : "heart"}
                        size={34}
                        color={iconColor}
                    />
                </View>

                <View className="mr-4 flex-1">
                    <Text className="text-[18px] font-bold leading-7 text-[#262626]">
                       {title}
                    </Text>
                    <Text className="mt-1 text-[14px] leading-7 text-[#4F4F4F]">
                        {isNgo ? ngoText : donorText}
                    </Text>
                </View>

                <Ionicons name="chevron-forward" size={24} color="#C7C7C7" />
            </View>
        </Pressable>
    )
}
