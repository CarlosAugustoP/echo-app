import { clearCurrentUser, setCurrentUser } from "../stores/userStore";
import type { UserDto } from "../types/api";
import { clearAccessToken, setAccessToken } from "./authStorage";
import { notificationService } from "./notificationService";

export async function signInSession(token: string, user: UserDto) {
  await setAccessToken(token);
  setCurrentUser(user);
}

export async function signOutSession() {
  await notificationService.signOut();
  await clearAccessToken();
  clearCurrentUser();
}
