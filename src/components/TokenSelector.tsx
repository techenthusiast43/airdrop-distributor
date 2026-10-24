import React, { useState, useEffect } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { isAddress, getAddress } from 'viem';
import { Coins, CircleDollarSign, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { ERC20_ABI } from '../contracts/distributorAbi';
import { formatTokenAmount } from '../utils/formatters';
import type { TokenMode, TokenMetadata } from '../types';

interface TokenSelectorProps {
  tokenMode: TokenMode;
  onSelectTokenMode: (mode: TokenMode) => void;
  tokenMetadata: TokenMetadata | null;
  onTokenMetadataChange: (meta: TokenMetadata | null) => void;
  tokenAddressInput: string;
  onTokenAddressInputChange: (val: string) => void;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  tokenMode,
  onSelectTokenMode,
  tokenMetadata,
  onTokenMetadataChange,
  tokenAddressInput,
  onTokenAddressInputChange,
}) => {
  const { address: userAddress, isConnected } = useAccount();
  const [addressError, setAddressError] = useState<string | null>(null);

  const isValidInput = isAddress(tokenAddressInput.trim());
  const formattedTokenAddress = isValidInput ? (getAddress(tokenAddressInput.trim()) as `0x${string}`) : undefined;

  // Read ERC-20 symbol, decimals, name, and user's balance
  const { data, isLoading, isError, refetch } = useReadContracts({
    contracts: [
      {
        address: formattedTokenAddress,
        abi: ERC20_ABI,
        functionName: 'name',
      },
      {
        address: formattedTokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
      },
      {
        address: formattedTokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      },
      {
        address: formattedTokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
      },
    ],
    query: {
      enabled: tokenMode === 'ERC20' && Boolean(formattedTokenAddress) && isConnected,
    },
  });

  useEffect(() => {
    if (tokenMode === 'NATIVE') {
      onTokenMetadataChange(null);
      setAddressError(null);
      return;
    }

    if (!tokenAddressInput.trim()) {
      onTokenMetadataChange(null);
      setAddressError(null);
      return;
    }

    if (!isValidInput) {
      setAddressError('Please enter a valid Bohr Chain contract address');
      onTokenMetadataChange(null);
      return;
    }

    setAddressError(null);

    if (data && data[0]?.status === 'success' && data[1]?.status === 'success' && data[2]?.status === 'success') {
      const name = data[0].result as string;
      const symbol = data[1].result as string;
      const decimals = Number(data[2].result);
      const balance = (data[3]?.result as bigint) || 0n;

      onTokenMetadataChange({
        address: formattedTokenAddress!,
        name,
        symbol,
        decimals,
        balance,
        formattedBalance: formatTokenAmount(balance, decimals, 4),
      });
    } else if (isError) {
      setAddressError('Could not fetch token details. Verify the contract address on BohrScan.');
      onTokenMetadataChange(null);
    }
  }, [data, isError, isValidInput, tokenAddressInput, tokenMode, formattedTokenAddress, onTokenMetadataChange]);

  return (
    <div className="glass-panel card-section">
      <div className="section-header">
        <h2 className="section-title">
          <Coins size={22} style={{ color: 'var(--accent-secondary)' }} />
          <span>1. Select Distribution Asset</span>
        </h2>
      </div>

      <div className="mode-tabs">
        <button
          type="button"
          className={`mode-tab-btn ${tokenMode === 'ERC20' ? 'active' : ''}`}
          onClick={() => onSelectTokenMode('ERC20')}
        >
          <CircleDollarSign size={18} />
          <span>ERC-20 Token</span>
        </button>
        <button
          type="button"
          className={`mode-tab-btn ${tokenMode === 'NATIVE' ? 'active' : ''}`}
          onClick={() => onSelectTokenMode('NATIVE')}
        >
          <Coins size={18} />
          <span>Native BOT</span>
        </button>
      </div>

      {tokenMode === 'ERC20' ? (
        <div>
          <label className="input-label">ERC-20 Token Contract Address on Bohr Chain</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. 0x..."
              value={tokenAddressInput}
              onChange={(e) => onTokenAddressInputChange(e.target.value)}
            />
            {formattedTokenAddress && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => refetch()}
                title="Refresh token balance"
                style={{ padding: '0 16px' }}
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>

          {addressError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.84rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={15} />
              {addressError}
            </p>
          )}

          {tokenMetadata && (
            <div
              style={{
                marginTop: '16px',
                padding: '16px 20px',
                background: 'rgba(11, 17, 33, 0.7)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                    {tokenMetadata.name} ({tokenMetadata.symbol})
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                    {tokenMetadata.decimals} Decimals
                  </span>
                </div>
                <a
                  href={`https://scan.bohr.life/address/${tokenMetadata.address}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '0.8rem',
                    color: '#38bdf8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '4px',
                    textDecoration: 'none',
                  }}
                >
                  <span>{tokenMetadata.address}</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Your Balance</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                  {tokenMetadata.formattedBalance} {tokenMetadata.symbol}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: '18px 22px',
            background: 'rgba(11, 17, 33, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8' }}>Native BOT Distribution</span>
            <span style={{ fontSize: '0.78rem', color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              18 Decimals
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Distribute native BOT directly to recipients from your connected wallet without needing an ERC-20 approval step.
          </p>
        </div>
      )}
    </div>
  );
};
