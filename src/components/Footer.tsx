import React from 'react';
import { ExternalLink, ShieldCheck, Cpu, BookOpen, Zap, Layers } from 'lucide-react';

interface FooterProps {
  onOpenWhitepaperModal: () => void;
  onOpenContractModal: () => void;
  contractAddress?: string;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenWhitepaperModal,
  onOpenContractModal,
  contractAddress = '0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20',
}) => {
  return (
    <footer style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid var(--border-subtle)' }}>
      {/* BOT Chain Ecosystem Showcase Section */}
      <div
        style={{
          padding: '28px 32px',
          background: 'linear-gradient(135deg, rgba(16, 163, 127, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%)',
          border: '1px solid rgba(16, 163, 127, 0.25)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* BOT Chain Brand Name & Ecosystem Overview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '280px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(16, 163, 127, 0.12)',
              border: '1px solid rgba(16, 163, 127, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10a37f',
            }}
          >
            <Layers size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                BOT Chain Ecosystem
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 163, 127, 0.2)',
                  color: '#10a37f',
                  border: '1px solid rgba(16, 163, 127, 0.4)',
                  fontWeight: 700,
                }}
              >
                Mainnet 677
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '440px' }}>
              Engineered natively for the high-speed, gas-optimized BOT Chain EVM network (150 Million BOT Total Supply).
            </p>
          </div>
        </div>

        {/* Mandatory BOT Chain Links with Official On-Chain BOT Logo in front only */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {/* BOT Chain Website Link */}
          <a
            href="https://botchain.ai"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#f8fafc',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(16, 163, 127, 0.4)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <img
              src="/bot-token-onchain.svg"
              alt="Official BOT On-Chain Logo"
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'block',
              }}
            />
            <span>BOT Chain Website</span>
            <ExternalLink size={13} style={{ color: 'var(--text-dim)' }} />
          </a>

          {/* BOT Chain Explorer Link */}
          <a
            href="https://scan.botchain.ai"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#f8fafc',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(16, 163, 127, 0.4)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <img
              src="/bot-token-onchain.svg"
              alt="Official BOT On-Chain Logo"
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'block',
              }}
            />
            <span>BOT Chain Explorer</span>
            <ExternalLink size={13} style={{ color: 'var(--text-dim)' }} />
          </a>
        </div>
      </div>

      {/* Footer Sub-Navigation & Details */}
      <div
        style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '18px',
          fontSize: '0.82rem',
          color: 'var(--text-dim)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span>© 2026 BOT Airdrop Distributor</span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} style={{ color: '#10a37f' }} />
            100% Non-Custodial
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} style={{ color: '#6366f1' }} />
            Up to 65% Gas Savings
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onOpenWhitepaperModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
            }}
          >
            <BookOpen size={13} style={{ color: '#38bdf8' }} />
            <span>Whitepaper</span>
          </button>

          <button
            type="button"
            onClick={onOpenContractModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
            }}
          >
            <Zap size={13} style={{ color: '#10a37f' }} />
            <span>Contract</span>
          </button>

          <a
            href={`https://scan.botchain.ai/address/${contractAddress}`}
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#10a37f',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>BotScan Verified Contract</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </footer>
  );
};
