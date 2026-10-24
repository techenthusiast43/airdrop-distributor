import { useState } from 'react';
import { Layers, Search, Trash, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatTokenAmount } from '../utils/formatters';
import type { RecipientRecord, TokenMode, TokenMetadata, DistributionBatch } from '../types';

interface ReviewSectionProps {
  records: RecipientRecord[];
  onRemoveRecord: (id: string) => void;
  tokenMode: TokenMode;
  tokenMetadata: TokenMetadata | null;
  nativeBalanceWei: bigint;
  batches: DistributionBatch[];
  onProceedToExecution: () => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  records,
  onRemoveRecord,
  tokenMode,
  tokenMetadata,
  nativeBalanceWei,
  batches,
  onProceedToExecution,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const validRecords = records.filter((r) => r.status === 'valid');
  const totalWei = validRecords.reduce((acc, curr) => acc + (curr.parsedAmountWei || 0n), 0n);

  const decimals = tokenMode === 'ERC20' ? tokenMetadata?.decimals || 18 : 18;
  const symbol = tokenMode === 'ERC20' ? tokenMetadata?.symbol || 'TOKENS' : 'BOT';

  const userBalanceWei = tokenMode === 'ERC20' ? tokenMetadata?.balance || 0n : nativeBalanceWei;
  const isInsufficientBalance = totalWei > userBalanceWei;

  const filteredRecords = records.filter((r) =>
    r.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="glass-panel card-section">
      <div className="section-header">
        <h2 className="section-title">
          <Layers size={22} style={{ color: 'var(--accent-secondary)' }} />
          <span>3. Review & Gas Batching Allocation</span>
        </h2>
      </div>

      {/* Summary Allocation Callout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="stat-card" style={{ background: 'rgba(99, 102, 241, 0.08)', borderColor: 'var(--border-glow)' }}>
          <div className="stat-card-title">Total Required Tokens</div>
          <div className="stat-card-value" style={{ color: '#38bdf8' }}>
            {formatTokenAmount(totalWei, decimals, 4)} {symbol}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            For {validRecords.length} valid recipient addresses
          </div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="stat-card-title">Available Wallet Balance</div>
          <div className="stat-card-value" style={{ color: isInsufficientBalance ? 'var(--danger)' : '#10b981' }}>
            {formatTokenAmount(userBalanceWei, decimals, 4)} {symbol}
          </div>
          <div style={{ fontSize: '0.78rem', color: isInsufficientBalance ? 'var(--danger)' : 'var(--text-dim)', marginTop: '4px' }}>
            {isInsufficientBalance ? 'Insufficient token balance' : 'Sufficient balance available'}
          </div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="stat-card-title">Smart Contract Batches</div>
          <div className="stat-card-value" style={{ color: '#818cf8' }}>
            {batches.length} {batches.length === 1 ? 'Transaction' : 'Transactions'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Auto-chunked (100 per tx) for block gas safety
          </div>
        </div>
      </div>

      {isInsufficientBalance && (
        <div
          style={{
            padding: '14px 18px',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} />
          <span>
            You need <strong>{formatTokenAmount(totalWei, decimals, 4)} {symbol}</strong>, but your wallet only holds <strong>{formatTokenAmount(userBalanceWei, decimals, 4)} {symbol}</strong>. Please deposit more tokens before executing.
          </span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="text-input"
            style={{ paddingLeft: '36px', fontSize: '0.84rem' }}
            placeholder="Search address..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing {paginatedRecords.length} of {filteredRecords.length} entries
        </div>
      </div>

      {/* Recipient Table */}
      <div className="table-container" style={{ marginBottom: '20px' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th>Recipient Address</th>
              <th>Amount ({symbol})</th>
              <th>Validation</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                  No recipients found matching your filter
                </td>
              </tr>
            ) : (
              paginatedRecords.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-dim)' }}>{(page - 1) * pageSize + idx + 1}</td>
                  <td>
                    <span title={item.address}>{item.address}</span>
                  </td>
                  <td style={{ color: '#38bdf8', fontWeight: 600 }}>{item.amount}</td>
                  <td>
                    <span className={`status-pill ${item.status}`}>
                      {item.status === 'valid' && <CheckCircle2 size={12} />}
                      {item.status === 'invalid' && <AlertCircle size={12} />}
                      {item.status === 'duplicate' && <AlertCircle size={12} />}
                      <span>{item.status.toUpperCase()}</span>
                    </span>
                    {item.error && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--danger)', marginLeft: '8px' }}>
                        {item.error}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onRemoveRecord(item.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      title="Remove from list"
                    >
                      <Trash size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            disabled={page === 1}
            onClick={() => setPage((p: number) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            disabled={page === totalPages}
            onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn-primary"
          disabled={validRecords.length === 0 || isInsufficientBalance}
          onClick={onProceedToExecution}
        >
          <span>Continue to Batch Execution</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
