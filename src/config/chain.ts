import { defineChain } from 'viem';

/**
 * BotChain Mainnet (Chain ID: 677)
 * Native Token: BOT (18 Decimals)
 * Total Supply: 150 Million BOT
 * RPC: https://rpc.botchain.ai
 * Explorer: https://scan.botchain.ai
 */
export const botMainnet = defineChain({
  id: 677,
  name: 'BotChain Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.botchain.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BotScan',
      url: 'https://scan.botchain.ai',
    },
  },
  contracts: {},
});

export const BOT_CHAIN = botMainnet;
export const SUPPORTED_CHAINS = [botMainnet] as const;

/**
 * Block explorer URL helpers (Mainnet)
 */
export function getExplorerTxUrl(txHash: string, _chainId?: number): string {
  return `https://scan.botchain.ai/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, _chainId?: number): string {
  return `https://scan.botchain.ai/address/${address}`;
}

export function getExplorerName(_chainId?: number): string {
  return 'BotScan';
}

export function getNetworkDisplayName(_chainId?: number): string {
  return 'BotChain Mainnet (677)';
}
