import { useSyncExternalStore } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "echo_access_token";

type AccessTokenSnapshot = {
  hydrated: boolean;
  token: string | null;
};

let snapshot: AccessTokenSnapshot = {
  hydrated: false,
  token: null,
};

let hydrationPromise: Promise<string | null> | null = null;
const listeners = new Set<() => void>();

function canUseWebStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setSnapshot(token: string | null, hydrated: boolean) {
  snapshot = {
    hydrated,
    token,
  };
  emitChange();
}

async function readPersistedAccessToken() {
  if (Platform.OS === "web") {
    if (!canUseWebStorage()) {
      return null;
    }

    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export function subscribeToAccessToken(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getAccessTokenSnapshot() {
  return snapshot;
}

export function useAccessTokenState() {
  return useSyncExternalStore(subscribeToAccessToken, getAccessTokenSnapshot, getAccessTokenSnapshot);
}

export async function hydrateAccessToken() {
  if (snapshot.hydrated) {
    return snapshot.token;
  }

  if (!hydrationPromise) {
    hydrationPromise = readPersistedAccessToken().then((token) => {
      setSnapshot(token, true);
      hydrationPromise = null;
      return token;
    });
  }

  return hydrationPromise;
}

export async function setAccessToken(token: string) {
  if (Platform.OS === "web") {
    if (canUseWebStorage()) {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }

    setSnapshot(token, true);
    return;
  }

  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  setSnapshot(token, true);
}

export async function getAccessToken() {
  if (snapshot.hydrated) {
    return snapshot.token;
  }

  return hydrateAccessToken();
}

export async function clearAccessToken() {
  if (Platform.OS === "web") {
    if (canUseWebStorage()) {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    }

    setSnapshot(null, true);
    return;
  }

  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  setSnapshot(null, true);
}
