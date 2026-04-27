import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type FormInputProps = Omit<TextInputProps, "placeholder"> & {
  title: string;
  placeholder: string;
  iconName?: IconName;
  infoText?: string;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
};

export default function FormInput({
  title,
  placeholder,
  iconName = "person-outline",
  secureTextEntry = false,
  infoText,
  containerClassName = "",
  inputClassName = "",
  labelClassName = "",
  ...inputProps
}: FormInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const isPasswordField = secureTextEntry;

  return (
    <View className={`w-full gap-2 ${containerClassName}`}>
      <View className="flex-row items-center justify-between gap-3">
        <Text
          className={`flex-1 text-[12px] font-extrabold uppercase tracking-[1.5px] text-[#4D5359] ${labelClassName}`}
        >
          {title}
        </Text>

        {infoText ? (
          <Pressable
            className="flex-row items-center gap-1"
            onPress={() => setIsInfoVisible((current) => !current)}
          >
            <Ionicons name="information-circle-outline" size={16} color="#5C8F6A" />
            <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-[#5C8F6A]">
              Ajuda
            </Text>
          </Pressable>
        ) : null}
      </View>

      {infoText && isInfoVisible ? (
        <View className="rounded-2xl border border-[#D8E7D9] bg-[#F5FBF5] px-4 py-3">
          <Text className="text-[13px] leading-5 text-[#4F5D52]">{infoText}</Text>
        </View>
      ) : null}

      <View className="min-h-[60px] flex-row items-center rounded-2xl bg-[#F1F3F4] px-4">
        {iconName ? (
          <Ionicons name={iconName} size={20} color="#7A837C" style={{ marginRight: 12 }} />
        ) : null}

        <TextInput
          className={`flex-1 py-4 text-[16px] text-[#273038] ${inputClassName}`}
          placeholder={placeholder}
          placeholderTextColor="#8C959E"
          secureTextEntry={isPasswordField && !isPasswordVisible}
          autoCorrect={false}
          {...inputProps}
        />

        {isPasswordField ? (
          <Pressable
            className="ml-3"
            onPress={() => setIsPasswordVisible((current) => !current)}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#7A837C"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
