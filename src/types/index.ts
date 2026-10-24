export type TokenMode = 'ERC20' | 'NATIVE';

export interface RecipientRecord {
  id: string;
  address: string;
  amount: string; // User input amount in ether/tokens (e.g. "100.5")
  parsedAmountWei?: bigint;
  status: 'valid' | 'invalid' | 'duplicate';
  error?: string;
}

export interface DistributionBatch {
  batchIndex: number;
  recipients: string[];
  amounts: bigint[];
  totalWei: bigint;
  status: 'idle' | 'pending' | 'success' | 'failed';
  txHash?: string;
  errorMessage?: string;
}

export interface TokenMetadata {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  formattedBalance: string;
}

export interface DistributionSummary {
  totalRecipients: number;
  validRecipients: number;
  invalidRecipients: number;
  duplicateRecipients: number;
  totalTokensFormatted: string;
  totalTokensWei: bigint;
  batchesCount: number;
}
