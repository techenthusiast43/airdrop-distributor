import React from 'react';
import { X, Download, ShieldCheck, Cpu, Layers, ExternalLink } from 'lucide-react';
import { downloadCSV } from '../utils/formatters';

interface WhitepaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhitepaperModal: React.FC<WhitepaperModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownloadWhitepaper = () => {
    fetch('/WHITEPAPER.md')
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .catch(() => {
        // Fallback text if public fetch doesn't resolve directly
        return '# BOT Airdrop Distributor Whitepaper\n\nVisit repository for full text.';
      })
      .then((content) => {
        downloadCSV('BOT-Airdrop-Distributor-Whitepaper.md', content);
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.svg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Protocol Whitepaper
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                BOT Airdrop Distributor v1.0.0 • Bohr Chain (Chain ID: 968)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDownloadWhitepaper}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              title="Download Markdown Whitepaper"
            >
              <Download size={14} />
              <span>Download .MD</span>
            </button>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div
          style={{
            padding: '28px',
            overflowY: 'auto',
            fontSize: '0.9rem',
            lineHeight: 1.7,
            color: '#cbd5e1',
          }}
        >
          {/* Executive Overview Badge Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              marginBottom: '28px',
            }}
          >
            <div style={{ padding: '14px 16px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 700, fontSize: '0.86rem', marginBottom: '4px' }}>
                <Cpu size={16} />
                <span>Gas Efficiency</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>~43.5% Savings</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Calldata + unchecked loop increments</div>
            </div>

            <div style={{ padding: '14px 16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '0.86rem', marginBottom: '4px' }}>
                <ShieldCheck size={16} />
                <span>100% Non-Custodial</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Zero Escrow</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Direct atomic transferFrom execution</div>
            </div>

            <div style={{ padding: '14px 16px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, fontSize: '0.86rem', marginBottom: '4px' }}>
                <Layers size={16} />
                <span>Batch Chunking</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>100 Wallets / Tx</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Immune to EVM block gas limit overflows</div>
            </div>
          </div>

          <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>
            1. Abstract
          </h3>
          <p style={{ marginBottom: '18px' }}>
            The <strong>BOT Airdrop Distributor Protocol</strong> provides a trustless, non-custodial batch dispersal mechanism engineered specifically for the Bohr Chain ecosystem (Chain ID 968). By leveraging EVM calldata arrays, low-level inline function selectors, and client-side deterministic batch chunking, the protocol eliminates the manual friction and high gas costs of individual wallet payments.
          </p>

          <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>
            2. The Distribution Bottleneck
          </h3>
          <p style={{ marginBottom: '18px' }}>
            Distributing tokens to hundreds or thousands of wallets traditionally presents severe problems:
          </p>
          <ul style={{ paddingLeft: '22px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Gas Multipliers:</strong> Sending 500 individual transactions incurs $500 \times 21,000 = 10,500,000$ base gas overhead alone.</li>
            <li><strong>Block Limit Reverts:</strong> Unchunked batch transfers that attempt to process over 200 wallets in one call inevitably exceed EVM block gas limits, causing transactions to revert.</li>
            <li><strong>Non-Standard Tokens:</strong> Tokens like USDT return void on <code>transferFrom</code>, which breaks standard Solidity contract interfaces.</li>
          </ul>

          <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>
            3. Smart Contract Implementation & Verification
          </h3>
          <p style={{ marginBottom: '12px' }}>
            The protocol is deployed and verified on Bohr Chain:
          </p>
          <div
            style={{
              padding: '14px 18px',
              background: '#090d16',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.84rem',
              marginBottom: '20px',
            }}
          >
            <div>Contract: <a href="https://scan.bohr.life/address/0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20</a></div>
            <div style={{ marginTop: '4px', color: 'var(--text-dim)' }}>Tx: 0x804a28118995dd1b2acc0110d27f721eca548e50e674919534b438c9af3fdcd9</div>
          </div>

          <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>
            4. Dual Support: ERC-20 & Native BOT
          </h3>
          <p style={{ marginBottom: '24px' }}>
            The protocol provides dedicated functions for both asset classes:
            <br />
            • <code>airdropERC20(address token, address[] recipients, uint256[] amounts)</code>: Pulls directly from user wallet via safe transferFrom.
            <br />
            • <code>airdropNative(address[] recipients, uint256[] amounts)</code>: Payable function that safely forwards native BOT and immediately refunds any overpaid value.
          </p>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.95)',
          }}
        >
          <a
            href="https://scan.bohr.life/address/0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20"
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#38bdf8',
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
            }}
          >
            <span>Verified on BohrScan</span>
            <ExternalLink size={13} />
          </a>

          <button type="button" className="btn-primary" onClick={onClose} style={{ padding: '8px 20px', fontSize: '0.88rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
