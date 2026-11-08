import React, { useState } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  usePublicClient,
} from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { encodeFunctionData } from 'viem';
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
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { AIRDROP_DISTRIBUTOR_ABI, ERC20_ABI } from '../contracts/distributorAbi';
import { formatTokenAmount, downloadCSV } from '../utils/formatters';
import { getExplorerTxUrl, getNetworkDisplayName } from '../config/chain';
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
  const { address: userAddress, isConnected } = useAccount();
  const { open } = useAppKit();
  const publicClient = usePublicClient();

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

  // Helper to ensure MetaMask is on BotChain Mainnet (677) and get active account without triggering extension bugs
  const ensureConnectedAndAuthorized = async (): Promise<`0x${string}` | null> => {
    let candidate: `0x${string}` | null = userAddress || null;

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      // 1. If ethereum.selectedAddress is already available, use it directly
      if (ethereum.selectedAddress) {
        candidate = ethereum.selectedAddress as `0x${string}`;
      }

      // 2. Silently check existing authorized accounts (does NOT trigger popup or "wallet must has at least one account" bug)
      try {
        const accounts: string[] = await ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          candidate = accounts[0] as `0x${string}`;
        }
      } catch (silentErr) {
        console.warn('Silent eth_accounts check warning:', silentErr);
      }

      // 3. Only prompt for accounts if no account is found anywhere
      if (!candidate) {
        try {
          const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            candidate = accounts[0] as `0x${string}`;
          }
        } catch (reqErr: any) {
          console.warn('eth_requestAccounts warning:', reqErr);
        }
      }

      // 4. Ensure Chain ID is 677 (0x2a5)
      try {
        const currentChainId = await ethereum.request({ method: 'eth_chainId' });
        if (currentChainId && currentChainId.toString().toLowerCase() !== '0x2a5') {
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2a5' }],
            });
          } catch (switchErr: any) {
            if (switchErr.code === 4902) {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x2a5',
                  chainName: 'BotChain Mainnet',
                  nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
                  rpcUrls: ['https://rpc.botchain.ai'],
                  blockExplorerUrls: ['https://scan.botchain.ai'],
                }],
              });
            }
          }
        }
      } catch (chainErr) {
        console.warn('Network check warning:', chainErr);
      }
    }

    return candidate || userAddress || null;
  };

  // Helper to execute wagmi contract write
  const executeWithWagmi = async (batch: DistributionBatch, sender: `0x${string}`): Promise<`0x${string}`> => {
    if (tokenMode === 'ERC20') {
      return await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: AIRDROP_DISTRIBUTOR_ABI,
        functionName: 'airdropERC20',
        args: [
          tokenMetadata!.address,
          batch.recipients as `0x${string}`[],
          batch.amounts,
        ],
        account: sender as `0x${string}`,
        chainId: 677,
      });
    } else {
      return await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: AIRDROP_DISTRIBUTOR_ABI,
        functionName: 'airdropNative',
        args: [
          batch.recipients as `0x${string}`[],
          batch.amounts,
        ],
        value: batch.totalWei,
        account: sender as `0x${string}`,
        chainId: 677,
      });
    }
  };

  // Handle Token Approval
  const handleApprove = async () => {
    if (!tokenMetadata?.address || !contractAddress) return;
    setIsApproving(true);
    setGlobalError(null);

    try {
      const activeSender = await ensureConnectedAndAuthorized();
      if (!activeSender) {
        setGlobalError('Please connect or unlock MetaMask.');
        setIsApproving(false);
        return;
      }

      let hash: `0x${string}`;

      try {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const ethereum = (window as any).ethereum;
          const data = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [contractAddress as `0x${string}`, totalTokensWei],
          });

          hash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: activeSender,
              to: tokenMetadata.address,
              data,
              value: '0x0',
            }],
          });
        } else {
          hash = await writeContractAsync({
            address: tokenMetadata.address,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [contractAddress as `0x${string}`, totalTokensWei],
            account: activeSender as `0x${string}`,
            chainId: 677,
          });
        }
      } catch (providerErr: any) {
        console.warn('Direct approve error, trying writeContractAsync fallback:', providerErr);
        hash = await writeContractAsync({
          address: tokenMetadata.address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddress as `0x${string}`, totalTokensWei],
          account: activeSender as `0x${string}`,
          chainId: 677,
        });
      }

      console.log('Approval transaction submitted:', hash);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      await refetchAllowance();
    } catch (err: any) {
      console.error('Approval failed:', err);
      const rawMsg = err.shortMessage || err.message || 'Approval rejected or failed';
      let friendlyError = rawMsg;
      if (
        rawMsg.includes('at least one account') ||
        rawMsg.includes('not been authorized') ||
        err.code === 4001 ||
        err.code === 4100
      ) {
        friendlyError =
          'MetaMask connection check: Please unlock MetaMask or click Reconnect to refresh your account session.';
      }
      setGlobalError(friendlyError);
    } finally {
      setIsApproving(false);
      await refetchAllowance();
    }
  };

  // Execute Batches Sequentially
  const handleExecuteAllBatches = async () => {
    // 1. Check wallet connection
    if (!isConnected && !(typeof window !== 'undefined' && (window as any).ethereum)) {
      setGlobalError('Wallet is not connected. Please connect your wallet to authorize transaction execution.');
      open();
      return;
    }

    // 2. Check contract address
    if (!contractAddress) {
      setGlobalError('Please configure a distributor contract address first');
      return;
    }

    setIsExecuting(true);
    setGlobalError(null);

    let activeSender: `0x${string}` | null = null;
    try {
      activeSender = await ensureConnectedAndAuthorized();
    } catch (authErr: any) {
      console.error('Wallet authorization error:', authErr);
      setGlobalError('Please unlock MetaMask to execute distributions.');
      setIsExecuting(false);
      return;
    }

    if (!activeSender) {
      setGlobalError('Unable to detect active wallet account. Please unlock or connect MetaMask.');
      setIsExecuting(false);
      return;
    }

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

        try {
          if (typeof window !== 'undefined' && (window as any).ethereum) {
            const ethereum = (window as any).ethereum;
            const data = encodeFunctionData({
              abi: AIRDROP_DISTRIBUTOR_ABI,
              functionName: tokenMode === 'ERC20' ? 'airdropERC20' : 'airdropNative',
              args: tokenMode === 'ERC20'
                ? [tokenMetadata!.address, batch.recipients as `0x${string}`[], batch.amounts]
                : [batch.recipients as `0x${string}`[], batch.amounts],
            });

            hash = await ethereum.request({
              method: 'eth_sendTransaction',
              params: [{
                from: activeSender,
                to: contractAddress,
                data,
                value: tokenMode === 'NATIVE' ? ('0x' + batch.totalWei.toString(16)) : '0x0',
              }],
            });
          } else {
            hash = await executeWithWagmi(batch, activeSender);
          }
        } catch (directErr: any) {
          console.warn('Direct execution send failed, attempting fallback:', directErr);
          hash = await executeWithWagmi(batch, activeSender);
        }

        // Wait for on-chain block receipt before marking success and moving to next batch
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        updatedBatches[i].status = 'success';
        updatedBatches[i].txHash = hash;
        setBatches([...updatedBatches]);
      } catch (err: any) {
        console.error(`Batch ${i + 1} execution failed:`, err);
        const rawMsg = err.shortMessage || err.message || 'Transaction rejected';
        const isAuthError =
          err.code === 4100 ||
          err?.cause?.code === 4100 ||
          err.code === 4001 ||
          rawMsg.includes('not been authorized') ||
          rawMsg.includes('at least one account') ||
          rawMsg.includes('Unauthorized');

        let friendlyError = rawMsg;
        if (isAuthError) {
          friendlyError =
            'MetaMask transaction authorization needed. Please check your MetaMask window and approve the transaction prompt.';
        }

        updatedBatches[i].status = 'failed';
        updatedBatches[i].errorMessage = friendlyError;
        setBatches([...updatedBatches]);
        setGlobalError(`Execution paused at Batch ${i + 1}: ${friendlyError}`);
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
            padding: '16px 20px',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <span>{globalError}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setGlobalError(null);
                  open();
                }}
                style={{ fontSize: '0.82rem', padding: '6px 14px', whiteSpace: 'nowrap' }}
              >
                <RefreshCw size={13} />
                <span>Reconnect Wallet</span>
              </button>
            </div>
          </div>
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
                  href={getExplorerTxUrl(batch.txHash)}
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
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> Confirmed
                </span>
              )}
              {batch.status === 'pending' && (
                <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <Loader2 size={16} className="animate-spin" /> Confirming...
                </span>
              )}
              {batch.status === 'failed' && (
                <span style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={16} /> Failed
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
      {!contractAddress && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fbbf24',
            fontSize: '0.86rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>
            No distributor contract address configured. Click "Set Distributor Contract" in the top bar to input your contract address, or deploy one via terminal.
          </span>
        </div>
      )}

      {!isAllComplete ? (
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {!isConnected ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => open()}
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
            >
              <Wallet size={18} />
              <span>Connect Wallet to Execute</span>
            </button>
          ) : (
            <>
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
            </>
          )}
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
            All {validRecords.length} recipients received their allocations on {getNetworkDisplayName()}.
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
