import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type FormProps = {
  formTitle: string;
  formDescription?: string;
  children: ReactNode;
  noticeTitle?: string;
  noticeDescription?: string;
  consentLabel?: ReactNode;
  consentValue?: boolean;
  onConsentChange?: (value: boolean) => void;
  submitLabel?: string;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  footer?: ReactNode;
};

export default function Form({
  formTitle,
  formDescription,
  children,
  noticeTitle,
  noticeDescription,
  consentLabel,
  consentValue = false,
  onConsentChange,
  submitLabel,
  onSubmit,
  submitDisabled = false,
  footer,
}: FormProps) {
  return (
    <View className="w-full rounded-[24px] border border-[#E2E6DE] bg-white px-4 py-6 shadow-sm">
      <View className="gap-8">
        <View className="gap-4 w-[95%] self-center">
          <Text className="mt-4 text-4xl font-extrabold leading-tight text-[#202428]">
            {formTitle}
          </Text>
          {formDescription ? (
            <Text className="text-[16px] leading-6 text-[#5D646C]">
              {formDescription}
            </Text>
          ) : null}
        </View>

        <View className="gap-5">{children}</View>

        {noticeTitle || noticeDescription ? (
          <View className="flex-row rounded-2xl border border-[#D7E3FF] bg-[#F4F7FF] px-4 py-4">
            <View className="mr-3 pt-0.5">
              <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
            </View>
            <View className="flex-1">
              {noticeTitle ? (
                <Text className="text-[12px] font-extrabold uppercase tracking-[1px] text-[#315FC6]">
                  {noticeTitle}
                </Text>
              ) : null}
              {noticeDescription ? (
                <Text className="mt-1 text-[12px] leading-5 text-[#315FC6]">
                  {noticeDescription}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {consentLabel ? (
          <Pressable
            className="flex-row items-start"
            onPress={() => onConsentChange?.(!consentValue)}
          >
            <View
              className={`mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-lg border ${
                consentValue ? "border-echoDarkGreen bg-echoDarkGreen" : "border-[#D4D8DD] bg-white"
              }`}
            >
              {consentValue ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
            </View>
            <Text className="flex-1 text-[15px] leading-6 text-[#50575E]">{consentLabel}</Text>
          </Pressable>
        ) : null}

        {submitLabel ? (
          <Pressable
            className={`rounded-2xl px-6 py-4 ${
              submitDisabled ? "bg-[#9BC4AB]" : "bg-[#2F8B3A]"
            }`}
            disabled={submitDisabled}
            onPress={onSubmit}
          >
            <Text className="text-center text-[17px] font-bold text-white">{submitLabel}</Text>
          </Pressable>
        ) : null}

        {footer ? <View>{footer}</View> : null}
      </View>
    </View>
  );
}
