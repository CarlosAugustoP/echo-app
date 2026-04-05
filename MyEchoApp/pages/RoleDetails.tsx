import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Strong } from "../components/common/Strong";
import Form from "../components/form/Form";
import FormInput from "../components/form/FormInput";
import { AppLayout } from "../components/layout/AppLayout";
import { RoleEnum } from "../components/signup/roleEnum";
import { RoleDetailsScreenProps } from "../navigation/types";

export default function RoleDetailsPage({ navigation, route }: RoleDetailsScreenProps) {
  const isNgo = route.params.role === RoleEnum.NGO;
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
            formTitle="NGO Registration"
            formDescription="Enter your institution's details to begin your verified impact journey."
            noticeTitle="Blockchain Audit"
            noticeDescription="Your data and transactions are protected by distributed cryptography for traceability and immutable records."
            consentLabel={
              <>
                I accept the <Strong className="text-echoDarkGreen">transparency terms</Strong> and agree to the ethical use of data.
              </>
            }
            consentValue={acceptedTerms}
            onConsentChange={setAcceptedTerms}
            submitLabel="Complete registration"
            submitDisabled={!acceptedTerms}
          >
            <FormInput
              title="Organization Name"
              placeholder="Ex: Instituto Esperanca"
              iconName="business-outline"
              autoCapitalize="words"
              textContentType="organizationName"
            />
            <FormInput
              title="CNPJ"
              placeholder="Ex: 12.345.678/0001-90"
              iconName="document-text-outline"
              keyboardType="number-pad"
            />
            <FormInput
              title="Responsible Person"
              placeholder="Ex: Carlos Xavier da Silva"
              iconName="person-outline"
              autoCapitalize="words"
              textContentType="name"
            />
            <FormInput
              title="Corporate Email"
              placeholder="Ex: contato@ong.org.br"
              iconName="at-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
            />
            <FormInput
              title="Ethereum Wallet Address"
              placeholder="Ex: 0xA1b2C3d4E5f6..."
              iconName="wallet-outline"
              autoCapitalize="none"
              autoCorrect={false}
              infoText="This is the Ethereum wallet address where your organization can receive blockchain-based donations. Use a wallet you control and double-check the address before submitting."
            />
            <FormInput
              title="Access Password"
              placeholder="Enter your password"
              iconName="lock-closed-outline"
              secureTextEntry
              autoCapitalize="none"
              textContentType="newPassword"
            />
          </Form>
        ) : (
          <Form
            formTitle="Join our journey."
            formDescription="Create your donor account to discover verified causes and track the impact of every contribution."
            noticeTitle="Secure Donations"
            noticeDescription="Your profile and contribution history stay protected so every donation remains transparent and easy to follow."
            consentLabel={
              <>
                I agree to the <Strong className="text-echoDarkGreen">community terms</Strong> and responsible platform use.
              </>
            }
            consentValue={acceptedTerms}
            onConsentChange={setAcceptedTerms}
            submitLabel="Create donor account"
            submitDisabled={!acceptedTerms}
          >
            <FormInput
              title="Full Name"
              placeholder="Ex: Ana Beatriz Costa"
              iconName="person-outline"
              autoCapitalize="words"
              textContentType="name"
            />
            <FormInput
              title="CPF"
              placeholder="Ex: 123.456.789-00"
              iconName="document-text-outline"
              keyboardType="number-pad"
            />
            <FormInput
              title="E-mail"
              placeholder="Ex: ana@email.com"
              iconName="at-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
            />
            <FormInput
              title="Ethereum Wallet Address"
              placeholder="Ex: 0xA1b2C3d4E5f6..."
              iconName="wallet-outline"
              autoCapitalize="none"
              autoCorrect={false}
              infoText="This is the Ethereum wallet address linked to your donor profile. Use a wallet you control so you can track blockchain-based donations and related activity."
            />
            <FormInput
              title="Access Password"
              placeholder="Create a password"
              iconName="lock-closed-outline"
              secureTextEntry
              autoCapitalize="none"
              textContentType="newPassword"
            />
          </Form>
        )}

        <Pressable
          className="rounded-2xl border border-[#D8E1DA] bg-white px-6 py-4"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-center text-base font-bold text-echoDarkGreen">Back to role selection</Text>
        </Pressable>

        <View className="flex-row flex-wrap items-center justify-center gap-1">
          <Text className="text-base text-slate-600">Already have an account?</Text>
          <Pressable onPress={() => navigation.navigate("Signin")}>
            <Strong className="text-base text-echoDarkGreen underline">Go to sign in</Strong>
          </Pressable>
        </View>
      </ScrollView>
    </AppLayout>
  );
}
