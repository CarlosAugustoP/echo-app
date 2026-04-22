import { ActivityIndicator, Text, View } from "react-native";

type LoadingSpinnerProps = {
  color?: string;
  size?: "small" | "large";
  className?: string;
  label?: string;
  labelClassName?: string;
};

export function LoadingSpinner({
  color = "#2F7D32",
  size = "large",
  className,
  label,
  labelClassName = "mt-3 text-[14px] text-[#6F7A75]",
}: LoadingSpinnerProps) {
  return (
    <View className={className}>
      <ActivityIndicator size={size} color={color} />
      {label ? <Text className={labelClassName}>{label}</Text> : null}
    </View>
  );
}
