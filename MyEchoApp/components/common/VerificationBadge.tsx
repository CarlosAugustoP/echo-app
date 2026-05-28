import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type VerificationBadgeProps = {
  isVerified?: boolean | null;
  verifiedAt?: string | null;
  verifiedLabel?: string;
};

function resolveIsVerified(isVerified?: boolean | null, verifiedAt?: string | null) {
  if (typeof isVerified === "boolean") {
    return isVerified;
  }

  return Boolean(verifiedAt);
}

export function VerificationBadge({
  isVerified,
  verifiedAt,
  verifiedLabel = "Verificada pela Echo",
}: VerificationBadgeProps) {
  const verified = resolveIsVerified(isVerified, verifiedAt);

  if (!verified) {
    return null;
  }

  return (
    <View className="self-start flex-row items-center gap-1 rounded-full bg-[#EEF8F0] px-2.5 py-1">
      <Ionicons name="shield-checkmark" size={12} color="#2F7D32" />
      <Text className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[#2F7D32]">{verifiedLabel}</Text>
    </View>
  );
}
