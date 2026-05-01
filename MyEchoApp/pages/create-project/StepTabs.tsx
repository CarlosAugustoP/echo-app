import { Pressable, Text, View } from "react-native";

import type { StepTabsProps } from "./types";

const disabledStepTextColor = "#B5B8BB";
const enabledStepTextColor = "#2F7D32";
const activeStepLineColor = "#2F7D32";
const inactiveStepLineColor = "#E5E7EA";

export function StepTabs({ activeStep, isGeneralComplete, isVendorsEnabled, isReviewEnabled, onPressStep }: StepTabsProps) {
  const steps = [
    { key: "general" as const, label: "GERAL", enabled: true },
    { key: "goals" as const, label: "METAS", enabled: isGeneralComplete },
    { key: "vendors" as const, label: "FORNECEDORES", enabled: isVendorsEnabled },
    { key: "review" as const, label: "REVIEW", enabled: isReviewEnabled },
  ];

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-2">
        {steps.map((step) => {
          const isActive = step.key === activeStep;
          const isEnabled = step.enabled;

          return (
            <Pressable
              key={step.key}
              disabled={!isEnabled}
              onPress={() => onPressStep(step.key)}
              className="flex-1 items-center"
              style={({ pressed }) => (pressed && isEnabled ? { opacity: 0.72 } : undefined)}
            >
              <Text
                className="text-[11px] font-bold uppercase tracking-[1.5px]"
                style={{ color: isEnabled ? enabledStepTextColor : disabledStepTextColor, opacity: isActive ? 1 : 0.92 }}
              >
                {step.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-2">
        {steps.map((step) => {
          const isGreen =
            step.key === "general" ||
            (step.key === "goals" && isGeneralComplete) ||
            (step.key === "vendors" && isVendorsEnabled) ||
            (step.key === "review" && isReviewEnabled);

          return (
            <View
              key={`${step.key}-indicator`}
              className="h-[4px] flex-1 rounded-full"
              style={{ backgroundColor: isGreen ? activeStepLineColor : inactiveStepLineColor }}
            />
          );
        })}
      </View>
    </View>
  );
}
