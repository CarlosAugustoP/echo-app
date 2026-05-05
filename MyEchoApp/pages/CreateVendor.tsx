import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "../components/common/Button";
import FormInput from "../components/form/FormInput";
import { AppLayout } from "../components/layout/AppLayout";
import type { CreateVendorScreenProps } from "../navigation/types";
import { ApiServiceError } from "../services/ApiService";
import { apiClient } from "../services/apiClient";
import { useUserStore } from "../stores/userStore";
import type { CreateVendorRequestDto } from "../types/api";

const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

type VendorFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  autoCapitalize?: React.ComponentProps<typeof TextInput>["autoCapitalize"];
  autoCorrect?: boolean;
  maxLength?: number;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
};

function sanitizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCnpj(value: string) {
  const digits = sanitizeDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function VendorField({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoCorrect = false,
  maxLength,
  iconName,
}: VendorFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-[11px] font-bold uppercase tracking-[1.25px] text-[#4C5550]">{label}</Text>
      <View className="min-h-[58px] flex-row items-center rounded-[16px] bg-[#F3F5F6] px-4">
        {iconName ? <Ionicons name={iconName} size={16} color="#90A09A" style={{ marginRight: 10 }} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B1B9B4"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          className="flex-1 py-4 text-[15px] text-[#202124]"
        />
      </View>
    </View>
  );
}

function InfoCard({
  iconName,
  title,
  description,
  accentColor,
  backgroundColor,
  borderColor,
}: {
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  description: string;
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
}) {
  return (
    <View className="overflow-hidden rounded-[18px] px-4 py-4" style={{ backgroundColor }}>
      <View className="absolute bottom-0 left-0 top-0 w-[3px]" style={{ backgroundColor: borderColor }} />
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-[12px]" style={{ backgroundColor: "#FFFFFF" }}>
          <MaterialCommunityIcons name={iconName} size={18} color={accentColor} />
        </View>
        <View className="flex-1">
          <Text className="text-[13px] font-semibold text-[#202124]">{title}</Text>
          <Text className="mt-2 text-[12px] leading-5 text-[#67717A]">{description}</Text>
        </View>
      </View>
    </View>
  );
}

function SectionTitle({ iconName, label }: { iconName: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; label: string }) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons name={iconName} size={15} color="#436F45" />
        <Text className="text-[12px] font-bold uppercase tracking-[1.3px] text-[#3D4A41]">{label}</Text>
      </View>
      <View className="h-px bg-[#E2E7E2]" />
    </View>
  );
}

export default function CreateVendorPage({ navigation }: CreateVendorScreenProps) {
  const { currentUser } = useUserStore();
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [typeItemSupply, setTypeItemSupply] = useState("");
  const [walletAddress, setWalletAddress] = useState(currentUser?.walletAddress?.trim() ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const cnpjDigits = useMemo(() => sanitizeDigits(cnpj), [cnpj]);
  const trimmedWalletAddress = walletAddress.trim();
  const isFormValid = useMemo(() => {
    return (
      companyName.trim().length > 0 &&
      cnpjDigits.length === 14 &&
      typeItemSupply.trim().length > 0 &&
      ETHEREUM_ADDRESS_REGEX.test(trimmedWalletAddress)
    );
  }, [cnpjDigits.length, companyName, trimmedWalletAddress, typeItemSupply]);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (companyName.trim().length === 0) {
      setSubmitError("Informe o nome fantasia da empresa.");
      return;
    }

    if (cnpjDigits.length !== 14) {
      setSubmitError("Informe um CNPJ valido com 14 digitos.");
      return;
    }

    if (typeItemSupply.trim().length === 0) {
      setSubmitError("Informe o tipo de item fornecido.");
      return;
    }

    if (!ETHEREUM_ADDRESS_REGEX.test(trimmedWalletAddress)) {
      setSubmitError("Informe um endereco de carteira EVM valido.");
      return;
    }

    const payload: CreateVendorRequestDto = {
      taxId: cnpjDigits,
      name: companyName.trim(),
      walletAddress: trimmedWalletAddress,
      typeItemSupply: typeItemSupply.trim(),
    };

    try {
      setIsSubmitting(true);
      setSubmitError("");
      await apiClient.createVendor(payload);
      navigation.replace("VendorOnboardingStatus", {
        companyName: payload.name,
        walletAddress: payload.walletAddress,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiServiceError) {
        setSubmitError(error.message);
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Nao foi possivel concluir o cadastro do fornecedor agora.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="fornecedores">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 pb-10" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text className="text-[10px] font-semibold uppercase tracking-[1.5px] text-[#7A92B5]">Adesao a rede</Text>
          <View className="gap-1">
            <Text className="text-[35px] font-semibold leading-10 text-[#202124]">Cadastrar</Text>
            <Text className="text-[40px] font-semibold leading-10 text-[#2F7D32]">Fornecedor</Text>
          </View>
          <Text className="max-w-[318px] text-[13px] leading-5 text-[#6F7A75]">
            Inicie o processo de verificacao e integracao de novos parceiros a nossa rede de transparencia baseada em ledger.
          </Text>
        </View>

        <View className="gap-3">
          <InfoCard
            iconName="shield-check-outline"
            title="Blockchain Compliance"
            description="Todas as transacoes e contratos serao registrados de forma imutavel via endereco de carteira verificado."
            accentColor="#2F7D32"
            backgroundColor="#F5FBF5"
            borderColor="#2F7D32"
          />

          <InfoCard
            iconName="source-branch"
            title="Transparencia Ativa"
            description="Fornecedores cadastrados ganham visibilidade em nosso ecossistema de impacto social."
            accentColor="#315FCB"
            backgroundColor="#F5F7FB"
            borderColor="#315FCB"
          />
        </View>

        <View className="gap-5 rounded-[24px] bg-white px-4 py-5">
          <View className="gap-5">
            <SectionTitle iconName="office-building-outline" label="Dados da empresa" />
            <VendorField
              label="Nome fantasia"
              value={companyName}
              placeholder="Ex: EcoLogistica Brasil"
              onChangeText={setCompanyName}
              autoCapitalize="words"
              iconName="business-outline"
            />
            <VendorField
              label="CNPJ"
              value={cnpj}
              placeholder="00.000.000/0000-00"
              onChangeText={(value) => setCnpj(formatCnpj(value))}
              keyboardType="number-pad"
              maxLength={18}
              iconName="document-text-outline"
            />
          </View>

          <View className="gap-5">
            <SectionTitle iconName="shape-outline" label="Atuacao do fornecedor" />
            <VendorField
              label="Tipo de item fornecido"
              value={typeItemSupply}
              placeholder="Ex: Logistics, Motorcycles, Water Filters"
              onChangeText={setTypeItemSupply}
              autoCapitalize="words"
              iconName="briefcase-outline"
            />
          </View>

          <View className="gap-5">
            <SectionTitle iconName="link-variant" label="Rede blockchain" />
            <View className="gap-2">
              <Text className="text-[11px] font-bold uppercase tracking-[1.25px] text-[#4C5550]">
                Endereco da carteira verificada
              </Text>
              <View className="rounded-[16px] border border-[#DDE5F3] bg-[#F5F8FE] px-4 py-4">
                <FormInput
                  title=""
                  placeholder="0x17C765EEC7abB8b098deF8751B7401B"
                  value={walletAddress}
                  onChangeText={setWalletAddress}
                  iconName="wallet-outline"
                  autoCapitalize="none"
                  autoCorrect={false}
                  containerClassName="gap-0"
                  labelClassName="hidden"
                  inputClassName="text-[13px] text-[#315FCB]"
                />
                <Text className="mt-3 text-[10px] leading-4 text-[#8A97B6]">
                  Da carteira que deseja usar como carteira da rede ECHO.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {submitError ? (
          <View className="rounded-[18px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-3">
            <Text className="text-[13px] leading-5 text-[#A33A3A]">{submitError}</Text>
          </View>
        ) : null}

        <View className="gap-3">
          <Button
            label={isSubmitting ? "Finalizando..." : "Finalizar cadastro"}
            onPress={() => {
              void handleSubmit();
            }}
            disabled={!isFormValid || isSubmitting}
            className="min-h-[58px] rounded-[18px]"
            textClassName="text-[15px] uppercase tracking-[0.5px]"
          />

          <Button
            label="Cancelar"
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
            variant="light"
            className="min-h-[58px] rounded-[18px]"
            textClassName="text-[15px] uppercase tracking-[0.5px]"
          />
        </View>
      </ScrollView>
    </AppLayout>
  );
}
