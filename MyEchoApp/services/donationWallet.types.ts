export type WalletDonationRequest = {
  recipientAddress: string;
  valueWei: bigint;
  expectedSenderAddress?: string | null;
};

export type WalletDonationResult = {
  transactionHash: string;
  senderAddress: string;
};
