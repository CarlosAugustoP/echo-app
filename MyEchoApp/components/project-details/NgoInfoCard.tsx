import { Image, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

type NgoInfoCardProps = {
  name: string;
  description: string;
  imageUrl?: string | null;
};

function NgoAvatar({ imageUrl }: { imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <View className="h-[48px] w-[48px] rounded-full border border-[#B9E98D] p-[3px]">
        <Image source={{ uri: imageUrl }} className="h-full w-full rounded-full" resizeMode="cover" />
      </View>
    );
  }

  return (
    <View className="h-[48px] w-[48px] items-center justify-center rounded-full border border-[#B9E98D]">
      <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-[#2C2431]">
        <Text className="text-[9px] font-semibold tracking-[0.5px] text-white">ONG</Text>
        <View className="mt-[2px] h-px w-[14px] bg-white/35" />
      </View>
    </View>
  );
}

function NgoCardDecoration() {
  return (
    <View pointerEvents="none" className="absolute inset-0">
      <Svg width="100%" height="100%" viewBox="0 0 320 304" fill="none">
        <Circle cx="450" cy="10" r="50" stroke="#2B7A66" strokeOpacity="1.5" />
        <Circle cx="450" cy="10" r="150" stroke="#2B7A66" strokeOpacity="1.5" />
        <Circle cx="450" cy="10" r="250" stroke="#2B7A66" strokeOpacity="1.5" />
      </Svg>
    </View>
  );
}

export function NgoInfoCard({ name, description, imageUrl }: NgoInfoCardProps) {
  return (
    <View className="overflow-hidden rounded-[18px] bg-[#064E3B] px-[28px] py-[24px]">
      <NgoCardDecoration />

      <Text className="text-[20px] font-semibold leading-6 text-white">{"Conheça a ONG"}</Text>

      <View className="mt-[18px] flex-row items-center">
        <NgoAvatar imageUrl={imageUrl} />

        <View className="ml-[14px]">
          <Text className="text-[18px] font-semibold leading-6 text-white">{name}</Text>
          <Text className="mt-[2px] text-[11px] font-medium uppercase tracking-[1.6px] text-[#B9E98D]">
            Verificada pela Echo
          </Text>
        </View>
      </View>

      <Text className="mt-[20px] text-[16px] leading-[20px] text-[#E2EEE7]">{description}</Text>
    </View>
  );
}
