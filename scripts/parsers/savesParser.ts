export interface Statistic {
  grade: number;
  value: number;
  bonus: number;
  testBonus: number;
}

export interface SavesParseResult {
  willpower: Statistic;
  reflex: Statistic;
  fortitude: Statistic;
}

/**
 * Parsuje rzuty obronne z formatu "3 // 3 // 0" (Kondycja / Odruch / Wola)
 */
export function parseSaves(raw: string | number): SavesParseResult {
  if (typeof raw === 'number') {
    return {
      willpower: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
      reflex: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
      fortitude: { grade: 3, value: raw, bonus: 0, testBonus: 0 }
    };
  }

  if (!raw || raw.trim().length === 0) {
    return {
      willpower: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
      reflex: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
      fortitude: { grade: 3, value: 0, bonus: 0, testBonus: 0 }
    };
  }

  const match = raw.match(/(\d+)\s*\/\/\s*(\d+)\s*\/\/\s*(\d+)/);
  
  if (match) {
    return {
      fortitude: { grade: 3, value: parseInt(match[1], 10), bonus: 0, testBonus: 0 },
      reflex: { grade: 3, value: parseInt(match[2], 10), bonus: 0, testBonus: 0 },
      willpower: { grade: 3, value: parseInt(match[3], 10), bonus: 0, testBonus: 0 }
    };
  }

  // Fallback
  const partialMatch = raw.match(/(\d+)/g);
  if (partialMatch && partialMatch.length >= 1) {
    return {
      fortitude: { grade: 3, value: parseInt(partialMatch[0], 10), bonus: 0, testBonus: 0 },
      reflex: { grade: 3, value: partialMatch[1] ? parseInt(partialMatch[1], 10) : 0, bonus: 0, testBonus: 0 },
      willpower: { grade: 3, value: partialMatch[2] ? parseInt(partialMatch[2], 10) : 0, bonus: 0, testBonus: 0 }
    };
  }

  return {
    willpower: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
    reflex: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
    fortitude: { grade: 3, value: 0, bonus: 0, testBonus: 0 }
  };
}
