import { useCallback, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View,
  type ViewToken,
} from "react-native";

import type { RootStackParamList } from "../../navigation/types";
import { apiClient } from "../../services/apiClient";
import { markNotificationItemsAsRead, useNotificationStore } from "../../stores/notificationStore";
import { useUserStore } from "../../stores/userStore";
import type { NotificationItemDto } from "../../types/api";
import { Logo } from "../logo/logo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type HeaderVariant = "logo-left" | "logo-middle" | "logged-in";

type HeaderProps = {
  variant: HeaderVariant;
};

const NOTIFICATIONS_PAGE_SIZE = 20;

function formatNotificationDate(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function mergeNotifications(
  currentNotifications: readonly NotificationItemDto[],
  incomingNotifications: readonly NotificationItemDto[],
) {
  const notificationMap = new Map<string, NotificationItemDto>();

  for (const notification of currentNotifications) {
    notificationMap.set(notification.id, notification);
  }

  for (const notification of incomingNotifications) {
    notificationMap.set(notification.id, notification);
  }

  return Array.from(notificationMap.values()).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function ProfileAvatar() {
  const { currentUser } = useUserStore();
  const profilePictureUrl = currentUser?.profilePicture?.url;

  if (profilePictureUrl) {
    return (
      <Image
        source={{ uri: profilePictureUrl }}
        className="h-12 w-12 rounded-full"
        resizeMode="cover"
      />
    );
  }

  return (
    <View className="h-12 w-12 items-center justify-center rounded-full bg-[#DDEBDC]">
      <Ionicons name="person" size={22} color="#0B5A46" />
    </View>
  );
}

export function Header({ variant }: HeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { unreadCount } = useNotificationStore();
  const unreadBadgeLabel = unreadCount > 99 ? "99+" : `${unreadCount}`;
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItemDto[]>([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isRefreshingNotifications, setIsRefreshingNotifications] = useState(false);
  const [isLoadingMoreNotifications, setIsLoadingMoreNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const requestedReadIdsRef = useRef(new Set<string>());
  const nextPageNumberRef = useRef(0);
  const hasLoadedNotificationsRef = useRef(false);

  const handleLogoPress = () => {
    navigation.navigate("AppHome");
  };

  const loadNotifications = useCallback(
    async (pageNumber: number, mode: "replace" | "append") => {
      if (mode === "replace") {
        setIsLoadingNotifications(true);
        setNotificationsError("");
      } else {
        setIsLoadingMoreNotifications(true);
      }

      try {
        const result = await apiClient.getNotifications({
          pageNumber,
          pageSize: NOTIFICATIONS_PAGE_SIZE,
        });

        setNotifications((currentNotifications) =>
          mode === "replace"
            ? mergeNotifications([], result.items)
            : mergeNotifications(currentNotifications, result.items),
        );
        setTotalNotifications(result.totalCount);
        nextPageNumberRef.current = pageNumber + 1;
        hasLoadedNotificationsRef.current = true;
      } catch (error) {
        setNotificationsError(error instanceof Error ? error.message : "Nao foi possivel carregar notificacoes.");
      } finally {
        setIsLoadingNotifications(false);
        setIsRefreshingNotifications(false);
        setIsLoadingMoreNotifications(false);
      }
    },
    [],
  );

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true);

    if (!hasLoadedNotificationsRef.current) {
      void loadNotifications(0, "replace");
    }
  };

  const handleCloseNotifications = () => {
    setIsNotificationsOpen(false);
  };

  const handleRefreshNotifications = () => {
    setIsRefreshingNotifications(true);
    requestedReadIdsRef.current.clear();
    void loadNotifications(0, "replace");
  };

  const handleLoadMoreNotifications = () => {
    if (
      isLoadingNotifications ||
      isLoadingMoreNotifications ||
      notifications.length >= totalNotifications ||
      notifications.length === 0
    ) {
      return;
    }

    void loadNotifications(nextPageNumberRef.current, "append");
  };

  const markNotificationsAsReadById = useCallback(async (notificationIds: readonly string[]) => {
    const notificationIdsToMark = notificationIds.filter((notificationId) => !requestedReadIdsRef.current.has(notificationId));

    if (notificationIdsToMark.length === 0) {
      return;
    }

    notificationIdsToMark.forEach((notificationId) => {
      requestedReadIdsRef.current.add(notificationId);
    });

    try {
      const result = await apiClient.markNotificationsAsRead({
        notificationIds: [...notificationIdsToMark],
      });

      if (result.updatedCount > 0) {
        setNotifications((currentNotifications) =>
          currentNotifications.map((notification) =>
            notificationIdsToMark.includes(notification.id)
              ? {
                  ...notification,
                  isRead: true,
                }
              : notification,
          ),
        );
        markNotificationItemsAsRead(notificationIdsToMark);
      }
    } catch {
      notificationIdsToMark.forEach((notificationId) => {
        requestedReadIdsRef.current.delete(notificationId);
      });
    }
  }, []);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken<NotificationItemDto>> }) => {
      const unreadVisibleNotificationIds = viewableItems
        .map((viewableItem) => viewableItem.item)
        .filter((notification): notification is NotificationItemDto => Boolean(notification))
        .filter((notification) => !notification.isRead)
        .map((notification) => notification.id);

      if (unreadVisibleNotificationIds.length > 0) {
        void markNotificationsAsReadById(unreadVisibleNotificationIds);
      }
    },
  ).current;

  const renderNotificationItem = useCallback(({ item }: { item: NotificationItemDto }) => {
    return (
      <View
        className={`rounded-[22px] border px-4 py-4 ${item.isRead ? "border-[#E6ECE8] bg-white" : "border-[#D4E8D5] bg-[#F4FBF4]"}`}
      >
        <View className="flex-row items-start gap-3">
          <View className={`mt-1 h-2.5 w-2.5 rounded-full ${item.isRead ? "bg-[#C7D3CB]" : "bg-[#2F7D32]"}`} />
          <View className="flex-1 gap-1">
            <Text className="text-[15px] font-semibold text-[#202124]">{item.message}</Text>
            <Text className="text-[13px] leading-5 text-[#66726C]">{item.description}</Text>
            <Text className="pt-1 text-[11px] font-medium uppercase tracking-[1.2px] text-[#8A9690]">
              {formatNotificationDate(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  }, []);

  if (variant === "logged-in") {
    return (
      <>
        <View className="w-full flex-row items-center justify-between bg-[#F8FAF9] px-4 py-5">
          <View className="flex-row items-center gap-3">
            <ProfileAvatar />
            <Pressable
              onPress={handleLogoPress}
              hitSlop={8}
              style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}
            >
              <Logo />
            </Pressable>
          </View>

          <Pressable
            onPress={handleOpenNotifications}
            className="h-12 w-12 items-center justify-center"
            style={({ pressed }) => (pressed ? { transform: [{ scale: 0.97 }] } : undefined)}
          >
            <View className="relative">
              <Ionicons name="notifications-outline" size={24} color="#7D8DA7" />
              {unreadCount > 0 ? (
                <View className="absolute -right-2 -top-2 min-w-[18px] items-center justify-center rounded-full bg-[#2F7D32] px-1 py-[1px]">
                  <Text className="text-[10px] font-bold text-white">{unreadBadgeLabel}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>

        <Modal visible={isNotificationsOpen} animationType="slide" transparent onRequestClose={handleCloseNotifications}>
          <View className="flex-1 bg-black/35">
            <Pressable className="flex-1" onPress={handleCloseNotifications} />
            <View className="max-h-[78%] rounded-t-[28px] bg-[#F8FAF9] px-5 pb-8 pt-5">
              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-[24px] font-semibold text-[#202124]">Notificações</Text>
                  <Text className="mt-1 text-[13px] text-[#6B7671]">
                    {unreadCount > 0 ? `${unreadCount} não lida${unreadCount === 1 ? "" : "s"}` : "Nenhuma notificação não lida"}
                  </Text>
                </View>
                <Pressable
                  onPress={handleCloseNotifications}
                  className="h-10 w-10 items-center justify-center rounded-full bg-white"
                >
                  <Ionicons name="close" size={20} color="#5E6A63" />
                </Pressable>
              </View>

              {isLoadingNotifications && notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center gap-3 py-10">
                  <ActivityIndicator size="small" color="#2F7D32" />
                  <Text className="text-[13px] text-[#6B7671]">Carregando notificações...</Text>
                </View>
              ) : notificationsError && notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center gap-4 py-10">
                  <Text className="text-center text-[14px] leading-5 text-[#A33A3A]">{notificationsError}</Text>
                  <Pressable
                    onPress={() => {
                      void loadNotifications(0, "replace");
                    }}
                    className="rounded-full bg-[#2F7D32] px-4 py-2"
                  >
                    <Text className="text-[13px] font-semibold text-white">Tentar novamente</Text>
                  </Pressable>
                </View>
              ) : (
                <FlatList
                  data={notifications}
                  keyExtractor={(item) => item.id}
                  renderItem={renderNotificationItem}
                  contentContainerStyle={{ gap: 12, paddingBottom: 12, flexGrow: notifications.length === 0 ? 1 : 0 }}
                  showsVerticalScrollIndicator={false}
                  onEndReached={handleLoadMoreNotifications}
                  onEndReachedThreshold={0.35}
                  onViewableItemsChanged={handleViewableItemsChanged}
                  viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefreshingNotifications}
                      onRefresh={handleRefreshNotifications}
                      tintColor="#2F7D32"
                    />
                  }
                  ListEmptyComponent={
                    <View className="flex-1 items-center justify-center py-12">
                      <Text className="text-center text-[14px] leading-5 text-[#6B7671]">
                        Nenhuma notificação encontrada.
                      </Text>
                    </View>
                  }
                  ListFooterComponent={
                    isLoadingMoreNotifications ? (
                      <View className="py-4">
                        <ActivityIndicator size="small" color="#2F7D32" />
                      </View>
                    ) : null
                  }
                />
              )}
            </View>
          </View>
        </Modal>
      </>
    );
  }

  const logoPosition = variant === "logo-left" ? "justify-start" : "justify-center";

  return (
    <View className={`w-full flex-row items-center ${logoPosition} bg-headerMint px-4 py-7`}>
      <Pressable onPress={handleLogoPress} hitSlop={8} style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}>
        <Logo />
      </Pressable>
    </View>
  );
}

export type { HeaderVariant };
