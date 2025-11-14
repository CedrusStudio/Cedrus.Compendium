/**
 * Parsuje resistance z różnych formatów:
 * - 5 → 5
 * - "1k10" → 10 (max wartość kości)
 * - "2k8" → 8 (max wartość kości)
 * - "Skorupa = 25  Noga = 15" → 25 (pierwsza liczba)
 */
export function parseResistance(raw: string | number): number {
  if (typeof raw === 'number') {
    return raw;
  }

  if (!raw || raw.trim().length === 0) {
    return 0;
  }

  const str = String(raw).trim();

  // Pattern: "1k10" → 10
  const diceMatch = str.match(/\d+k(\d+)/i);
  if (diceMatch) {
    return parseInt(diceMatch[1], 10);
  }

  // Pattern: "Skorupa = 25" → 25 (pierwsza liczba po =)
  const equalsMatch = str.match(/=\s*(\d+)/);
  if (equalsMatch) {
    return parseInt(equalsMatch[1], 10);
  }

  // Fallback: pierwsza liczba w stringu
  const numberMatch = str.match(/(\d+)/);
  if (numberMatch) {
    return parseInt(numberMatch[1], 10);
  }

  return 0;
}
