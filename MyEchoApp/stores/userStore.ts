import { useSyncExternalStore } from "react";

import type { UserDto } from "../types/api";

type UserStoreState = {
  currentUser: UserDto | null;
};

let state: UserStoreState = {
  currentUser: null,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function setCurrentUser(user: UserDto) {
  state = {
    ...state,
    currentUser: user,
  };
  emitChange();
}

export function clearCurrentUser() {
  state = {
    ...state,
    currentUser: null,
  };
  emitChange();
}

export function getCurrentUser() {
  return state.currentUser;
}

export function useUserStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
