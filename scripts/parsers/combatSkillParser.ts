export interface CombatSkillParseResult {
  primary: number;
  primaryTestBonus: number;
  secondary: number;
  secondaryTestBonus: number;
}

/**
 * Parsuje umiejętności walki z formatu:
 * - "5 [+1] // 0" → primary: 5, primaryTestBonus: 1, secondary: 0, secondaryTestBonus: 0
 * - "6 // 5 [+1]" → primary: 6, primaryTestBonus: 0, secondary: 5, secondaryTestBonus: 1
 * - "3 // 0" → primary: 3, primaryTestBonus: 0, secondary: 0, secondaryTestBonus: 0
 */
export function parseCombatSkill(raw: string | number): CombatSkillParseResult {
  if (typeof raw === 'number') {
    return { primary: raw, primaryTestBonus: 0, secondary: 0, secondaryTestBonus: 0 };
  }

  if (!raw || raw.trim().length === 0) {
    return { primary: 0, primaryTestBonus: 0, secondary: 0, secondaryTestBonus: 0 };
  }

  // Pattern: "5 [+1] // 0" or "6 // 5 [+1]"
  const fullMatch = raw.match(/(\d+)(?:\s*\[\+(\d+)\])?\s*\/\/\s*(\d+)(?:\s*\[\+(\d+)\])?/);
  
  if (fullMatch) {
    return {
      primary: parseInt(fullMatch[1], 10),
      primaryTestBonus: fullMatch[2] ? parseInt(fullMatch[2], 10) : 0,
      secondary: parseInt(fullMatch[3], 10),
      secondaryTestBonus: fullMatch[4] ? parseInt(fullMatch[4], 10) : 0
    };
  }

  // Fallback: tylko liczba z bonusem "5 [+1]"
  const bonusMatch = raw.match(/(\d+)(?:\s*\[\+(\d+)\])?/);
  if (bonusMatch) {
    return { 
      primary: parseInt(bonusMatch[1], 10), 
      primaryTestBonus: bonusMatch[2] ? parseInt(bonusMatch[2], 10) : 0,
      secondary: 0,
      secondaryTestBonus: 0
    };
  }

  return { primary: 0, primaryTestBonus: 0, secondary: 0, secondaryTestBonus: 0 };
}
