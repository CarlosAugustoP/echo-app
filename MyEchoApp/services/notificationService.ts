import type { HubConnection } from "@microsoft/signalr";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { resolveApiBaseUrl } from "./ApiService";
import { apiClient } from "./apiClient";
import {
  addNotificationItem,
  clearNotificationState,
  getNotificationStoreState,
  setLastRegisteredPushToken,
  setNotificationConnectionStatus,
  setNotificationError,
  setNotificationPermissionStatus,
  setUnreadCount,
} from "../stores/notificationStore";
import type { NotificationItemDto, UnreadCountUpdatedDto } from "../types/api";

type NotificationSession = {
  accessToken: string;
  userId: string;
};

type StopOptions = {
  clearState: boolean;
  unregisterDevice: boolean;
};

type UnknownRecord = Record<string, unknown>;

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function normalizeString(value: unknown) {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return null;
}

function normalizeCount(value: unknown) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? Math.max(0, Math.round(parsedValue)) : null;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function extractNotificationItem(value: unknown): NotificationItemDto | null {
  const candidate = parseMaybeJson(value);

  if (!isRecord(candidate)) {
    return null;
  }

  const id = normalizeString(candidate.id);
  const message = normalizeString(candidate.message) ?? normalizeString(candidate.title);
  const description = normalizeString(candidate.description) ?? normalizeString(candidate.body) ?? "";
  const createdAt = normalizeString(candidate.createdAt) ?? normalizeString(candidate.timestamp);
  const isRead = normalizeBoolean(candidate.isRead);

  if (!id || !message || !createdAt || isRead === null) {
    return null;
  }

  return {
    id,
    message,
    description,
    createdAt,
    isRead,
  };
}

function extractUnreadCount(value: unknown): UnreadCountUpdatedDto | null {
  const candidate = parseMaybeJson(value);

  if (!isRecord(candidate)) {
    return null;
  }

  const count = normalizeCount(candidate.count ?? candidate.unreadCount);

  if (count === null) {
    return null;
  }

  return { count };
}

function collectCandidates(value: unknown) {
  const rootCandidate = parseMaybeJson(value);
  const candidates = [rootCandidate];

  if (isRecord(rootCandidate)) {
    for (const nestedKey of ["data", "notification", "payload", "body"]) {
      if (nestedKey in rootCandidate) {
        candidates.push(parseMaybeJson(rootCandidate[nestedKey]));
      }
    }
  }

  return candidates;
}

class NotificationService {
  private currentAccessToken: string | null = null;
  private currentPushToken: string | null = null;
  private currentSessionKey: string | null = null;
  private expoNotificationsReady = false;
  private hubConnection: HubConnection | null = null;
  private notificationReceivedSubscription: { remove(): void } | null = null;
  private notificationResponseSubscription: { remove(): void } | null = null;
  private tokenRefreshUnsubscribe: (() => void) | null = null;

  async syncSession({ accessToken, userId }: { accessToken: string | null; userId: string | null }) {
    if (!accessToken || !userId) {
      await this.stop({ clearState: false, unregisterDevice: false });
      return;
    }

    const sessionKey = `${userId}:${accessToken}`;

    if (this.currentSessionKey === sessionKey) {
      return;
    }

    await this.start({ accessToken, userId });
  }

  async signOut() {
    await this.stop({ clearState: true, unregisterDevice: true });
  }

  private async start(session: NotificationSession) {
    await this.stop({ clearState: false, unregisterDevice: false });

    this.currentAccessToken = session.accessToken;
    this.currentSessionKey = `${session.userId}:${session.accessToken}`;

    setNotificationError("");
    this.attachExpoNotificationListeners();

    await this.loadInitialUnreadCount();
    await this.registerPushDeviceIfPossible();
    await this.startRealtimeConnection(session.accessToken);
  }

