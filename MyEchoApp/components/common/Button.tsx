import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const BUTTON_GRADIENT_COLORS = ["#206223", "#3A7B3A"] as const;

type ButtonVariant = "gradient" | "light" | "dark";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  textClassName?: string;
};

export function Button({
  label,
  onPress,
  disabled = false,
  variant = "gradient",
  leftIcon,
  rightIcon,
  className = "",
  textClassName = "",
}: ButtonProps) {
  const isGradient = variant === "gradient";
  const isDark = variant === "dark";
  const textColorClass = isGradient || isDark ? "text-white" : "text-[#22272B]";
  const outerClassName = `overflow-hidden rounded-[20px] ${
    isGradient
      ? "border border-buttonGradientStart"
      : isDark
        ? "border border-buttonDark bg-buttonDark"
        : "border border-[#E7E9E8] bg-buttonSurface"
  } ${className}`;
  const innerClassName = `min-h-[72px] flex-row items-center justify-center px-5 py-4 ${
    disabled ? "opacity-60" : ""
  }`;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={disabled ? "opacity-90" : ""}
      style={({ pressed }) => (!disabled && pressed ? { transform: [{ scale: 0.985 }] } : undefined)}
    >
      {isGradient ? (
        <View className={outerClassName}>
          <LinearGradient
            colors={BUTTON_GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20 }}
          >
            <View className={innerClassName}>
              {leftIcon ? <View className="mr-4">{leftIcon}</View> : null}
              <Text className={`text-[18px] font-bold ${textColorClass} ${textClassName}`}>{label}</Text>
              {rightIcon ? <View className="ml-4">{rightIcon}</View> : null}
            </View>
          </LinearGradient>
        </View>
      ) : (
        <View className={outerClassName}>
          <View className={innerClassName}>
            {leftIcon ? <View className="mr-4">{leftIcon}</View> : null}
            <Text className={`text-[18px] font-bold ${textColorClass} ${textClassName}`}>{label}</Text>
            {rightIcon ? <View className="ml-4">{rightIcon}</View> : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}
