import type { WalletDonationRequest, WalletDonationResult } from "./donationWallet.types";

const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";
const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

type EthereumRequestArguments = {
  method: string;
  params?: unknown[];
};

type EthereumProvider = {
  isMetaMask?: boolean;
  selectedAddress?: string | null;
  request: (args: EthereumRequestArguments) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function createWalletError(message: string, code?: number) {
  const error = new Error(message) as Error & { code?: number };

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

function getBrowserProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw createWalletError("MetaMask não foi encontrado neste navegador.");
  }

  return window.ethereum;
}

async function requestProvider<TResponse>(
  provider: EthereumProvider,
  method: string,
  params?: unknown[],
): Promise<TResponse> {
  return provider.request({ method, params }) as Promise<TResponse>;
}

async function ensureSepoliaChain(provider: EthereumProvider) {
  try {
    await requestProvider(provider, "wallet_switchEthereumChain", [{ chainId: SEPOLIA_CHAIN_ID_HEX }]);
  } catch (error) {
    const errorCode =
      typeof error === "object" && error !== null && "code" in error && typeof error.code === "number"
        ? error.code
        : undefined;

    if (errorCode !== 4902) {
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

export async function sendSepoliaEthDonation(
  request: WalletDonationRequest,
): Promise<WalletDonationResult> {
  const provider = getBrowserProvider();
  const normalizedRecipientAddress = request.recipientAddress.trim();
  const normalizedExpectedSenderAddress = request.expectedSenderAddress?.trim() || "";

  if (!isValidEthereumAddress(normalizedRecipientAddress)) {
    throw createWalletError("O endereço do smart contract do projeto é inválido.");
  }

  if (normalizedExpectedSenderAddress && !isValidEthereumAddress(normalizedExpectedSenderAddress)) {
    throw createWalletError("A carteira cadastrada no perfil é inválida.");
  }

  if (request.valueWei <= 0n) {
    throw createWalletError("O valor da doação precisa ser maior que zero.");
  }

  const accounts = await requestProvider<string[]>(provider, "eth_requestAccounts");
  const senderAddress = accounts[0]?.trim() || provider.selectedAddress?.trim() || "";

  if (!senderAddress) {
    throw createWalletError("Nenhuma conta foi autorizada no MetaMask.");
  }

  if (normalizedExpectedSenderAddress && normalizeAddress(senderAddress) !== normalizeAddress(normalizedExpectedSenderAddress)) {
    throw createWalletError("A conta conectada no MetaMask é diferente da carteira cadastrada no seu perfil.");
  }

  await ensureSepoliaChain(provider);

  const transactionHash = await requestProvider<string>(provider, "eth_sendTransaction", [
    {
      from: senderAddress,
      to: normalizedRecipientAddress,
      value: `0x${request.valueWei.toString(16)}`,
    },
  ]);

  if (typeof transactionHash !== "string" || transactionHash.trim().length === 0) {
    throw createWalletError("O MetaMask não retornou o hash da transação.");
  }

  return {
    senderAddress,
    transactionHash: transactionHash.trim(),
  };
}
