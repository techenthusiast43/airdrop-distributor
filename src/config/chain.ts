import { defineChain } from 'viem';

export const bohrTestnet = defineChain({
  id: 968,
  name: 'Bohr Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.bohr.life/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BohrScan',
      url: 'https://scan.bohr.life',
    },
  },
  contracts: {},
});

export const BOT_CHAIN = bohrTestnet;
