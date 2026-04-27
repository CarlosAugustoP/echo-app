import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Strong } from "../components/common/Strong";
import Form from "../components/form/Form";
import FormInput from "../components/form/FormInput";
import { AppLayout } from "../components/layout/AppLayout";
import { RoleEnum } from "../components/signup/roleEnum";
import { RoleDetailsScreenProps } from "../navigation/types";
import { ApiServiceError } from "../services/ApiService";
import { apiClient } from "../services/apiClient";
import type { AddressRequestDto, DonorSignupRequestDto, NgoSignupRequestDto, SignupRequestDto } from "../types/api";

type SignupStep = "details" | "address";

type AddressFormState = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  number: string;
  countryCode: string;
  neighborhood: string;
};

const emptyAddressForm = (): AddressFormState => ({
  street: "",
  city: "",
  state: "",
  zipCode: "",
  number: "",
  countryCode: "",
  neighborhood: "",
});

function buildAddressPayload(address: AddressFormState): AddressRequestDto {
  return {
    street: address.street.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    zipCode: address.zipCode.trim(),
    number: address.number.trim().length > 0 ? Number(address.number) : null,
    countryCode: address.countryCode.trim().toUpperCase(),
    neighborhood: address.neighborhood.trim(),
  };
}

export default function RoleDetailsPage({ navigation, route }: RoleDetailsScreenProps) {
  const isNgo = route.params.role === RoleEnum.NGO;
  
  const [step, setStep] = useState<SignupStep>("details");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [ngoForm, setNgoForm] = useState<Omit<NgoSignupRequestDto, "role" | "address">>({
    name: "",
    taxId: "",
    email: "",
    walletAddress: "",
    password: "",
  });
  const [ngoAddress, setNgoAddress] = useState<AddressFormState>(emptyAddressForm);
  
  const [donorForm, setDonorForm] = useState<Omit<DonorSignupRequestDto, "role" | "address">>({
    name: "",
    taxId: "",
    email: "",
    walletAddress: "",
    password: "",
  });
  const [donorAddress, setDonorAddress] = useState<AddressFormState>(emptyAddressForm);

  const signupPayload = useMemo<SignupRequestDto>(
    () =>
      isNgo
        ? {
            ...ngoForm,
            address: buildAddressPayload(ngoAddress),
            role: RoleEnum.NGO,
          }
        : {
            ...donorForm,
            address: buildAddressPayload(donorAddress),
            role: RoleEnum.DONOR,
          },
    [donorAddress, donorForm, isNgo, ngoAddress, ngoForm],
  );

  const isFormComplete = isNgo
    ? [...Object.values(ngoForm), ...Object.values(ngoAddress)].every((value) => value.trim().length > 0)
    : [...Object.values(donorForm), ...Object.values(donorAddress)].every((value) => value.trim().length > 0);
  const isDetailsComplete = isNgo
    ? Object.values(ngoForm).every((value) => value.trim().length > 0)
    : Object.values(donorForm).every((value) => value.trim().length > 0);
  const isAddressComplete = isNgo
    ? Object.values(ngoAddress).every((value) => value.trim().length > 0)
    : Object.values(donorAddress).every((value) => value.trim().length > 0);

  const goToAddressStep = () => {
    if (!isDetailsComplete || isSubmitting) {
      return;
    }

    setSubmitError(null);
    setStep("address");
  };

  const goToDetailsStep = () => {
    if (isSubmitting) {
      return;
    }

    setSubmitError(null);
    setStep("details");
  };

  const handleSignup = async () => {
    if (!acceptedTerms || !isFormComplete || !isAddressComplete || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await apiClient.signup(signupPayload);
      navigation.replace("SignupCompleted");
    } catch (error) {
      if (error instanceof ApiServiceError) {
        setSubmitError(error.message);
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Não foi possível concluir seu cadastro agora. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout headerVariant="logo-middle">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="gap-8 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {isNgo ? (
          <Form
            formTitle={step === "details" ? "Cadastro da ONG" : "Endereço da ONG"}
            formDescription={
              step === "details"
                ? "Preencha os dados da sua instituição para iniciar uma jornada de impacto verificado."
                : "Agora informe onde sua organização está localizada para concluirmos o cadastro."
            }
            noticeTitle="Auditoria em blockchain"
            noticeDescription="Seus dados e transações são protegidos por criptografia distribuída, garantindo rastreabilidade e registros imutáveis."
            consentLabel={
              step === "address" ? (
                <>
                  Eu aceito os <Strong className="text-echoDarkGreen">termos de transparência</Strong> e concordo com o uso ético dos dados.
                </>
              ) : undefined
            }
            consentValue={step === "address" ? acceptedTerms : undefined}
            onConsentChange={step === "address" ? setAcceptedTerms : undefined}
            submitLabel={step === "details" ? "Continuar para endereço" : isSubmitting ? "Concluindo cadastro..." : "Concluir cadastro"}
            onSubmit={step === "details" ? goToAddressStep : handleSignup}
            submitDisabled={
              step === "details"
                ? !isDetailsComplete || isSubmitting
                : !acceptedTerms || !isAddressComplete || isSubmitting
            }
            footer={
              step === "address" ? (
                <Pressable onPress={goToDetailsStep}>
                  <Text className="text-center text-base font-bold text-echoDarkGreen">Voltar para os dados da conta</Text>
                </Pressable>
              ) : (
                <View className="rounded-2xl border border-[#D8E1DA] bg-[#F7FAF8] px-4 py-3">
                  <Text className="text-center text-sm text-slate-600">Etapa 1 de 2: dados da conta</Text>
                </View>
              )
            }
          >
            {step === "details" ? (
              <>
                <FormInput
                  title="Nome da organização"
                  placeholder="Ex: Instituto Esperança"
                  iconName="business-outline"
                  autoCapitalize="words"
                  textContentType="organizationName"
                  value={ngoForm.name}
                  onChangeText={(value) => setNgoForm((current) => ({ ...current, name: value }))}
                />
                <FormInput
                  title="CNPJ"
                  placeholder="Ex: 12.345.678/0001-90"
                  iconName="document-text-outline"
                  keyboardType="number-pad"
                  value={ngoForm.taxId}
                  onChangeText={(value) => setNgoForm((current) => ({ ...current, taxId: value }))}
                />
                <FormInput
                  title="E-mail institucional"
                  placeholder="Ex: contato@ong.org"
                  iconName="at-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  value={ngoForm.email}
                  onChangeText={(value) => setNgoForm((current) => ({ ...current, email: value }))}
                />
                <FormInput
                  title="Endereço da carteira Ethereum"
                  placeholder="Ex: 0xA1b2C3d4E5f6..."
                  iconName="wallet-outline"
                  autoCapitalize="none"
                  autoCorrect={false}
                  infoText="Este é o endereço da carteira Ethereum onde sua organização pode receber doações em blockchain. Use uma carteira sob seu controle e confira o endereço antes de enviar."
                  value={ngoForm.walletAddress}
                  onChangeText={(value) => setNgoForm((current) => ({ ...current, walletAddress: value }))}
                />
                <FormInput
                  title="Senha de acesso"
                  placeholder="Digite sua senha"
                  iconName="lock-closed-outline"
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                  value={ngoForm.password}
                  onChangeText={(value) => setNgoForm((current) => ({ ...current, password: value }))}
                />
              </>
            ) : (
              <>
                <View className="rounded-2xl border border-[#D8E1DA] bg-[#F7FAF8] px-4 py-3">
                  <Text className="text-center text-sm text-slate-600">Etapa 2 de 2: endereço e confirmação</Text>
                </View>
                <FormInput
                  title="Rua"
                  placeholder="Ex: Avenida Liberdade"
                  iconName="map-outline"
                  autoCapitalize="words"
                  value={ngoAddress.street}
                  onChangeText={(value) => setNgoAddress((current) => ({ ...current, street: value }))}
                />
                <FormInput
                  title="Número"
                  placeholder="Ex: 1200"
                  iconName="home-outline"
                  keyboardType="number-pad"
                  value={ngoAddress.number}
                  onChangeText={(value) => setNgoAddress((current) => ({ ...current, number: value }))}
                />
                <FormInput
                  title="Bairro"
                  placeholder="Ex: Centro"
                  iconName="location-outline"
                  autoCapitalize="words"
                  value={ngoAddress.neighborhood}
                  onChangeText={(value) => setNgoAddress((current) => ({ ...current, neighborhood: value }))}
                />
                <FormInput
                  title="City"
                  placeholder="Ex: São Paulo"
                  iconName="business-outline"
                  autoCapitalize="words"
                  value={ngoAddress.city}
                  onChangeText={(value) => setNgoAddress((current) => ({ ...current, city: value }))}
                />
                <FormInput
                  title="Estado"
                  placeholder="Ex: Ceará"
                  iconName="flag-outline"
                  autoCapitalize="words"
                  value={ngoAddress.state}
                  onChangeText={(value) => setNgoAddress((current) => ({ ...current, state: value }))}
                />
                <FormInput
                  title="CEP"
                  placeholder="Ex: 60150-161"
                  iconName="mail-open-outline"
                  keyboardType="number-pad"
                  value={ngoAddress.zipCode}
                  onChangeText={(value) => setNgoAddress((current) => ({ ...current, zipCode: value }))}
                />
                <FormInput
                  title="Código do país"
                  placeholder="Ex: BR"
                  iconName="earth-outline"
                  autoCapitalize="characters"
                  value={ngoAddress.countryCode}
                  onChangeText={(value) => setNgoAddress((current) => ({ ...current, countryCode: value }))}
                />
              </>
            )}
          </Form>
        ) : (
          <Form
            formTitle={step === "details" ? "Faça parte da jornada." : "Seu endereço"}
            formDescription={
              step === "details"
                ? "Crie sua conta de doador para descobrir causas verificadas e acompanhar o impacto de cada contribuição."
                : "Última etapa: adicione seus dados de endereço para concluirmos sua conta."
            }
            noticeTitle="Doações seguras"
            noticeDescription="Seu perfil e histórico de contribuições ficam protegidos para que cada doação seja transparente e fácil de acompanhar."
            consentLabel={
              step === "address" ? (
                <>
                  Eu concordo com os <Strong className="text-echoDarkGreen">termos da comunidade</Strong> e com o uso responsável da plataforma.
                </>
              ) : undefined
            }
            consentValue={step === "address" ? acceptedTerms : undefined}
            onConsentChange={step === "address" ? setAcceptedTerms : undefined}
            submitLabel={step === "details" ? "Continuar para endereço" : isSubmitting ? "Criando conta..." : "Criar conta de doador"}
            onSubmit={step === "details" ? goToAddressStep : handleSignup}
            submitDisabled={
              step === "details"
                ? !isDetailsComplete || isSubmitting
                : !acceptedTerms || !isAddressComplete || isSubmitting
            }
            footer={
              step === "address" ? (
                <Pressable onPress={goToDetailsStep}>
                  <Text className="text-center text-base font-bold text-echoDarkGreen">Voltar para os dados da conta</Text>
                </Pressable>
              ) : (
                <View className="rounded-2xl border border-[#D8E1DA] bg-[#F7FAF8] px-4 py-3">
                  <Text className="text-center text-sm text-slate-600">Etapa 1 de 2: dados da conta</Text>
                </View>
              )
            }
          >
            {step === "details" ? (
              <>
                <FormInput
                  title="Nome completo"
                  placeholder="Ex: Anna Beatriz Costa"
                  iconName="person-outline"
                  autoCapitalize="words"
                  textContentType="name"
                  value={donorForm.name}
                  onChangeText={(value) => setDonorForm((current) => ({ ...current, name: value }))}
                />
                <FormInput
                  title="CPF"
                  placeholder="Ex: 123.456.789-00"
                  iconName="document-text-outline"
                  keyboardType="number-pad"
                  value={donorForm.taxId}
                  onChangeText={(value) => setDonorForm((current) => ({ ...current, taxId: value }))}
                />
                <FormInput
                  title="E-mail"
                  placeholder="Ex: anna@email.com"
                  iconName="at-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  value={donorForm.email}
                  onChangeText={(value) => setDonorForm((current) => ({ ...current, email: value }))}
                />
                <FormInput
                  title="Endereço da carteira Ethereum"
                  placeholder="Ex: 0xA1b2C3d4E5f6..."
                  iconName="wallet-outline"
                  autoCapitalize="none"
                  autoCorrect={false}
                  infoText="Este é o endereço da carteira Ethereum vinculado ao seu perfil de doador. Use uma carteira sob seu controle para acompanhar doações em blockchain e atividades relacionadas."
                  value={donorForm.walletAddress}
                  onChangeText={(value) => setDonorForm((current) => ({ ...current, walletAddress: value }))}
                />
                <FormInput
                  title="Senha de acesso"
                  placeholder="Crie uma senha"
                  iconName="lock-closed-outline"
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                  value={donorForm.password}
                  onChangeText={(value) => setDonorForm((current) => ({ ...current, password: value }))}
                />
              </>
            ) : (
              <>
                <View className="rounded-2xl border border-[#D8E1DA] bg-[#F7FAF8] px-4 py-3">
                  <Text className="text-center text-sm text-slate-600">Etapa 2 de 2: endereço e confirmação</Text>
                </View>
                <FormInput
                  title="Rua"
                  placeholder="Ex: Rua das Flores"
                  iconName="map-outline"
                  autoCapitalize="words"
                  value={donorAddress.street}
                  onChangeText={(value) => setDonorAddress((current) => ({ ...current, street: value }))}
                />
                <FormInput
                  title="Número"
                  placeholder="Ex: 455"
                  iconName="home-outline"
                  keyboardType="number-pad"
                  value={donorAddress.number}
                  onChangeText={(value) => setDonorAddress((current) => ({ ...current, number: value }))}
                />
                <FormInput
                  title="Bairro"
                  placeholder="Ex: Centro"
                  iconName="location-outline"
                  autoCapitalize="words"
                  value={donorAddress.neighborhood}
                  onChangeText={(value) => setDonorAddress((current) => ({ ...current, neighborhood: value }))}
                />
                <FormInput
                  title="City"
                  placeholder="Ex: São Paulo"
                  iconName="business-outline"
                  autoCapitalize="words"
                  value={donorAddress.city}
                  onChangeText={(value) => setDonorAddress((current) => ({ ...current, city: value }))}
                />
                <FormInput
                  title="Estado"
                  placeholder="Ex: Ceará"
                  iconName="flag-outline"
                  autoCapitalize="words"
                  value={donorAddress.state}
                  onChangeText={(value) => setDonorAddress((current) => ({ ...current, state: value }))}
                />
                <FormInput
                  title="CEP"
                  placeholder="Ex: 60165-081"
                  iconName="mail-open-outline"
                  keyboardType="number-pad"
                  value={donorAddress.zipCode}
                  onChangeText={(value) => setDonorAddress((current) => ({ ...current, zipCode: value }))}
                />
                <FormInput
                  title="Código do país"
                  placeholder="Ex: BR"
                  iconName="earth-outline"
                  autoCapitalize="characters"
                  value={donorAddress.countryCode}
                  onChangeText={(value) => setDonorAddress((current) => ({ ...current, countryCode: value }))}
                />
              </>
            )}
          </Form>
        )}

        {submitError ? (
          <View className="rounded-2xl border border-[#F2C9C9] bg-[#FFF4F4] px-4 py-3">
            <Text className="text-sm leading-5 text-[#A33A3A]">{submitError}</Text>
          </View>
        ) : null}

        <Pressable
          className="rounded-2xl border border-[#D8E1DA] bg-white px-6 py-4"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-center text-base font-bold text-echoDarkGreen">Voltar para a seleção de perfil</Text>
        </Pressable>

        <View className="flex-row flex-wrap items-center justify-center gap-1">
          <Text className="text-base text-slate-600">Já tem uma conta?</Text>
          <Pressable onPress={() => navigation.navigate("Signin")}>
            <Strong className="text-base text-echoDarkGreen underline">Ir para o login</Strong>
          </Pressable>
        </View>
      </ScrollView>
    </AppLayout>
  );
}
