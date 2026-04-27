import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { Button } from "../components/common/Button";
import { AppLayout } from "../components/layout/AppLayout";
import { SkeletonBlock } from "../components/common/Skeleton";
import { ProfileScreenProps } from "../navigation/types";
import { apiClient } from "../services/apiClient";
import { clearAccessToken } from "../services/authStorage";
import { clearCurrentUser, setCurrentUser, useUserStore } from "../stores/userStore";
import type { AddressRequestDto, UpdateUserRequestDto, UserDto } from "../types/api";

function parseSafeNumber(value: number | string | undefined | null) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatEchoAmount(value: number | string | undefined | null) {
  return new Intl.NumberFormat("en-US", {
  }).format(parseSafeNumber(value));
}

function formatRoleLabel(role: number | undefined) {
  if (role === 0) {
    return "PARCEIRO DE IMPACTO";
  }

  if (role === 1) {
    return "APOIADOR DE IMPACTO";
  }

  return "MEMBRO ECHO";
}

function formatWalletLabel(walletAddress?: string | null) {
  const normalizedValue = walletAddress?.trim();

  if (!normalizedValue) {
    return "Carteira não conectada";
  }

  if (normalizedValue.length <= 14) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, 6)}...${normalizedValue.slice(-4)}`;
}

function formatAddressLine(address?: AddressRequestDto | null) {
  if (!address) {
    return "Nenhum endereço cadastrado";
  }

  const numberLabel = address.number !== null && address.number !== undefined ? `${address.number}` : "S/N";
  const parts = [address.street, numberLabel, address.neighborhood].filter((value) => value && value.trim().length > 0);
  return parts.length > 0 ? parts.join(", ") : "Nenhum endereço cadastrado";
}

function formatAddressDetail(address?: AddressRequestDto | null) {
  if (!address) {
    return "Adicione seu endereço para manter o perfil completo.";
  }

  const parts = [address.city, address.state, address.zipCode, address.countryCode]
    .filter((value) => value && value.trim().length > 0)
    .join(" • ");

  return parts || "Adicione seu endereço para manter o perfil completo.";
}

function createEmptyAddress(): AddressRequestDto {
  return {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    number: null,
    countryCode: "",
    neighborhood: "",
  };
}

function createAddressDraft(address?: AddressRequestDto | null) {
  const value = address ?? createEmptyAddress();

  return {
    street: value.street ?? "",
    city: value.city ?? "",
    state: value.state ?? "",
    zipCode: value.zipCode ?? "",
    number: value.number !== null && value.number !== undefined ? String(value.number) : "",
    countryCode: value.countryCode ?? "",
    neighborhood: value.neighborhood ?? "",
  };
}

function buildAddressPayload(address: {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  number: string;
  countryCode: string;
  neighborhood: string;
}): AddressRequestDto {
  return {
    street: address.street.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    zipCode: address.zipCode.trim(),
    number: address.number.trim().length > 0 ? Number(address.number) : null,
    countryCode: address.countryCode.trim().toUpperCase(),
    neighborhood: address.neighborhood.trim(),
  };
}

function appendCacheBuster(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${Date.now()}`;
}

function buildMergedUpdatedUser(
  currentUser: UserDto | null,
  updatedUser: UserDto,
  editTarget: Exclude<EditTarget, null>,
  profilePicturePreviewUri: string,
): UserDto {
  if (editTarget !== "profilePicture") {
    return {
      ...currentUser,
      ...updatedUser,
    };
  }

  const normalizedPreviewUri = profilePicturePreviewUri.trim();
  const updatedProfilePictureUrl = updatedUser.profilePicture?.url?.trim();
  const currentProfilePictureUrl = currentUser?.profilePicture?.url?.trim();

  const resolvedProfilePicture =
    updatedProfilePictureUrl
      ? { url: appendCacheBuster(updatedProfilePictureUrl) }
      : normalizedPreviewUri
        ? { url: normalizedPreviewUri }
        : currentProfilePictureUrl
          ? { url: currentProfilePictureUrl }
          : null;

  return {
    ...currentUser,
    ...updatedUser,
    profilePicture: resolvedProfilePicture,
  };
}

type EditTarget = "name" | "profilePicture" | "address" | null;

