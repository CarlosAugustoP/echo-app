import { useSyncExternalStore } from "react";

import type { NotificationItemDto } from "../types/api";

export type NotificationPermissionStatus = "unknown" | "granted" | "denied" | "unsupported";
export type NotificationConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

type NotificationStoreState = {
  connectionStatus: NotificationConnectionStatus;
  items: NotificationItemDto[];
  lastError: string;
  lastRegisteredPushToken: string | null;
  permissionStatus: NotificationPermissionStatus;
  unreadCount: number;
};

const MAX_LOCAL_NOTIFICATIONS = 20;

let state: NotificationStoreState = {
  connectionStatus: "idle",
  items: [],
  lastError: "",
  lastRegisteredPushToken: null,
  permissionStatus: "unknown",
  unreadCount: 0,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(nextState: NotificationStoreState) {
  state = nextState;
  emitChange();
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

export function useNotificationStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getNotificationStoreState() {
  return state;
}

export function clearNotificationState() {
  setState({
    connectionStatus: "idle",
    items: [],
    lastError: "",
    lastRegisteredPushToken: null,
    permissionStatus: "unknown",
    unreadCount: 0,
  });
}

export function setNotificationConnectionStatus(connectionStatus: NotificationConnectionStatus) {
  setState({
    ...state,
    connectionStatus,
  });
}

export function setNotificationPermissionStatus(permissionStatus: NotificationPermissionStatus) {
  setState({
    ...state,
    permissionStatus,
  });
}

export function setNotificationError(lastError: string) {
  setState({
    ...state,
    lastError,
  });
}

export function setLastRegisteredPushToken(lastRegisteredPushToken: string | null) {
  setState({
    ...state,
    lastRegisteredPushToken,
  });
}

export function setUnreadCount(unreadCount: number) {
  setState({
    ...state,
    unreadCount: Math.max(0, Math.round(unreadCount)),
  });
}

export function addNotificationItem(item: NotificationItemDto) {
  const existingItem = state.items.find((currentItem) => currentItem.id === item.id);
  const nextItems = [item, ...state.items.filter((currentItem) => currentItem.id !== item.id)].slice(
    0,
    MAX_LOCAL_NOTIFICATIONS,
  );

  let nextUnreadCount = state.unreadCount;

  if (!existingItem && !item.isRead) {
    nextUnreadCount += 1;
  }

  if (existingItem && existingItem.isRead !== item.isRead) {
    nextUnreadCount += item.isRead ? -1 : 1;
  }

  setState({
    ...state,
    items: nextItems,
    unreadCount: Math.max(0, nextUnreadCount),
  });
}
