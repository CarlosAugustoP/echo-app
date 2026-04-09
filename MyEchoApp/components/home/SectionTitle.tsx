import { Text } from "react-native";

type SectionTitleProps = {
  children: React.ReactNode;
};

export function SectionTitle({ children }: SectionTitleProps) {
  return <Text className="text-[17px] font-bold text-[#1B1D1F]">{children}</Text>;
}
