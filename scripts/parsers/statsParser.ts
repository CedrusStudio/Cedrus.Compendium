export interface Statistic {
  grade: number;
  value: number;
  bonus: number;
  testBonus: number;
}

export interface StatsParseResult {
  strength: Statistic;
  dexterity: Statistic;
  constitution: Statistic;
}

/**
 * Parsuje cechy z formatu "1 // 1 // 1" (S // Zr // Bd)
 */
export function parseStats(raw: string | number): StatsParseResult {
  if (typeof raw === 'number') {
    return {
      strength: { grade: 3, value: raw, bonus: 0, testBonus: 0 },
      dexterity: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
      constitution: { grade: 3, value: 0, bonus: 0, testBonus: 0 }
    };
  }

  if (!raw || raw.trim().length === 0) {
    return {
      strength: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
      dexterity: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
      constitution: { grade: 3, value: 0, bonus: 0, testBonus: 0 }
    };
  }

  const match = raw.match(/(\d+)\s*\/\/\s*(\d+)\s*\/\/\s*(\d+)/);
  
  if (match) {
    return {
      strength: { grade: 3, value: parseInt(match[1], 10), bonus: 0, testBonus: 0 },
      dexterity: { grade: 3, value: parseInt(match[2], 10), bonus: 0, testBonus: 0 },
      constitution: { grade: 3, value: parseInt(match[3], 10), bonus: 0, testBonus: 0 }
    };
  }

  // Fallback: niepełne dane
  const partialMatch = raw.match(/(\d+)/g);
  if (partialMatch && partialMatch.length >= 1) {
    return {
      strength: { grade: 3, value: parseInt(partialMatch[0], 10), bonus: 0, testBonus: 0 },
      dexterity: { grade: 3, value: partialMatch[1] ? parseInt(partialMatch[1], 10) : 0, bonus: 0, testBonus: 0 },
      constitution: { grade: 3, value: partialMatch[2] ? parseInt(partialMatch[2], 10) : 0, bonus: 0, testBonus: 0 }
    };
  }

  return {
    strength: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
    dexterity: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
    constitution: { grade: 3, value: 0, bonus: 0, testBonus: 0 }
  };
}
