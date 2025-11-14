export interface DiceOffense {
  amount: number;
  grade: number;
  bonus: number;
}

export interface CriticalHit {
  range: number;
  power: number;
}

export interface DamageParseResult {
  leading: DiceOffense;
  bonus: DiceOffense;
  critical?: CriticalHit;
}

/**
 * Konwertuje k6 → grade 3, k4 → grade 2, k8 → grade 4, etc.
 */
function diceToGrade(dice: number): number {
  const mapping: Record<number, number> = {
    4: 2,
    6: 3,
    8: 4,
    10: 5,
    12: 6,
    20: 10
  };
  return mapping[dice] ?? 1;
}

/**
 * Parsuje obrażenia z formatu "2x(1k6+1)+1k4+5 / 5-6,+3"
 * Krytyk: "4-6,+4" → range: 2 (6-4), power: 4
 */
export function parseDamage(raw: string): DamageParseResult {
  if (!raw || raw.trim().length === 0) {
    return {
      leading: { amount: 0, grade: 1, bonus: 0 },
      bonus: { amount: 0, grade: 1, bonus: 0 }
    };
  }

  // Split na główne obrażenia i krytyk
  const [mainPart, criticalPart] = raw.split('/').map(s => s.trim());

  // Parse głównej części
  let leading: DiceOffense = { amount: 0, grade: 1, bonus: 0 };
  let bonus: DiceOffense = { amount: 0, grade: 1, bonus: 0 };

  // Pattern dla głównego ataku: 2x(1k6+1) lub 1k6+1
  const mainMatch = mainPart.match(/(\d+)x\((\d+)k(\d+)(?:\+(\d+))?\)|(\d+)k(\d+)(?:\+(\d+))?/);
  
  if (mainMatch) {
    if (mainMatch[1]) {
      // Format: 2x(1k6+1)
      leading = {
        amount: parseInt(mainMatch[1], 10),
        grade: diceToGrade(parseInt(mainMatch[3], 10)),
        bonus: mainMatch[4] ? parseInt(mainMatch[4], 10) : 0
      };
    } else if (mainMatch[5]) {
      // Format: 1k6+1
      leading = {
        amount: 1,
        grade: diceToGrade(parseInt(mainMatch[6], 10)),
        bonus: mainMatch[7] ? parseInt(mainMatch[7], 10) : 0
      };
    }
  }

  // Parse dodatkowych kości: +1k4 lub +5
  const bonusMatches = mainPart.matchAll(/\+(\d+)k(\d+)|\+(\d+)(?!k)/g);
  let totalBonusAmount = 0;
  let totalBonusGrade = 1;
  let totalFlatBonus = 0;

  for (const match of bonusMatches) {
    if (match[1] && match[2]) {
      // Format: +1k4
      totalBonusAmount += parseInt(match[1], 10);
      totalBonusGrade = diceToGrade(parseInt(match[2], 10));
    } else if (match[3]) {
      // Format: +5 (flat bonus)
      totalFlatBonus += parseInt(match[3], 10);
    }
  }

  bonus = {
    amount: totalBonusAmount,
    grade: totalBonusGrade,
    bonus: totalFlatBonus
  };

  // Parse krytyka: 4-6,+4 → range: 2 (max-min), power: 4
  let critical: CriticalHit | undefined;
  if (criticalPart) {
    const critMatch = criticalPart.match(/(\d+)-(\d+),?\s*\+(\d+)/);
    if (critMatch) {
      const min = parseInt(critMatch[1], 10);
      const max = parseInt(critMatch[2], 10);
      critical = {
        range: max - min,
        power: parseInt(critMatch[3], 10)
      };
    }
  }

  return { leading, bonus, critical };
}
