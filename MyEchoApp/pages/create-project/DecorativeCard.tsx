import type { ReactNode } from "react";
import { View } from "react-native";

export function DecorativeCard({ children }: { children: ReactNode }) {
  return (
    <View
      className="overflow-hidden rounded-[24px] border border-[#EEF1EC] bg-white px-5 py-5"
      style={{
        shadowColor: "#DCE4DC",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 2,
      }}
    >
      <View className="absolute right-[-24px] top-[-18px] h-[92px] w-[92px] rounded-full bg-[#F3F5F3]" />
      {children}
    </View>
  );
}
