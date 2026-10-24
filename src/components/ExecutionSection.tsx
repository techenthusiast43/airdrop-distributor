import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  RotateCcw,
  Loader2,
  ShieldCheck,
  Fuel,
} from 'lucide-react';
import { AIRDROP_DISTRIBUTOR_ABI, ERC20_ABI } from '../contracts/distributorAbi';
import { formatTokenAmount, downloadCSV } from '../utils/formatters';
import type { TokenMode, TokenMetadata, DistributionBatch, RecipientRecord } from '../types';

interface ExecutionSectionProps {
  contractAddress: string;
  tokenMode: TokenMode;
  tokenMetadata: TokenMetadata | null;
  batches: DistributionBatch[];
  validRecords: RecipientRecord[];
  onReset: () => void;
}

export const ExecutionSection: React.FC<ExecutionSectionProps> = ({
  contractAddress,
  tokenMode,
  tokenMetadata,
  batches: initialBatches,
  validRecords,
  onReset,
}) => {
  const { address: userAddress } = useAccount();
  const [batches, setBatches] = useState<DistributionBatch[]>(initialBatches);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const decimals = tokenMode === 'ERC20' ? tokenMetadata?.decimals || 18 : 18;
  const symbol = tokenMode === 'ERC20' ? tokenMetadata?.symbol || 'TOKENS' : 'BOT';
  const totalTokensWei = validRecords.reduce((acc, curr) => acc + (curr.parsedAmountWei || 0n), 0n);

  const { writeContractAsync } = useWriteContract();

  // Read current token allowance for ERC-20
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenMode === 'ERC20' ? tokenMetadata?.address : undefined,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress && contractAddress ? [userAddress, contractAddress as `0x${string}`] : undefined,
    query: {
      enabled: tokenMode === 'ERC20' && Boolean(tokenMetadata?.address) && Boolean(contractAddress) && Boolean(userAddress),
    },
  });

  const isAllowanceSufficient = tokenMode === 'NATIVE' || (allowance !== undefined && allowance >= totalTokensWei);

  // Handle Token Approval
  const handleApprove = async () => {
    if (!tokenMetadata?.address || !contractAddress) return;
    setIsApproving(true);
    setGlobalError(null);

    try {
      const hash = await writeContractAsync({
        address: tokenMetadata.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contractAddress as `0x${string}`, totalTokensWei],
      });

      console.log('Approval transaction submitted:', hash);
      await refetchAllowance();
    } catch (err: any) {
      console.error('Approval failed:', err);
      setGlobalError(err.shortMessage || err.message || 'Approval rejected or failed');
    } finally {
      setIsApproving(false);
      await refetchAllowance();
    }
  };

  // Execute Batches Sequentially
  const handleExecuteAllBatches = async () => {
    if (!contractAddress) {
      setGlobalError('Please configure a distributor contract address first');
      return;
    }

    setIsExecuting(true);
    setGlobalError(null);

    const updatedBatches = [...batches];

    for (let i = 0; i < updatedBatches.length; i++) {
      if (updatedBatches[i].status === 'success') {
        continue; // Already processed
      }

      setCurrentBatchIndex(i);
      updatedBatches[i].status = 'pending';
      setBatches([...updatedBatches]);

      const batch = updatedBatches[i];

      try {
        let hash: `0x${string}`;

        if (tokenMode === 'ERC20') {
          hash = await writeContractAsync({
            address: contractAddress as `0x${string}`,
            abi: AIRDROP_DISTRIBUTOR_ABI,
            functionName: 'airdropERC20',
            args: [
              tokenMetadata!.address,
              batch.recipients as `0x${string}`[],
              batch.amounts,
            ],
          });
        } else {
          hash = await writeContractAsync({
            address: contractAddress as `0x${string}`,
            abi: AIRDROP_DISTRIBUTOR_ABI,
            functionName: 'airdropNative',
            args: [
              batch.recipients as `0x${string}`[],
              batch.amounts,
            ],
            value: batch.totalWei,
          });
        }

        updatedBatches[i].status = 'success';
        updatedBatches[i].txHash = hash;
        setBatches([...updatedBatches]);
      } catch (err: any) {
        console.error(`Batch ${i + 1} execution failed:`, err);
        updatedBatches[i].status = 'failed';
        updatedBatches[i].errorMessage = err.shortMessage || err.message || 'Transaction rejected';
        setBatches([...updatedBatches]);
        setGlobalError(`Execution paused at Batch ${i + 1}: ${updatedBatches[i].errorMessage}`);
        setIsExecuting(false);
        return;
      }
    }

    setIsExecuting(false);
  };

  // Download Distribution Receipt CSV
  const handleExportReceipt = () => {
    let csv = 'recipient_address,amount,token_symbol,tx_hash,status\n';
    batches.forEach((batch) => {
      batch.recipients.forEach((rec, idx) => {
        const amtWei = batch.amounts[idx];
        const amtFormatted = formatTokenAmount(amtWei, decimals, 4);
        csv += `${rec},${amtFormatted},${symbol},${batch.txHash || 'N/A'},${batch.status}\n`;
      });
    });
    downloadCSV(`airdrop-report-${symbol}-${Date.now()}.csv`, csv);
  };

  const completedBatchesCount = batches.filter((b) => b.status === 'success').length;
  const isAllComplete = completedBatchesCount === batches.length && batches.length > 0;
  const progressPercent = Math.round((completedBatchesCount / (batches.length || 1)) * 100);

  return (
    <div className="glass-panel card-section">
      <div className="section-header">
        <h2 className="section-title">
          <Send size={22} style={{ color: 'var(--accent-primary)' }} />
          <span>4. Execute On-Chain Batch Distribution</span>
        </h2>
      </div>

      {globalError && (
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
          <span>{globalError}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
          <span>Distribution Progress ({completedBatchesCount} of {batches.length} batches confirmed)</span>
          <span style={{ fontWeight: 700, color: '#38bdf8' }}>{progressPercent}%</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Batches List */}
      <div style={{ marginBottom: '28px' }}>
        {batches.map((batch, idx) => (
          <div
            key={batch.batchIndex}
            className={`batch-card ${currentBatchIndex === idx && isExecuting ? 'active' : ''} ${batch.status === 'success' ? 'completed' : ''}`}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                  Batch #{batch.batchIndex} ({batch.recipients.length} Recipients)
                </span>
                <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
                  {formatTokenAmount(batch.totalWei, decimals, 4)} {symbol}
                </span>
              </div>
              {batch.txHash && (
                <a
                  href={`https://scan.bohr.life/tx/${batch.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '0.78rem',
                    color: '#10b981',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none',
                  }}
                >
                  <span>Tx: {batch.txHash.slice(0, 14)}...{batch.txHash.slice(-8)}</span>
                  <ExternalLink size={12} />
                </a>
              )}
              {batch.errorMessage && (
                <span style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>
                  Error: {batch.errorMessage}
                </span>
              )}
            </div>

            <div>
              {batch.status === 'success' && (
                <span className="status-pill valid">
                  <CheckCircle2 size={13} />
                  <span>Confirmed</span>
                </span>
              )}
              {batch.status === 'pending' && (
                <span className="status-pill" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Processing...</span>
                </span>
              )}
              {batch.status === 'failed' && (
                <span className="status-pill invalid">
                  <AlertCircle size={13} />
                  <span>Failed</span>
                </span>
              )}
              {batch.status === 'idle' && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Queued
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Controls */}
      {!isAllComplete ? (
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {tokenMode === 'ERC20' && !isAllowanceSufficient && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleApprove}
              disabled={isApproving || isExecuting}
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              {isApproving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              <span>Step 1: Approve {formatTokenAmount(totalTokensWei, decimals, 4)} {symbol}</span>
            </button>
          )}

          <button
            type="button"
            className="btn-primary"
            onClick={handleExecuteAllBatches}
            disabled={!isAllowanceSufficient || isExecuting || batches.length === 0}
          >
            {isExecuting ? <Loader2 size={18} className="animate-spin" /> : <Fuel size={18} />}
            <span>
              {tokenMode === 'ERC20' ? 'Step 2: ' : ''}
              Execute Batch Distribution ({batches.length} {batches.length === 1 ? 'Tx' : 'Txs'})
            </span>
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: '24px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', color: '#10b981', marginBottom: '12px' }}>
            <CheckCircle2 size={36} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px' }}>
            Airdrop Completed Successfully!
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            All {validRecords.length} recipients received their allocations on Bohr Chain.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
            <button type="button" className="btn-secondary" onClick={handleExportReceipt}>
              <Download size={16} />
              <span>Export Distribution Report (CSV)</span>
            </button>
            <button type="button" className="btn-primary" onClick={onReset}>
              <RotateCcw size={16} />
              <span>New Distribution</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
