import { useState, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Web3Provider } from './config/web3';
import { Navbar } from './components/Navbar';
import { ContractModal } from './components/ContractModal';
import { WhitepaperModal } from './components/WhitepaperModal';
import { TokenSelector } from './components/TokenSelector';
import { RecipientInput } from './components/RecipientInput';
import { ReviewSection } from './components/ReviewSection';
import { ExecutionSection } from './components/ExecutionSection';
import { parseRecipientsInput } from './utils/parser';
import { chunkRecipientsIntoBatches } from './utils/formatters';
import type { TokenMode, TokenMetadata } from './types';
import { ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react';

function AirdropApp() {
  const { address } = useAccount();
  const { data: balanceData } = useBalance({ address });

  // 1. Contract Address State
  const defaultEnvContract = import.meta.env.VITE_DISTRIBUTOR_CONTRACT_ADDRESS || '';
  const [contractAddress, setContractAddress] = useState<string>(() => {
    return localStorage.getItem('bohr_distributor_address') || defaultEnvContract;
  });
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isWhitepaperModalOpen, setIsWhitepaperModalOpen] = useState(false);

  // 2. Asset & Token State
  const [tokenMode, setTokenMode] = useState<TokenMode>('ERC20');
  const [tokenAddressInput, setTokenAddressInput] = useState('');
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);

  // 3. Recipients State (Empty by default - NO mock data)
  const [rawText, setRawText] = useState('');
  const [duplicateMode, setDuplicateMode] = useState<'merge' | 'deduplicate' | 'keep'>('merge');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Parse records dynamically based on decimals and duplicate strategy
  const decimals = tokenMode === 'ERC20' ? tokenMetadata?.decimals || 18 : 18;
  const records = useMemo(() => {
    return parseRecipientsInput(rawText, {
      decimals,
      duplicateHandling: duplicateMode,
    });
  }, [rawText, decimals, duplicateMode]);

  const validRecords = useMemo(() => {
    return records.filter((r) => r.status === 'valid');
  }, [records]);

  // Batch chunking (100 per batch)
  const batches = useMemo(() => {
    return chunkRecipientsIntoBatches(validRecords, 100);
  }, [validRecords]);

  // Handlers
  const handleSaveContract = (addr: string) => {
    setContractAddress(addr);
    localStorage.setItem('bohr_distributor_address', addr);
  };

  const handleClear = () => {
    setRawText('');
    setCurrentStep(1);
  };

  const handleRemoveRecord = (id: string) => {
    // Remove the record from rawText if possible, or filter
    const target = records.find((r) => r.id === id);
    if (!target) return;
    const lines = rawText.split(/\r?\n/);
    const filteredLines = lines.filter((line: string) => !line.includes(target.address));
    setRawText(filteredLines.join('\n'));
  };

  return (
    <div className="app-container">
      <Navbar
        contractAddress={contractAddress}
        onOpenContractModal={() => setIsContractModalOpen(true)}
        onOpenWhitepaperModal={() => setIsWhitepaperModalOpen(true)}
      />

      {/* Contract Warning Banner if unset */}
      {!contractAddress && (
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--warning-bg)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fbbf24',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} />
            <span style={{ fontSize: '0.88rem' }}>
              Distributor contract address not set. Deploy with <code>npm run deploy</code> or set your contract.
            </span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', borderColor: '#fbbf24', color: '#fbbf24' }}
            onClick={() => setIsContractModalOpen(true)}
          >
            Configure Contract
          </button>
        </div>
      )}

      {/* Steps Visual Tracker */}
      <div className="steps-tracker">
        <div
          className={`step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
          onClick={() => setCurrentStep(1)}
        >
          <div className="step-circle">1</div>
          <span className="step-label">Asset & Recipients</span>
        </div>
        <div
          className={`step-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
          onClick={() => validRecords.length > 0 && setCurrentStep(2)}
        >
          <div className="step-circle">2</div>
          <span className="step-label">Review & Validation</span>
        </div>
        <div
          className={`step-item ${currentStep === 3 ? 'active' : ''}`}
          onClick={() => validRecords.length > 0 && setCurrentStep(3)}
        >
          <div className="step-circle">3</div>
          <span className="step-label">Batch Execution</span>
        </div>
      </div>

      {/* Step 1: Asset Selection & Recipient Input */}
      {currentStep === 1 && (
        <div>
          <TokenSelector
            tokenMode={tokenMode}
            onSelectTokenMode={setTokenMode}
            tokenMetadata={tokenMetadata}
            onTokenMetadataChange={setTokenMetadata}
            tokenAddressInput={tokenAddressInput}
            onTokenAddressInputChange={setTokenAddressInput}
          />

          <RecipientInput
            rawText={rawText}
            onRawTextChange={setRawText}
            duplicateMode={duplicateMode}
            onDuplicateModeChange={setDuplicateMode}
            records={records}
            onClear={handleClear}
          />

          {validRecords.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setCurrentStep(2)}
              >
                <span>Review Allocations ({validRecords.length} Wallets)</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Review Table & Gas Batching */}
      {currentStep === 2 && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.84rem' }}
              onClick={() => setCurrentStep(1)}
            >
              <ArrowLeft size={16} />
              <span>Back to Edit Recipients</span>
            </button>
          </div>

          <ReviewSection
            records={records}
            onRemoveRecord={handleRemoveRecord}
            tokenMode={tokenMode}
            tokenMetadata={tokenMetadata}
            nativeBalanceWei={balanceData?.value || 0n}
            batches={batches}
            onProceedToExecution={() => setCurrentStep(3)}
          />
        </div>
      )}

      {/* Step 3: Sequential On-chain Execution */}
      {currentStep === 3 && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.84rem' }}
              onClick={() => setCurrentStep(2)}
            >
              <ArrowLeft size={16} />
              <span>Back to Review</span>
            </button>
          </div>

          <ExecutionSection
            contractAddress={contractAddress}
            tokenMode={tokenMode}
            tokenMetadata={tokenMetadata}
            batches={batches}
            validRecords={validRecords}
            onReset={handleClear}
          />
        </div>
      )}

      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        currentAddress={contractAddress}
        onSaveAddress={handleSaveContract}
      />

      <WhitepaperModal
        isOpen={isWhitepaperModalOpen}
        onClose={() => setIsWhitepaperModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <AirdropApp />
    </Web3Provider>
  );
}
