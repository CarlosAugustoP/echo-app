import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useState } from "react";

import Form from "../components/form/Form";
import FormInput from "../components/form/FormInput";
import { Logo } from "../components/logo/logo";
import { SigninScreenProps } from "../navigation/types";
import { ApiServiceError } from "../services/ApiService";
import { apiClient } from "../services/apiClient";
import { setAccessToken } from "../services/authStorage";
import { setCurrentUser } from "../stores/userStore";

const gandhiPortrait = require("../assets/gandhi.png");

export default function SigninPage({ navigation }: SigninScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isFormComplete = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    if (!isFormComplete || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const token = await apiClient.login({
        email: email.trim(),
        password,
      });

      await setAccessToken(token);
      const currentUser = await apiClient.me();
      setCurrentUser(currentUser);
      navigation.replace("AppHome");
    } catch (error) {
      if (error instanceof ApiServiceError) {
        setSubmitError(error.message);
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("We couldn't sign you in right now. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F4F8F4]">
      <View className="absolute left-[-90] top-[290] h-80 w-80 rounded-full border border-[#DCE7DE]" />
      <View className="absolute bottom-[-120] right-[-80] h-96 w-96 rounded-full border border-[#DCE7DE]" />

      <Image
        source={gandhiPortrait}
        className="absolute right-0 top-8 h-[300px] w-[230px]"
        resizeMode="contain"
        style={{ opacity: 0.12 }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-5 pb-10 pt-14"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center">
          <View className="items-center">
            <View className="rounded-[22px] bg-white p-4 shadow-sm">
              <Logo />
            </View>

            <Text className="mt-8 text-center text-[21px] font-extrabold leading-9 text-[#3D4540]">
              "Be the change you wish to see in the world."
            </Text>
            <Text className="mt-2 text-center text-[16px] text-[#515853]">
              Mahatma Gandhi
            </Text>
          </View>

          <View className="mt-10 gap-6">
            <Form
              formTitle="Welcome back"
              formDescription="Enter your email and password to access your account."
              submitLabel={isSubmitting ? "Signing in..." : "Sign in"}
              onSubmit={handleLogin}
              submitDisabled={!isFormComplete || isSubmitting}
            >
              <FormInput
                title="Email"
                placeholder="Ex: anna@email.com"
                iconName="at-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
              />
              <FormInput
                title="Password"
                placeholder="Enter your password"
                iconName="lock-closed-outline"
                secureTextEntry
                autoCapitalize="none"
                textContentType="password"
                value={password}
                onChangeText={setPassword}
              />
            </Form>

            {submitError ? (
              <View className="rounded-2xl border border-[#F2C9C9] bg-[#FFF4F4] px-4 py-3">
                <Text className="text-sm leading-5 text-[#A33A3A]">{submitError}</Text>
              </View>
            ) : null}
          </View>

          <View className="mt-6 flex-row flex-wrap items-center justify-center gap-1">
            <Text className="text-[17px] text-[#4E5550]">Don't have an account?</Text>
            <Pressable onPress={() => navigation.navigate("Signup")}>
              <Text className="text-[17px] font-bold text-[#2F8B3A]">Create one</Text>
            </Pressable>
          </View>

          <Text className="mt-10 text-center text-[13px] uppercase tracking-[2px] text-[#8A918C]">
            (C) 2026 ECHO - TECHNOLOGY FOR THE COMMON GOOD
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
