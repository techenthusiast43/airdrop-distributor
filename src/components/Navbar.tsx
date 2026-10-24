import React from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Zap, BookOpen } from 'lucide-react';
import { formatTokenAmount, shortenAddress } from '../utils/formatters';

interface NavbarProps {
  contractAddress?: string;
  onOpenContractModal: () => void;
  onOpenWhitepaperModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  contractAddress,
  onOpenContractModal,
  onOpenWhitepaperModal,
}) => {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({
    address,
  });

  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <img
          src="/logo.svg"
          alt="BOT Airdrop Distributor Logo"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="brand-title">BOT Airdrop Distributor</h1>
            <span className="chain-badge">
              <span className="pulse-dot"></span>
              Bohr Testnet (968)
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            High-speed, gas-optimized bulk token distributor
          </p>
        </div>
      </div>

      <div className="header-actions">
        {/* Whitepaper Trigger */}
        <button
          onClick={onOpenWhitepaperModal}
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
          title="Read Protocol Whitepaper"
        >
          <BookOpen size={14} style={{ color: '#38bdf8' }} />
          <span>Whitepaper</span>
        </button>

        {contractAddress ? (
          <button
            onClick={onOpenContractModal}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            title="Click to view or change distributor contract"
          >
            <Zap size={14} style={{ color: '#10b981' }} />
            <span>Contract: {shortenAddress(contractAddress, 4)}</span>
          </button>
        ) : (
          <button
            onClick={onOpenContractModal}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 14px', borderColor: '#f59e0b', color: '#f59e0b' }}
          >
            <Zap size={14} />
            <span>Set Distributor Contract</span>
          </button>
        )}

        {isConnected && balanceData && (
          <div
            style={{
              padding: '8px 14px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84rem',
              fontWeight: 600,
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>BOT: </span>
            <span style={{ color: '#38bdf8' }}>
              {formatTokenAmount(balanceData.value, 18, 4)}
            </span>
          </div>
        )}

        {/* Reown AppKit Web Component button */}
        <appkit-button balance="hide" />
      </div>
    </header>
  );
};
