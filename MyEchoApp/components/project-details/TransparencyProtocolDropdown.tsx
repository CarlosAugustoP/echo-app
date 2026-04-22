import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type TransparencyProtocolDropdownProps = {
  contractAddress?: string | null;
};

const transparencyProtocolDescription =
  "Ao contr\u00E1rio das doa\u00E7\u00F5es convencionais, o ECHO utiliza a infraestrutura de \"Living Ledger\". Os fundos n\u00E3o s\u00E3o liberados de imediato; eles ficam protegidos por contratos inteligentes e s\u00E3o transferidos automaticamente e diretamente para um fornecedor de confian\u00E7a, assegurando que a compra de um item resultar\u00E1 exclusivamente naquele mesmo item.";
function buildSepoliaAddressUrl(contractAddress: string) {
  return `https://sepolia.etherscan.io/address/${encodeURIComponent(contractAddress)}`;
}

export function TransparencyProtocolDropdown({ contractAddress }: TransparencyProtocolDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const normalizedAddress = contractAddress?.trim() || "";
  const hasAddress = normalizedAddress.length > 0;
  const sepoliaUrl = hasAddress ? buildSepoliaAddressUrl(normalizedAddress) : null;

  const handleOpenExplorer = async () => {
    if (!sepoliaUrl) {
      return;
    }

    try {
      await Linking.openURL(sepoliaUrl);
    } catch {
    }
  };

  return (
    <View className="overflow-hidden rounded-[14px] border border-[#EEF1EB] bg-[#F2F2F2]">
      <Pressable
        className="flex-row items-center justify-between px-4 py-[12px]"
        onPress={() => setIsExpanded((currentValue) => !currentValue)}
        style={({ pressed }) => (pressed ? { opacity: 0.72 } : undefined)}
      >
        <View className="flex-1 flex-row items-center gap-[10px] pr-3">
          <View className="h-[4px] w-[4px] rounded-full bg-[#202124]" />
          <Text className="flex-1 text-[18px] font-medium leading-5 text-[#202124]">
            {"Protocolo de Transpar\u00EAncia"}
          </Text>
        </View>

        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
      </Pressable>

      {isExpanded ? (
        <View className="border-t border-[#EEF1EB] px-4 pb-4 pt-3">
          <Text className="text-[14px] leading-[20px] text-[#525B57]">{transparencyProtocolDescription}</Text>

          <View className="mt-4 border-t border-[#E1E6DE] pt-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[1px] text-[#6B7280]">
              Smart Contract do Projeto
            </Text>
            <Text className="mt-2 text-[13px] leading-[21px] text-[#202124]">
              {hasAddress ? normalizedAddress : "Smart contract ainda n\u00E3o dispon\u00EDvel para este projeto."}
            </Text>

            {hasAddress && sepoliaUrl ? (
              <Pressable
                className="mt-4 self-start rounded-[10px] bg-[#2F7D32] px-4 py-3"
                onPress={() => {
                  void handleOpenExplorer();
                }}
                style={({ pressed }) => (pressed ? { opacity: 0.84 } : undefined)}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-[13px] font-semibold text-white">Acompanhar na rede</Text>
                  <Ionicons name="open-outline" size={14} color="#FFFFFF" />
                </View>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
