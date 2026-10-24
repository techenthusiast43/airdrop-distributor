import React, { useRef, useState } from 'react';
import { UploadCloud, Trash2, Sliders, AlertTriangle } from 'lucide-react';
import type { RecipientRecord } from '../types';

interface RecipientInputProps {
  rawText: string;
  onRawTextChange: (text: string) => void;
  duplicateMode: 'merge' | 'deduplicate' | 'keep';
  onDuplicateModeChange: (mode: 'merge' | 'deduplicate' | 'keep') => void;
  records: RecipientRecord[];
  onClear: () => void;
}

export const RecipientInput: React.FC<RecipientInputProps> = ({
  rawText,
  onRawTextChange,
  duplicateMode,
  onDuplicateModeChange,
  records,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onRawTextChange(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const validCount = records.filter((r) => r.status === 'valid').length;
  const invalidCount = records.filter((r) => r.status === 'invalid').length;
  const duplicateCount = records.filter((r) => r.status === 'duplicate').length;

  return (
    <div className="glass-panel card-section">
      <div className="section-header">
        <h2 className="section-title">
          <UploadCloud size={22} style={{ color: 'var(--accent-primary)' }} />
          <span>2. Upload Recipients & Allocations</span>
        </h2>
        {records.length > 0 && (
          <button
            type="button"
            className="btn-outline-danger"
            onClick={onClear}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={14} />
            <span>Clear List</span>
          </button>
        )}
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        className={`dropzone ${isDragOver ? 'dragover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ marginBottom: '20px' }}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".csv,.txt"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
        <UploadCloud size={38} className="dropzone-icon" />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px' }}>
          Drop your allocation CSV or TXT file here
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Supports comma, semicolon, tab, or space-separated files (Format: <code>address,amount</code>)
        </p>
      </div>

      {/* Manual Paste Box */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="input-label" style={{ marginBottom: 0 }}>
            Or Paste Addresses & Amounts Directly
          </label>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            One entry per line
          </span>
        </div>
        <textarea
          className="textarea-input"
          placeholder="0x1234567890abcdef1234567890abcdef12345678, 100&#10;0xabcdef1234567890abcdef1234567890abcdef12, 250"
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
        />
      </div>

      {/* Duplicate Strategy Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 18px',
          background: 'rgba(11, 17, 33, 0.6)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 600 }}>
          <Sliders size={16} style={{ color: 'var(--accent-secondary)' }} />
          <span>Duplicate Address Handling</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn-secondary ${duplicateMode === 'merge' ? 'active' : ''}`}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderColor: duplicateMode === 'merge' ? 'var(--accent-primary)' : undefined,
              color: duplicateMode === 'merge' ? '#818cf8' : undefined,
            }}
            onClick={() => onDuplicateModeChange('merge')}
          >
            Merge Amounts (Sum)
          </button>
          <button
            type="button"
            className={`btn-secondary ${duplicateMode === 'deduplicate' ? 'active' : ''}`}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderColor: duplicateMode === 'deduplicate' ? 'var(--accent-primary)' : undefined,
              color: duplicateMode === 'deduplicate' ? '#818cf8' : undefined,
            }}
            onClick={() => onDuplicateModeChange('deduplicate')}
          >
            Remove Duplicates
          </button>
          <button
            type="button"
            className={`btn-secondary ${duplicateMode === 'keep' ? 'active' : ''}`}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderColor: duplicateMode === 'keep' ? 'var(--accent-primary)' : undefined,
              color: duplicateMode === 'keep' ? '#818cf8' : undefined,
            }}
            onClick={() => onDuplicateModeChange('keep')}
          >
            Keep All (Warn)
          </button>
        </div>
      </div>

      {/* Live Validation Counter Badges */}
      {records.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card valid">
            <div className="stat-card-title">Valid Recipients</div>
            <div className="stat-card-value">{validCount}</div>
          </div>
          <div className="stat-card invalid">
            <div className="stat-card-title">Invalid Entries</div>
            <div className="stat-card-value">{invalidCount}</div>
          </div>
          <div className="stat-card duplicate">
            <div className="stat-card-title">Duplicates Flagged</div>
            <div className="stat-card-value">{duplicateCount}</div>
          </div>
          <div className="stat-card total">
            <div className="stat-card-title">Total Lines Processed</div>
            <div className="stat-card-value">{records.length}</div>
          </div>
        </div>
      )}

      {invalidCount > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          <span>
            {invalidCount} recipient {invalidCount === 1 ? 'entry contains' : 'entries contain'} invalid address formats or non-positive amounts and will be excluded.
          </span>
        </div>
      )}
    </div>
  );
};
