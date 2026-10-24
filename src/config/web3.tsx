import type { ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { bohrTestnet } from './chain';

// 1. Setup QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
});

// 2. Project ID from Reown Cloud
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '00000000000000000000000000000000';

// 3. Metadata
const metadata = {
  name: 'BOT Airdrop Distributor',
  description: 'High-speed, gas-optimized bulk token distributor for Bohr Chain',
  url: 'https://scan.bohr.life',
  icons: ['https://scan.bohr.life/favicon.ico'],
};

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [bohrTestnet],
  projectId,
  ssr: false,
});

// 5. Initialize AppKit Modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: [bohrTestnet],
  defaultNetwork: bohrTestnet,
  projectId,
  metadata,
  features: {
    analytics: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1',
    '--w3m-border-radius-master': '12px',
  },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
