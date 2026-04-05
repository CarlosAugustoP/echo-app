import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RoleEnum } from "../components/signup/roleEnum";

export type RootStackParamList = {
  Signup: undefined;
  RoleDetails: { role: RoleEnum };
  Signin: undefined;
};

export type SignupScreenProps = NativeStackScreenProps<RootStackParamList, "Signup">;
export type RoleDetailsScreenProps = NativeStackScreenProps<RootStackParamList, "RoleDetails">;
export type SigninScreenProps = NativeStackScreenProps<RootStackParamList, "Signin">;
