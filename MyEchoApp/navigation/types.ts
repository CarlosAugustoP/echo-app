import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RoleEnum } from "../components/signup/roleEnum";
import type { DonationDto, GoalDto, Uuid } from "../types/api";

export type RootStackParamList = {
  Signup: undefined;
  RoleDetails: { role: RoleEnum };
  SignupCompleted: undefined;
  Signin: undefined;
  AppHome: undefined;
  ProjectsList: { managerId: Uuid };
  PendingProjectDonations: { projectId: Uuid; projectTitle: string };
  CreateProject: undefined;
  Dashboard: undefined;
  Profile: undefined;
  DonationHistory: undefined;
  DonationTimeline: { donation: DonationDto };
  ProjectDetails: { projectId: Uuid };
  ProjectBlogPost: {
    blogPostId: Uuid;
    projectId?: Uuid;
    projectTitle?: string;
  };
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
export type ProjectsListScreenProps = NativeStackScreenProps<RootStackParamList, "ProjectsList">;
export type PendingProjectDonationsScreenProps = NativeStackScreenProps<RootStackParamList, "PendingProjectDonations">;
export type CreateProjectScreenProps = NativeStackScreenProps<RootStackParamList, "CreateProject">;
export type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, "Dashboard">;
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, "Profile">;
export type DonationHistoryScreenProps = NativeStackScreenProps<RootStackParamList, "DonationHistory">;
export type DonationTimelineScreenProps = NativeStackScreenProps<RootStackParamList, "DonationTimeline">;
export type ProjectDetailsScreenProps = NativeStackScreenProps<RootStackParamList, "ProjectDetails">;
export type ProjectBlogPostScreenProps = NativeStackScreenProps<RootStackParamList, "ProjectBlogPost">;
export type DonationDetailsScreenProps = NativeStackScreenProps<RootStackParamList, "DonationDetails">;
