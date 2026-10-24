import { isAddress, getAddress, parseUnits } from 'viem';
import type { RecipientRecord } from '../types';

export interface ParseOptions {
  decimals: number;
  duplicateHandling: 'merge' | 'deduplicate' | 'keep';
}

/**
 * Parses raw text or CSV content into structured RecipientRecords
 */
export function parseRecipientsInput(
  rawContent: string,
  options: ParseOptions
): RecipientRecord[] {
  if (!rawContent || !rawContent.trim()) {
    return [];
  }

  const lines = rawContent.split(/\r?\n/);
  const rawRecords: { address: string; amount: string; originalLine: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip CSV header line if present (e.g. "address,amount" or "wallet,tokens")
    const lower = line.toLowerCase();
    if (
      i === 0 &&
      (lower.includes('address') || lower.includes('wallet') || lower.includes('recipient')) &&
      (lower.includes('amount') || lower.includes('token') || lower.includes('balance') || lower.includes('value'))
    ) {
      continue;
    }

    // Split by comma, semicolon, tab, or whitespace
    // Handles lines like: "0x123...abc, 100", "0x123...abc 100", "0x123...abc;100"
    const parts = line.split(/[,;\t\s]+/).filter(Boolean);
    if (parts.length >= 2) {
      const address = parts[0].trim();
      const amount = parts[1].trim();
      rawRecords.push({ address, amount, originalLine: i + 1 });
    } else if (parts.length === 1) {
      // If user pasted just address, default to 0 or flag invalid
      rawRecords.push({ address: parts[0].trim(), amount: '0', originalLine: i + 1 });
    }
  }

  // Handle Duplicates according to option
  const seenMap = new Map<string, { totalAmount: number; count: number; firstIndex: number }>();

  // Pass 1: analyze addresses
  const processedRecords: RecipientRecord[] = [];

  for (let idx = 0; idx < rawRecords.length; idx++) {
    const item = rawRecords[idx];
    const rawAddr = item.address;
    const rawAmt = item.amount;
    const isValidAddr = isAddress(rawAddr);

    let parsedAddr = rawAddr;
    let checksumAddr = rawAddr.toLowerCase();
    if (isValidAddr) {
      try {
        parsedAddr = getAddress(rawAddr);
        checksumAddr = parsedAddr.toLowerCase();
      } catch {
        // fallback
      }
    }

    // Validate amount
    const numAmt = parseFloat(rawAmt);
    const isValidAmt = !isNaN(numAmt) && numAmt > 0;

    let parsedWei: bigint | undefined = undefined;
    let error: string | undefined = undefined;

    if (!isValidAddr) {
      error = 'Invalid EVM wallet address format';
    } else if (!isValidAmt) {
      error = 'Amount must be a positive number';
    } else {
      try {
        parsedWei = parseUnits(rawAmt, options.decimals);
      } catch (err: any) {
        error = `Invalid decimal precision: ${err.message || 'Error parsing amount'}`;
      }
    }

    const record: RecipientRecord = {
      id: `row-${idx}-${item.address.slice(0, 6)}`,
      address: parsedAddr,
      amount: rawAmt,
      parsedAmountWei: parsedWei,
      status: error ? 'invalid' : 'valid',
      error,
    };

    if (isValidAddr) {
      const stats = seenMap.get(checksumAddr) || { totalAmount: 0, count: 0, firstIndex: idx };
      stats.count += 1;
      if (isValidAmt) {
        stats.totalAmount += numAmt;
      }
      seenMap.set(checksumAddr, stats);
    }

    processedRecords.push(record);
  }

  // Pass 2: Duplicate Handling
  if (options.duplicateHandling === 'deduplicate') {
    const seen = new Set<string>();
    return processedRecords.filter((rec) => {
      if (rec.status === 'invalid') return true;
      const lower = rec.address.toLowerCase();
      if (seen.has(lower)) {
        return false;
      }
      seen.add(lower);
      return true;
    });
  }

  if (options.duplicateHandling === 'merge') {
    const mergedList: RecipientRecord[] = [];
    const addedAddresses = new Set<string>();

    for (const rec of processedRecords) {
      if (rec.status === 'invalid') {
        mergedList.push(rec);
        continue;
      }

      const lower = rec.address.toLowerCase();
      const stats = seenMap.get(lower);

      if (stats && stats.count > 1) {
        if (!addedAddresses.has(lower)) {
          addedAddresses.add(lower);
          const mergedAmtStr = stats.totalAmount.toString();
          let mergedWei: bigint | undefined = undefined;
          try {
            mergedWei = parseUnits(mergedAmtStr, options.decimals);
          } catch {
            // fallback
          }

          mergedList.push({
            id: `merged-${lower}`,
            address: rec.address,
            amount: mergedAmtStr,
            parsedAmountWei: mergedWei,
            status: 'valid',
          });
        }
      } else {
        mergedList.push(rec);
      }
    }
    return mergedList;
  }

  // Default: 'keep' - Mark duplicates with warning status if count > 1
  return processedRecords.map((rec) => {
    if (rec.status === 'invalid') return rec;
    const lower = rec.address.toLowerCase();
    const stats = seenMap.get(lower);
    if (stats && stats.count > 1) {
      return {
        ...rec,
        status: 'duplicate',
        error: `Duplicate address (appears ${stats.count} times)`,
      };
    }
    return rec;
  });
}
