import { Text, View } from "react-native";

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
};

export function StatCard({ label, value, helper, icon }: StatCardProps) {
  return (
    <View className="flex-1 rounded-[22px] border border-[#E7ECE7] px-4 py-4">
      <View className="mb-2 flex-row items-center gap-2">
        <View>{icon}</View>
        <Text className="text-[10px] font-semibold uppercase tracking-[1.1px] text-[#7A827D]">{label}</Text>
      </View>
      <View className="flex-row items-end gap-1">
        <Text className="text-[28px] font-semibold text-[#1F4F25]">{value}</Text>
        <Text className="mb-1 text-[13px] font-semibold text-[#6C736E]">{helper}</Text>
      </View>
    </View>
  );
}