type PencilActionProps = {
  onPress: () => void;
  small?: boolean;
};

function PencilAction({ onPress, small = false }: PencilActionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`items-center justify-center rounded-full border-2 border-white bg-[#2F7D32] ${small ? "h-9 w-9" : "h-[52px] w-[52px]"}`}
      style={({ pressed }) => [
        {
          shadowColor: "#A5B8A8",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.22,
          shadowRadius: 16,
          elevation: 6,
        },
        pressed ? { opacity: 0.86 } : undefined,
      ]}
    >
      <Feather name="edit-2" size={small ? 15 : 20} color="#FFFFFF" />
    </Pressable>
  );
}

type EditProfileModalProps = {
  visible: boolean;
  target: EditTarget;
  isSaving: boolean;
  saveError: string;
  nameDraft: string;
  profilePicturePreviewUri: string;
  isPickingImage: boolean;
  addressDraft: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    number: string;
    countryCode: string;
    neighborhood: string;
  };
  onChangeName: (value: string) => void;
  onChooseProfilePicture: () => void;
  onChangeAddress: (field: string, value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

function EditProfileModal({
  visible,
  target,
  isSaving,
  saveError,
  nameDraft,
  profilePicturePreviewUri,
  isPickingImage,
  addressDraft,
  onChangeName,
  onChooseProfilePicture,
  onChangeAddress,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const modalTitle =
    target === "name"
      ? "Editar nome"
      : target === "profilePicture"
        ? "Editar foto do perfil"
        : target === "address"
          ? "Editar endereço"
          : "";

  const modalDescription =
    target === "name"
      ? "Atualize o nome que aparece no seu perfil."
      : target === "profilePicture"
        ? "Escolha uma imagem da sua galeria para atualizar a foto do perfil."
        : target === "address"
          ? "Atualize os dados do endereço vinculados ao seu perfil."
          : "";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center bg-black/45 px-5"
      >
        <View className="max-h-[88%] w-full max-w-md rounded-[28px] bg-white px-5 py-5">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[24px] font-semibold text-[#202124]">{modalTitle}</Text>
              <Text className="mt-2 text-[14px] leading-5 text-[#6F7A75]">{modalDescription}</Text>
            </View>

            <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F5F2]">
              <Ionicons name="close" size={20} color="#5E6A63" />
            </Pressable>
          </View>

          <ScrollView className="mt-5" showsVerticalScrollIndicator={false}>
            {target === "name" ? (
              <View className="gap-2">
                <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">Nome</Text>
                <TextInput
                  value={nameDraft}
                  onChangeText={onChangeName}
                  placeholder="Digite seu nome"
                  placeholderTextColor="#97A19B"
                  className="min-h-[58px] rounded-[18px] bg-[#F2F5F2] px-4 text-[16px] text-[#202124]"
                />
              </View>
            ) : null}

            {target === "profilePicture" ? (
              <View className="gap-4">
                <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">Foto do perfil</Text>

                <View className="items-center rounded-[22px] bg-[#F2F5F2] px-4 py-5">
                  <View className="h-[148px] w-[148px] overflow-hidden rounded-full border-[5px] border-white bg-[#DFE8DF]">
                    {profilePicturePreviewUri ? (
                      <Image source={{ uri: profilePicturePreviewUri }} className="h-full w-full" resizeMode="cover" />
                    ) : (
                      <View className="h-full w-full items-center justify-center bg-[#DDEBDC]">
                        <Ionicons name="person" size={46} color="#2F7D32" />
                      </View>
                    )}
                  </View>

                  <Text className="mt-4 text-center text-[13px] leading-5 text-[#6F7A75]">
                    {profilePicturePreviewUri
                      ? "Imagem selecionada. Salve para atualizar seu perfil."
                      : "Escolha uma imagem do aparelho para usar como foto do perfil."}
                  </Text>
                </View>

                <Button
                  label={isPickingImage ? "Abrindo galeria..." : "Escolher imagem"}
                  onPress={onChooseProfilePicture}
                  disabled={isPickingImage || isSaving}
                  variant="light"
                  className="rounded-[18px]"
                  textClassName="text-[16px] text-[#2F7D32]"
                />
              </View>
            ) : null}

            {target === "address" ? (
              <View className="gap-3">
                {[
                  ["street", "Rua", "Ex: Av. Paulista"],
                  ["number", "Número", "Ex: 1200"],
                  ["neighborhood", "Bairro", "Ex: Centro"],
                  ["city", "Cidade", "Ex: São Paulo"],
                  ["state", "Estado", "Ex: SP"],
                  ["zipCode", "CEP", "Ex: 01310-100"],
                  ["countryCode", "País", "Ex: BR"],
                ].map(([field, label, placeholder]) => (
                  <View key={field} className="gap-2">
                    <Text className="text-[12px] font-semibold uppercase tracking-[1.7px] text-[#6F7A75]">{label}</Text>
                    <TextInput
                      value={addressDraft[field as keyof typeof addressDraft]}
                      onChangeText={(value) => onChangeAddress(field, value)}
                      placeholder={placeholder}
                      placeholderTextColor="#97A19B"
                      autoCapitalize={field === "countryCode" ? "characters" : "words"}
                      keyboardType={field === "number" ? "number-pad" : "default"}
                      className="min-h-[58px] rounded-[18px] bg-[#F2F5F2] px-4 text-[16px] text-[#202124]"
                    />
                  </View>
                ))}
              </View>
            ) : null}

            {saveError ? (
              <View className="mt-4 rounded-[18px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-3">
                <Text className="text-[13px] leading-5 text-[#A33A3A]">{saveError}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View className="mt-5 gap-3">
            <Button
              label={isSaving ? "Salvando..." : "Salvar alterações"}
              onPress={onSave}
              disabled={isSaving}
              className="rounded-[18px]"
              textClassName="text-[16px]"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type PreferenceRowProps = {
  icon: ComponentProps<typeof Ionicons>["name"] | ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconLibrary?: "ionicons" | "material";
  title: string;
  description: string;
  rightSlot?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
};

function PreferenceRow({
  icon,
  iconLibrary = "ionicons",
  title,
  description,
  rightSlot,
  onPress,
  danger = false,
}: PreferenceRowProps) {
  const IconComponent = iconLibrary === "material" ? MaterialCommunityIcons : Ionicons;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center gap-3 rounded-[22px] bg-white px-4 py-4"
      style={({ pressed }) => [
        {
          shadowColor: "#D9E6DA",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.14,
          shadowRadius: 18,
          elevation: 2,
        },
        pressed && onPress ? { opacity: 0.82 } : undefined,
      ]}
    >
      <View className={`h-11 w-11 items-center justify-center rounded-full ${danger ? "bg-[#FFF0F0]" : "bg-[#F2F6F2]"}`}>
        <IconComponent name={icon as never} size={20} color={danger ? "#D44D4D" : "#315F35"} />
      </View>

      <View className="flex-1">
        <Text className={`text-[14px] font-semibold ${danger ? "text-[#C93C3C]" : "text-[#202124]"}`}>{title}</Text>
        <Text className={`mt-1 text-[12px] leading-4 ${danger ? "text-[#C97A7A]" : "text-[#7A8480]"}`}>
          {description}
        </Text>
      </View>

      {rightSlot}
    </Pressable>
  );
}

export default function ProfilePage({ navigation }: ProfileScreenProps) {
  const { currentUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [echoAmount, setEchoAmount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [comfortModeEnabled, setComfortModeEnabled] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [profilePictureDraft, setProfilePictureDraft] = useState("");
  const [profilePicturePreviewUri, setProfilePicturePreviewUri] = useState("");
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [addressDraft, setAddressDraft] = useState(createAddressDraft());

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [userResult, echoResult] = await Promise.allSettled([
          currentUser ? Promise.resolve(currentUser) : apiClient.me(),
          apiClient.getEchoAmount(),
        ]);

        if (!isMounted) {
          return;
        }

        if (userResult.status === "fulfilled") {
          setCurrentUser(userResult.value);
        } else {
          navigation.replace("Signin");
          return;
        }

        if (echoResult.status === "fulfilled") {
          setEchoAmount(parseSafeNumber(echoResult.value.echoAmount));
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar seu perfil agora.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [currentUser, navigation]);

  const user = currentUser;

  const openEditor = (target: EditTarget) => {
    setSaveError("");
    setEditTarget(target);
    setNameDraft(user?.name ?? "");
    setProfilePictureDraft("");
    setProfilePicturePreviewUri(user?.profilePicture?.url ?? "");
    setAddressDraft(createAddressDraft(user?.address));
  };

  const closeEditor = () => {
    if (isSavingProfile) {
      return;
    }

    setEditTarget(null);
    setSaveError("");
  };

  const handleAddressDraftChange = (field: string, value: string) => {
    setAddressDraft((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));
  };

  const handleChooseProfilePicture = async () => {
    try {
      setIsPickingImage(true);
      setSaveError("");

      if (Platform.OS !== "web") {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
          Alert.alert("Permissão necessária", "Permita acesso às fotos para escolher uma imagem do perfil.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      const base64 = asset?.base64?.trim();
      const previewUri = asset?.uri?.trim() || "";

      if (!base64) {
        setSaveError("Não foi possível ler a imagem selecionada.");
        return;
      }

      setProfilePictureDraft(base64);
      setProfilePicturePreviewUri(previewUri || `data:image/jpeg;base64,${base64}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível abrir a galeria.");
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editTarget) {
      return;
    }

    const currentEditTarget = editTarget;

    const payload: UpdateUserRequestDto = {};

    if (editTarget === "name") {
      payload.name = nameDraft.trim();
    }

    if (editTarget === "profilePicture") {
      payload.profilePictureBase64 = profilePictureDraft.trim();
    }

    if (editTarget === "address") {
      payload.address = buildAddressPayload(addressDraft);
    }

    try {
      setIsSavingProfile(true);
      setSaveError("");

      const updatedUser: UserDto = await apiClient.updateProfile(payload);
      const mergedUpdatedUser = buildMergedUpdatedUser(
        currentUser,
        updatedUser,
        currentEditTarget,
        profilePicturePreviewUri,
      );

      setCurrentUser(mergedUpdatedUser);
      setEditTarget(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível atualizar o perfil agora.");
    } finally {
      setIsSavingProfile(false);
    }
  };
  const handleSignOut = async () => {
    await clearAccessToken();
    clearCurrentUser();
    navigation.replace("Signin");
  };

  const handleExploreProjects = () => {
    navigation.navigate("AppHome");
  };

  return (
    <AppLayout headerVariant="logged-in" authFooterTab="perfil">
      <ScrollView className="flex-1" contentContainerClassName="gap-6 pb-10" showsVerticalScrollIndicator={false}>
        {!isLoading ? (
          <View className="items-center gap-5 pt-1">
            <View className="relative">
              <View
                className="h-[156px] w-[156px] overflow-hidden rounded-full border-[6px] border-white bg-[#E7EEE7]"
                style={{
                  shadowColor: "#9FB0A1",
                  shadowOffset: { width: 0, height: 18 },
                  shadowOpacity: 0.22,
                  shadowRadius: 30,
                  elevation: 8,
                }}
              >
                {user?.profilePicture?.url ? (
                  <Image source={{ uri: user.profilePicture.url }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <View className="h-full w-full items-center justify-center bg-[#DDEBDC]">
                    <Ionicons name="person" size={42} color="#2F7D32" />
                  </View>
                )}
              </View>

              <View className="absolute bottom-[10px] right-[-2px]">
                <PencilAction onPress={() => openEditor("profilePicture")} />
              </View>
            </View>

            <View className="items-center gap-3">
              <View className="flex-row items-center justify-center gap-3">
                <Text className="text-center text-[38px] font-semibold leading-[42px] text-[#202124]">
                  {user?.name ?? "Membro Echo"}
                </Text>
                <PencilAction onPress={() => openEditor("name")} small />
              </View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="shield-checkmark" size={18} color="#2F7D32" />
                <Text className="text-[13px] font-semibold uppercase tracking-[2.3px] text-[#7A847C]">
                  {formatRoleLabel(user?.role)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <View className="gap-6">
            <View className="rounded-[28px] bg-white px-5 py-5">
              <View className="items-center gap-5">
                <View className="relative">
                  <SkeletonBlock
                    width={156}
                    height={156}
                    borderRadius={999}
                    style={{
                      borderWidth: 6,
                      borderColor: "#FFFFFF",
                      shadowColor: "#9FB0A1",
                      shadowOffset: { width: 0, height: 18 },
                      shadowOpacity: 0.22,
                      shadowRadius: 30,
                      elevation: 8,
                    }}
                  />
                  <View className="absolute bottom-[10px] right-[-2px]">
                    <SkeletonBlock width={52} height={52} borderRadius={999} />
                  </View>
                </View>

                <View className="items-center gap-3">
                  <View className="flex-row items-center justify-center gap-3">
                    <SkeletonBlock height={38} width={220} borderRadius={18} />
                    <SkeletonBlock width={36} height={36} borderRadius={999} />
                  </View>
                  <View className="flex-row items-center gap-2">
                    <SkeletonBlock width={18} height={18} borderRadius={999} />
                    <SkeletonBlock height={13} width={180} borderRadius={999} />
                  </View>
                </View>
              </View>
            </View>

            <View className="rounded-[28px] bg-white px-5 py-5">
              <View className="gap-3">
                <SkeletonBlock height={14} width="38%" borderRadius={999} />
                <View className="flex-row items-end gap-2">
                  <SkeletonBlock height={56} width={126} borderRadius={20} />
                  <SkeletonBlock height={24} width={92} borderRadius={999} />
                </View>
                <View className="mt-3 flex-row gap-4">
                  <SkeletonBlock height={64} width="72%" borderRadius={20} />
                  <SkeletonBlock height={64} width={64} borderRadius={20} />
                </View>
              </View>
            </View>

            <View className="gap-3">
              <SkeletonBlock height={11} width={130} borderRadius={999} className="mx-1" />
              <View className="rounded-[26px] bg-white px-4 py-4">
                <View className="flex-row items-center gap-3">
                  <SkeletonBlock width={48} height={48} borderRadius={16} />
                  <View className="flex-1 gap-2">
                    <SkeletonBlock height={15} width="58%" borderRadius={999} />
                    <SkeletonBlock height={12} width="44%" borderRadius={999} />
                  </View>
                  <SkeletonBlock height={28} width={86} borderRadius={999} />
                </View>
              </View>
            </View>

            <View className="gap-3">
              <View className="flex-row items-center justify-between px-1">
                <SkeletonBlock height={11} width={82} borderRadius={999} />
                <SkeletonBlock width={36} height={36} borderRadius={999} />
              </View>
              <View className="rounded-[26px] bg-white px-4 py-4">
                <View className="flex-row items-center gap-3">
                  <SkeletonBlock width={48} height={48} borderRadius={16} />
                  <View className="flex-1 gap-2">
                    <SkeletonBlock height={15} width="70%" borderRadius={999} />
                    <SkeletonBlock height={12} width="90%" borderRadius={999} />
                  </View>
                </View>
              </View>
            </View>

            <View className="gap-3">
              <SkeletonBlock height={11} width={110} borderRadius={999} className="mx-1" />
              <View className="gap-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <View key={`profile-pref-skeleton-${index}`} className="flex-row items-center gap-3 rounded-[22px] bg-white px-4 py-4">
                    <SkeletonBlock width={44} height={44} borderRadius={999} />
                    <View className="flex-1 gap-2">
                      <SkeletonBlock height={14} width="46%" borderRadius={999} />
                      <SkeletonBlock height={12} width="72%" borderRadius={999} />
                    </View>
                    <SkeletonBlock width={42} height={24} borderRadius={999} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {!isLoading ? (
          <>
            <View
              className="overflow-hidden rounded-[28px] bg-[#2F7D32] px-5 py-5"
              style={{
                shadowColor: "#1D4D21",
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.2,
                shadowRadius: 24,
                elevation: 4,
              }}
            >
              <View className="absolute right-4 top-5 opacity-20">
                <Ionicons name="leaf-outline" size={128} color="#DDEEDC" />
              </View>
              <Text className="text-[14px] font-medium uppercase tracking-[2.4px] text-[#D6EAD7]">
                Crescimento total do impacto
              </Text>
              <View className="mt-4 flex-row items-end flex-wrap gap-x-2 gap-y-1">
                <Text className="text-[56px] font-semibold leading-[58px] text-white">{formatEchoAmount(echoAmount)}</Text>
                <Text className="pb-2 text-[24px] font-medium uppercase text-[#E5F2E4]">ECHOS</Text>
              </View>

            

              <View className="mt-6 flex-row items-center gap-4">
                <Pressable
                  onPress={handleExploreProjects}
                  className="flex-1 items-center justify-center rounded-[20px] bg-white px-5 py-5"
                  style={({ pressed }) => (pressed ? { opacity: 0.88 } : undefined)}
                >
                  <Text className="text-[16px] font-semibold text-[#2F7D32]">Explorar mais projetos</Text>
                </Pressable>

                <Pressable
                  onPress={handleExploreProjects}
                  className=" h-16 w-16 items-center justify-center rounded-[20px] bg-[#4B8F4D]"
                  style={({ pressed }) => (pressed ? { opacity: 0.88 } : undefined)}
                >
                  <Ionicons name="arrow-up-outline" size={34} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            {errorMessage ? (
              <View className="rounded-[24px] border border-[#F2D4D4] bg-[#FFF7F7] px-4 py-4">
                <Text className="text-[15px] font-semibold text-[#A33A3A]">Não foi possível carregar tudo</Text>
                <Text className="mt-2 text-[13px] leading-5 text-[#8B5B5B]">{errorMessage}</Text>
              </View>
            ) : null}

            <View className="gap-3">
              <Text className="px-1 text-[11px] font-semibold uppercase tracking-[1.8px] text-[#8D9893]">
                Carteira conectada
              </Text>
              <View className="rounded-[26px] bg-white px-4 py-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-[16px] bg-[#EFF4FF]">
                    <MaterialCommunityIcons name="wallet-outline" size={23} color="#466CD9" />
                  </View>

                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-[#202124]">{formatWalletLabel(user?.walletAddress)}</Text>
                    <Text className="mt-1 text-[12px] text-[#7A8480]">{user?.email ?? "Nenhum e-mail disponível"}</Text>
                  </View>

                  <View className="rounded-full bg-[#EEF6EE] px-3 py-1.5">
                    <Text className="text-[12px] font-medium text-[#2F7D32]">Conectada</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="gap-3">
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.8px] text-[#8D9893]">
                  Endereço
                </Text>
                <PencilAction onPress={() => openEditor("address")} small />
              </View>

              <View className="rounded-[26px] bg-white px-4 py-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-[16px] bg-[#EEF6EE]">
                    <Ionicons name="location-outline" size={23} color="#2F7D32" />
                  </View>

                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-[#202124]">{formatAddressLine(user?.address)}</Text>
                    <Text className="mt-1 text-[12px] leading-4 text-[#7A8480]">{formatAddressDetail(user?.address)}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="gap-3">
              <Text className="px-1 text-[11px] font-semibold uppercase tracking-[1.8px] text-[#8D9893]">
                Preferências
              </Text>

              <View className="gap-3">
                <PreferenceRow
                  icon="notifications-outline"
                  title="Notificações"
                  description="Receba atualizações sobre suas doações e atividades do perfil."
                  rightSlot={
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={setNotificationsEnabled}
                      trackColor={{ false: "#D6DDD7", true: "#76B27A" }}
                      thumbColor="#FFFFFF"
                    />
                  }
                />

                <PreferenceRow
                  icon="log-out-outline"
                  title="Sair"
                  description="Encerrar esta sessão com segurança e voltar ao login."
                  rightSlot={<Ionicons name="chevron-forward" size={18} color="#E28A8A" />}
                  onPress={() => {
                    void handleSignOut();
                  }}
                  danger
                />
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      <EditProfileModal
        visible={editTarget !== null}
        target={editTarget}
        isSaving={isSavingProfile}
        saveError={saveError}
        nameDraft={nameDraft}
        profilePicturePreviewUri={profilePicturePreviewUri}
        isPickingImage={isPickingImage}
        addressDraft={addressDraft}
        onChangeName={setNameDraft}
        onChooseProfilePicture={() => {
          void handleChooseProfilePicture();
        }}
        onChangeAddress={handleAddressDraftChange}
        onClose={closeEditor}
        onSave={() => {
          void handleSaveProfile();
        }}
      />
    </AppLayout>
  );
}
