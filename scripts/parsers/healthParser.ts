export interface HealthParseResult {
  vitality: number;
  lethalHealth: number;
  recoveryLevel: number;
}

/**
 * Parsuje zdrowie z formatu:
 * - "51 (-6) [3]" → vitality: 51, lethalHealth: 6, recoveryLevel: 3
 * - "21" → vitality: 21, lethalHealth: 0, recoveryLevel: 1 (default)
 * - "24 [2]" → vitality: 24, lethalHealth: 0, recoveryLevel: 2
 */
export function parseHealth(raw: string | number): HealthParseResult {
  if (typeof raw === 'number') {
    return { vitality: raw, lethalHealth: 0, recoveryLevel: 1 };
  }

  if (!raw || raw.trim().length === 0) {
    return { vitality: 0, lethalHealth: 0, recoveryLevel: 1 };
  }

  // Pattern: "51 (-6) [3]" → vitality: 51, lethalHealth: 6, recoveryLevel: 3
  const fullMatch = raw.match(/(\d+)\s*\(-(\d+)\)\s*\[(\d+)\]/);
  if (fullMatch) {
    return {
      vitality: parseInt(fullMatch[1], 10),
      lethalHealth: parseInt(fullMatch[2], 10),
      recoveryLevel: parseInt(fullMatch[3], 10)
    };
  }

  // Pattern: "24 [2]" → vitality: 24, lethalHealth: 0, recoveryLevel: 2
  const bracketMatch = raw.match(/(\d+)\s*\[(\d+)\]/);
  if (bracketMatch) {
    return {
      vitality: parseInt(bracketMatch[1], 10),
      lethalHealth: 0,
      recoveryLevel: parseInt(bracketMatch[2], 10)
    };
  }

  // Fallback: "21" → vitality: 21, lethalHealth: 0, recoveryLevel: 1
  const simpleMatch = raw.match(/(\d+)/);
  if (simpleMatch) {
    return { vitality: parseInt(simpleMatch[1], 10), lethalHealth: 0, recoveryLevel: 1 };
  }

  return { vitality: 0, lethalHealth: 0, recoveryLevel: 1 };
}
