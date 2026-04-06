import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "echo_access_token";

function canUseWebStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export async function setAccessToken(token: string) {
  if (Platform.OS === "web") {
    if (canUseWebStorage()) {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }

    return;
  }

  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function getAccessToken() {
  if (Platform.OS === "web") {
    if (!canUseWebStorage()) {
      return null;
    }

    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function clearAccessToken() {
  if (Platform.OS === "web") {
    if (canUseWebStorage()) {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    }

    return;
  }

  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
