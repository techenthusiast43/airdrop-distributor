import React, { useState } from 'react';
import { isAddress, getAddress } from 'viem';
import { X, Check, AlertCircle, Terminal, ExternalLink } from 'lucide-react';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: string;
  onSaveAddress: (newAddress: string) => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  onSaveAddress,
}) => {
  const [inputVal, setInputVal] = useState(currentAddress);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) {
      setError('Please provide a valid contract address');
      return;
    }
    if (!isAddress(trimmed)) {
      setError('Invalid EVM contract address');
      return;
    }
    try {
      const checksum = getAddress(trimmed);
      onSaveAddress(checksum);
      onClose();
    } catch {
      setError('Invalid checksum address');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Airdrop Distributor Contract</h2>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Specify the deployed <code>AirdropDistributor</code> smart contract on Bohr Chain (Chain ID: 968).
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label className="input-label">Contract Address</label>
          <input
            type="text"
            className="text-input"
            placeholder="0x..."
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              setError(null);
            }}
          />
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} />
              {error}
            </p>
          )}
        </div>

        {currentAddress && (
          <div style={{ marginBottom: '20px' }}>
            <a
              href={`https://scan.bohr.life/address/${currentAddress}`}
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
              <span>View on BohrScan Explorer</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        <div
          style={{
            padding: '14px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
            <Terminal size={16} />
            <span>Deploy via Terminal</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            To deploy using your private key in <code>.env</code>, run:
          </p>
          <div
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: '#090d16',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: '#38bdf8',
            }}
          >
            npm run deploy
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <Check size={16} />
            Save Contract
          </button>
        </div>
      </div>
    </div>
  );
};
