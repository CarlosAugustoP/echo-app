import { View, Text } from "react-native"

import { EchoLogo } from '../../assets/logo';

export const Logo = () => {
    return (
        <View className="flex items-center justify-center gap-2 flex-row">
            <EchoLogo width={32} height={32} />
            <Text className="text-3xl font-bold text-echoDarkGreen">ECHO</Text>
        </View>
    )
}