  private async stop({ clearState, unregisterDevice }: StopOptions) {
    this.detachExpoNotificationListeners();
    this.detachTokenRefreshListener();

    const pushTokenToUnregister = unregisterDevice ? this.currentPushToken : null;
    const connectionToStop = this.hubConnection;

    this.hubConnection = null;
    this.currentSessionKey = null;

    if (connectionToStop) {
      try {
        await connectionToStop.stop();
      } catch {
        // Best effort shutdown. We still clear the session state below.
      }
    }

    if (pushTokenToUnregister && this.currentAccessToken) {
      try {
        await apiClient.unregisterPushDevice({ token: pushTokenToUnregister });
      } catch {
        // Logout should remain resilient even if the backend is temporarily unreachable.
      }
    }

    this.currentAccessToken = null;
    this.currentPushToken = null;
    setLastRegisteredPushToken(null);
    setNotificationConnectionStatus("idle");
    setNotificationError("");

    if (clearState) {
      clearNotificationState();
      await this.syncBadgeCount(0);
    }
  }

  private attachExpoNotificationListeners() {
    if (Platform.OS === "web" || this.notificationReceivedSubscription || this.notificationResponseSubscription) {
      return;
    }

    this.notificationReceivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      this.applyBestEffortPayload(notification.request.content.data);
    });

    this.notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      this.applyBestEffortPayload(response.notification.request.content.data);
    });
  }

  private detachExpoNotificationListeners() {
    this.notificationReceivedSubscription?.remove();
    this.notificationResponseSubscription?.remove();
    this.notificationReceivedSubscription = null;
    this.notificationResponseSubscription = null;
  }

  private detachTokenRefreshListener() {
    this.tokenRefreshUnsubscribe?.();
    this.tokenRefreshUnsubscribe = null;
  }

  private applyBestEffortPayload(value: unknown) {
    for (const candidate of collectCandidates(value)) {
      const notificationItem = extractNotificationItem(candidate);

      if (notificationItem) {
        this.applyNotificationItem(notificationItem);
      }

      const unreadCountPayload = extractUnreadCount(candidate);

      if (unreadCountPayload) {
        this.applyUnreadCountUpdate(unreadCountPayload);
      }
    }
  }

  private applyNotificationItem(notificationItem: NotificationItemDto) {
    addNotificationItem(notificationItem);
    void this.syncBadgeCount(getNotificationStoreState().unreadCount);
  }

  private applyUnreadCountUpdate(unreadCountPayload: UnreadCountUpdatedDto) {
    setUnreadCount(unreadCountPayload.count);
    void this.syncBadgeCount(unreadCountPayload.count);
  }

  private async loadInitialUnreadCount() {
    if (!this.currentAccessToken) {
      return;
    }

    try {
      const unreadCountResponse = await apiClient.getUnreadNotificationsCount();
      this.applyUnreadCountUpdate(unreadCountResponse);
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : "Nao foi possivel carregar o contador inicial de notificacoes.",
      );
    }
  }

  private async syncBadgeCount(unreadCount: number) {
    if (Platform.OS === "web") {
      return;
    }

    try {
      await Notifications.setBadgeCountAsync(Math.max(0, unreadCount));
    } catch {
      // Badge support varies by platform and launcher. Ignore unsupported cases.
    }
  }

  private async ensureExpoNotificationsReady() {
    if (Platform.OS === "web" || this.expoNotificationsReady) {
      return;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Atualizacoes Echo",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2F7D32",
      });
    }

    this.expoNotificationsReady = true;
  }

  private async requestPushPermission() {
    if (Platform.OS === "web") {
      setNotificationPermissionStatus("unsupported");
      return false;
    }

    await this.ensureExpoNotificationsReady();

    const currentPermission = await Notifications.getPermissionsAsync();
    let finalStatus = currentPermission.status;

    if (finalStatus !== "granted") {
      const requestedPermission = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      finalStatus = requestedPermission.status;
    }

    if (finalStatus !== "granted") {
      setNotificationPermissionStatus("denied");
      return false;
    }

    if (Platform.OS === "ios") {
      const messagingModule = await import("@react-native-firebase/messaging");
      const messaging = messagingModule.getMessaging();

      if (!messagingModule.isDeviceRegisteredForRemoteMessages(messaging)) {
        await messagingModule.registerDeviceForRemoteMessages(messaging);
      }

      const authorizationStatus = await messagingModule.requestPermission(messaging);
      const isAuthorized =
        authorizationStatus === messagingModule.AuthorizationStatus.AUTHORIZED ||
        authorizationStatus === messagingModule.AuthorizationStatus.PROVISIONAL ||
        authorizationStatus === messagingModule.AuthorizationStatus.EPHEMERAL;

      setNotificationPermissionStatus(isAuthorized ? "granted" : "denied");
      return isAuthorized;
    }

    setNotificationPermissionStatus("granted");
    return true;
  }

  private async getNativePushToken() {
    if (Platform.OS === "web") {
      return null;
    }

    const messagingModule = await import("@react-native-firebase/messaging");
    const messaging = messagingModule.getMessaging();

    if (Platform.OS === "ios" && !messagingModule.isDeviceRegisteredForRemoteMessages(messaging)) {
      await messagingModule.registerDeviceForRemoteMessages(messaging);
    }

    return messagingModule.getToken(messaging);
  }

  private async attachTokenRefreshListener() {
    if (Platform.OS === "web" || this.tokenRefreshUnsubscribe) {
      return;
    }

    const messagingModule = await import("@react-native-firebase/messaging");
    const messaging = messagingModule.getMessaging();

    this.tokenRefreshUnsubscribe = messagingModule.onTokenRefresh(messaging, (token) => {
      void this.handleTokenRefresh(token);
    });
  }

  private async handleTokenRefresh(token: string) {
    if (!this.currentAccessToken || !token) {
      return;
    }

    await apiClient.registerPushDevice({
      token,
      platform: Platform.OS === "ios" ? "ios" : "android",
    });

    this.currentPushToken = token;
    setLastRegisteredPushToken(token);
  }

  private async registerPushDeviceIfPossible() {
    if (!this.currentAccessToken || Platform.OS === "web") {
      if (Platform.OS === "web") {
        setNotificationPermissionStatus("unsupported");
      }

      return;
    }

    try {
      const hasPermission = await this.requestPushPermission();

      if (!hasPermission) {
        return;
      }

      const pushToken = await this.getNativePushToken();

      if (!pushToken) {
        return;
      }

      await apiClient.registerPushDevice({
        token: pushToken,
        platform: Platform.OS === "ios" ? "ios" : "android",
      });

      this.currentPushToken = pushToken;
      setLastRegisteredPushToken(pushToken);
      await this.attachTokenRefreshListener();
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Nao foi possivel registrar o device para push.");
    }
  }

  private buildHubUrl() {
    return new URL("/hubs/notifications", `${resolveApiBaseUrl()}/`).toString();
  }

  private async startRealtimeConnection(accessToken: string) {
    const connection = new HubConnectionBuilder()
      .withUrl(this.buildHubUrl(), {
        accessTokenFactory: async () => this.currentAccessToken ?? accessToken,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.None)
      .build();

    connection.on("NotificationReceived", (payload: NotificationItemDto) => {
      this.applyNotificationItem(payload);
    });

    connection.on("UnreadCountUpdated", (payload: UnreadCountUpdatedDto) => {
      this.applyUnreadCountUpdate(payload);
    });

    connection.onreconnecting(() => {
      setNotificationConnectionStatus("reconnecting");
    });

    connection.onreconnected(() => {
      setNotificationConnectionStatus("connected");
      setNotificationError("");
    });

    connection.onclose((error) => {
      setNotificationConnectionStatus("disconnected");

      if (error) {
        setNotificationError(error.message);
      }
    });

    this.hubConnection = connection;
    setNotificationConnectionStatus("connecting");

    try {
      await connection.start();
      setNotificationConnectionStatus("connected");
      setNotificationError("");
    } catch (error) {
      setNotificationConnectionStatus("disconnected");
      setNotificationError(error instanceof Error ? error.message : "Nao foi possivel conectar ao hub de notificacoes.");
    }
  }
}

export const notificationService = new NotificationService();
