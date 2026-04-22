import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RoleEnum } from "../components/signup/roleEnum";
import type { DonationDto, GoalDto, Uuid } from "../types/api";

export type RootStackParamList = {
  Signup: undefined;
  RoleDetails: { role: RoleEnum };
  SignupCompleted: undefined;
  Signin: undefined;
  AppHome: undefined;
  DonationHistory: undefined;
  DonationTimeline: { donation: DonationDto };
  ProjectDetails: { projectId: Uuid };
  DonationDetails: {
    projectId: Uuid;
    projectTitle: string;
    goal: GoalDto;
    goalIndex: number;
    smartContractAddress?: string | null;
  };
};

export type SignupScreenProps = NativeStackScreenProps<RootStackParamList, "Signup">;
export type RoleDetailsScreenProps = NativeStackScreenProps<RootStackParamList, "RoleDetails">;
export type SignupCompletedScreenProps = NativeStackScreenProps<RootStackParamList, "SignupCompleted">;
export type SigninScreenProps = NativeStackScreenProps<RootStackParamList, "Signin">;
export type AppHomeScreenProps = NativeStackScreenProps<RootStackParamList, "AppHome">;
export type DonationHistoryScreenProps = NativeStackScreenProps<RootStackParamList, "DonationHistory">;
export type DonationTimelineScreenProps = NativeStackScreenProps<RootStackParamList, "DonationTimeline">;
export type ProjectDetailsScreenProps = NativeStackScreenProps<RootStackParamList, "ProjectDetails">;
export type DonationDetailsScreenProps = NativeStackScreenProps<RootStackParamList, "DonationDetails">;
