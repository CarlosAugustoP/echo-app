import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RoleEnum } from "../components/signup/roleEnum";
import type { Uuid } from "../types/api";

export type RootStackParamList = {
  Signup: undefined;
  RoleDetails: { role: RoleEnum };
  SignupCompleted: undefined;
  Signin: undefined;
  AppHome: undefined;
  ProjectDetails: { projectId: Uuid };
};

export type SignupScreenProps = NativeStackScreenProps<RootStackParamList, "Signup">;
export type RoleDetailsScreenProps = NativeStackScreenProps<RootStackParamList, "RoleDetails">;
export type SignupCompletedScreenProps = NativeStackScreenProps<RootStackParamList, "SignupCompleted">;
export type SigninScreenProps = NativeStackScreenProps<RootStackParamList, "Signin">;
export type AppHomeScreenProps = NativeStackScreenProps<RootStackParamList, "AppHome">;
export type ProjectDetailsScreenProps = NativeStackScreenProps<RootStackParamList, "ProjectDetails">;
