export interface DefenseParseResult {
  parry: number;
  dodge: number;
}

/**
 * Parsuje parowanie/uniki z formatu "3 // 4" (Parowanie / Uniki)
 */
export function parseDefense(raw: string | number): DefenseParseResult {
  if (typeof raw === 'number') {
    return { parry: raw, dodge: 0 };
  }

  if (!raw || raw.trim().length === 0) {
    return { parry: 0, dodge: 0 };
  }

  // Pattern: liczba // liczba
  const match = raw.match(/(\d+)\s*\/\/\s*(\d+)/);
  
  if (match) {
    return {
      parry: parseInt(match[1], 10),
      dodge: parseInt(match[2], 10)
    };
  }

  // Fallback: tylko liczba
  const simpleMatch = raw.match(/(\d+)/);
  if (simpleMatch) {
    return { parry: parseInt(simpleMatch[1], 10), dodge: 0 };
  }

  return { parry: 0, dodge: 0 };
}
