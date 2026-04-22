import { Linking } from "react-native";

import type { WalletDonationRequest, WalletDonationResult } from "./donationWallet.types";

const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";
const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const DEFAULT_DAPP_URL =
  process.env.EXPO_PUBLIC_API_URL;
type EthereumRequestArguments = {
  method: string;
  params?: unknown[];
};

type EthereumProvider = {
  request: (args: EthereumRequestArguments) => Promise<unknown>;
  selectedAddress?: string | null;
  getSelectedAddress?: () => string | null | undefined;
};

type MetaMaskSdkInstance = {
  connect: () => Promise<string[]>;
  getProvider: () => EthereumProvider | undefined;
};

type WalletRpcError = Error & {
  code?: number;
};

let metaMaskSdkPromise: Promise<MetaMaskSdkInstance> | null = null;

function createWalletError(message: string, code?: number) {
  const error = new Error(message) as WalletRpcError;

  if (code !== undefined) {
    error.code = code;
  }

  return error;
}

function normalizeAddress(address: string) {
  return address.trim().toLowerCase();
}

function isValidEthereumAddress(address: string) {
  return ETHEREUM_ADDRESS_REGEX.test(address.trim());
}

function getErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const errorCode = (error as { code?: unknown }).code;
  return typeof errorCode === "number" ? errorCode : undefined;
}

async function requestProvider<TResponse>(
  provider: EthereumProvider,
  method: string,
  params?: unknown[],
): Promise<TResponse> {
  return provider.request({ method, params }) as Promise<TResponse>;
}

async function getBackgroundTimerModule() {
  try {
    const backgroundTimerModule = await import("react-native-background-timer");
    return backgroundTimerModule.default ?? backgroundTimerModule;
  } catch {
    return undefined;
  }
}

async function createMetaMaskSdk() {
  const [{ default: MetaMaskSDK }, backgroundTimer] = await Promise.all([
    import("@metamask/sdk"),
    getBackgroundTimerModule(),
  ]);

  return new MetaMaskSDK({
    checkInstallationOnAllCalls: true,
    dappMetadata: {
      name: "Echo",
      url: DEFAULT_DAPP_URL,
    },
    enableAnalytics: false,
    extensionOnly: false,
    injectProvider: false,
    openDeeplink: (link: string) => {
      void Linking.openURL(link);
    },
    timer: backgroundTimer,
    useDeeplink: true,
  }) as MetaMaskSdkInstance;
}

async function getMetaMaskSdk() {
  if (!metaMaskSdkPromise) {
    metaMaskSdkPromise = createMetaMaskSdk().catch((error) => {
      metaMaskSdkPromise = null;
      throw error;
    });
  }

  return metaMaskSdkPromise;
}

async function ensureSepoliaChain(provider: EthereumProvider) {
  try {
    await requestProvider(provider, "wallet_switchEthereumChain", [{ chainId: SEPOLIA_CHAIN_ID_HEX }]);
  } catch (error) {
    if (getErrorCode(error) !== 4902) {
      throw error;
    }

    await requestProvider(provider, "wallet_addEthereumChain", [
      {
        blockExplorerUrls: ["https://sepolia.etherscan.io"],
        chainId: SEPOLIA_CHAIN_ID_HEX,
        chainName: "Sepolia",
        nativeCurrency: {
          decimals: 18,
          name: "Sepolia Ether",
          symbol: "ETH",
        },
        rpcUrls: ["https://rpc.sepolia.org"],
      },
    ]);
  }
}

function resolveSenderAddress(provider: EthereumProvider, accounts: string[]) {
  const selectedAddress =
    accounts[0]?.trim() || provider.selectedAddress?.trim() || provider.getSelectedAddress?.()?.trim() || "";

  if (!selectedAddress) {
    throw createWalletError("Nenhuma conta foi autorizada na carteira.");
  }

  if (!isValidEthereumAddress(selectedAddress)) {
    throw createWalletError("A carteira conectada retornou um endereço inválido.");
  }

  return selectedAddress;
}

export async function sendSepoliaEthDonation({
  expectedSenderAddress,
  recipientAddress,
  valueWei,
}: WalletDonationRequest): Promise<WalletDonationResult> {
  const normalizedRecipientAddress = recipientAddress.trim();
  const normalizedExpectedSenderAddress = expectedSenderAddress?.trim() || "";

  if (!isValidEthereumAddress(normalizedRecipientAddress)) {
    throw createWalletError("O endereço do smart contract do projeto é inválido.");
  }

  if (normalizedExpectedSenderAddress && !isValidEthereumAddress(normalizedExpectedSenderAddress)) {
    throw createWalletError("A carteira cadastrada no perfil é inválida.");
  }

  if (valueWei <= 0n) {
    throw createWalletError("O valor da doação precisa ser maior que zero.");
  }

  const sdk = await getMetaMaskSdk();
  const provider = sdk.getProvider();

  if (!provider) {
    throw createWalletError("Não foi possível iniciar a conexão com a carteira.");
  }

  const accounts = await sdk.connect();
  const senderAddress = resolveSenderAddress(provider, accounts);

  if (
    normalizedExpectedSenderAddress &&
    normalizeAddress(senderAddress) !== normalizeAddress(normalizedExpectedSenderAddress)
  ) {
    throw createWalletError("A conta conectada no MetaMask é diferente da carteira cadastrada no seu perfil.");
  }

  await ensureSepoliaChain(provider);

  const transactionHash = await requestProvider<string>(provider, "eth_sendTransaction", [
    {
      from: senderAddress,
      to: normalizedRecipientAddress,
      value: `0x${valueWei.toString(16)}`,
    },
  ]);

  if (typeof transactionHash !== "string" || transactionHash.trim().length === 0) {
    throw createWalletError("A carteira não retornou o hash da transação.");
  }

  return {
    senderAddress,
    transactionHash: transactionHash.trim(),
  };
}
