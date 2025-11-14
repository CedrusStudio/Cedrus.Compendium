export interface ReductionParseResult {
  total: number;         // suma całkowita (do weryfikacji)
  protection: number;    // pancerz/ochrona
  block: number;         // blok
  contextInfo?: string;  // dodatkowe info jak "(18 vs 1)"
}

/**
 * Parsuje redukcję z formatu:
 * - "16 [0]" → total: 16, protection: 0, block: 0 (reszta: parry+dodge)
 * - "17 [5]" → total: 17, protection: 5, block: 0 (reszta: parry+dodge)
 * - "25 [5+11]" → total: 25, protection: 5, block: 11 (reszta: parry+dodge)
 * - "17 (18 vs 1) [6]" → total: 17, protection: 6, contextInfo: "(18 vs 1)"
 */
export function parseReduction(raw: string | number): ReductionParseResult {
  if (typeof raw === 'number') {
    return { total: raw, protection: raw, block: 0 };
  }

  if (!raw || raw.trim().length === 0) {
    return { total: 0, protection: 0, block: 0 };
  }

  // Extract context info like "(18 vs 1)" if present
  let contextInfo: string | undefined;
  let cleanedRaw = raw;
  const contextMatch = raw.match(/\([^)]+\)/);
  if (contextMatch) {
    contextInfo = contextMatch[0];
    cleanedRaw = raw.replace(/\([^)]+\)/g, '').trim();
  }

  // Pattern: "25 [5+11]" → total: 25, protection: 5, block: 11
  const blockMatch = cleanedRaw.match(/(\d+)\s*\[(\d+)\+(\d+)\]/);
  if (blockMatch) {
    return {
      total: parseInt(blockMatch[1], 10),
      protection: parseInt(blockMatch[2], 10),
      block: parseInt(blockMatch[3], 10),
      contextInfo
    };
  }

  // Pattern: "17 [5]" → total: 17, protection: 5, block: 0
  const protectionMatch = cleanedRaw.match(/(\d+)\s*\[(\d+)\]/);
  if (protectionMatch) {
    return {
      total: parseInt(protectionMatch[1], 10),
      protection: parseInt(protectionMatch[2], 10),
      block: 0,
      contextInfo
    };
  }

  // Fallback: tylko liczba → wszystko w protection
  const simpleMatch = cleanedRaw.match(/(\d+)/);
  if (simpleMatch) {
    const value = parseInt(simpleMatch[1], 10);
    return { total: value, protection: value, block: 0, contextInfo };
  }

  return { total: 0, protection: 0, block: 0, contextInfo };
}
