import { formatUnits } from 'viem';
import type { RecipientRecord, DistributionBatch } from '../types';

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length < chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatTokenAmount(amountWei: bigint, decimals = 18, maxDecimals = 4): string {
  try {
    const formatted = formatUnits(amountWei, decimals);
    const parts = formatted.split('.');
    if (parts.length === 1) return parts[0];
    const integerPart = parts[0];
    const fractionalPart = parts[1].substring(0, maxDecimals);
    return `${integerPart}.${fractionalPart}`;
  } catch {
    return '0';
  }
}

/**
 * Automatically divides large recipient lists into safe batch chunks
 * to guarantee transactions stay well below EVM block gas limits.
 */
export function chunkRecipientsIntoBatches(
  validRecords: RecipientRecord[],
  chunkSize = 100
): DistributionBatch[] {
  const batches: DistributionBatch[] = [];
  const total = validRecords.length;

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = validRecords.slice(i, i + chunkSize);
    const recipients = chunk.map((r) => r.address);
    const amounts = chunk.map((r) => r.parsedAmountWei || 0n);
    const totalWei = amounts.reduce((acc, curr) => acc + curr, 0n);

    batches.push({
      batchIndex: Math.floor(i / chunkSize) + 1,
      recipients,
      amounts,
      totalWei,
      status: 'idle',
    });
  }

  return batches;
}

/**
 * Triggers a browser download of CSV data
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
