import { Text, TextInput, View } from "react-native";

import type { ProjectFieldProps } from "./types";

export function ProjectField({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  labelClassName = "text-[#2F7D32]",
  ...inputProps
}: ProjectFieldProps) {
  return (
    <View className="gap-3">
      <Text className={`text-[12px] font-extrabold uppercase tracking-[1.4px] ${labelClassName}`}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CAABA"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        className={`rounded-[18px] bg-[#F1F3F5] px-4 text-[17px] leading-6 text-[#1F2933] ${
          multiline ? "min-h-[132px] py-4" : "min-h-[58px] py-4"
        }`}
        {...inputProps}
      />
    </View>
  );
}
