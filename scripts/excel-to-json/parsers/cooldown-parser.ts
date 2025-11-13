/**
 * Parser dla częstotliwości (cooldown)
 * Format: 1//3 => cooldown 3
 *         1//D => cooldown null (raz na walkę)
 *         1//6 => cooldown 6
 */

export function parseCooldown(frequencyString: string | null | undefined): number | undefined {
  if (!frequencyString || frequencyString.trim() === '') {
    return undefined;
  }

  const freq = String(frequencyString).trim();

  // Format 1//D lub podobne z literą - raz na walkę
  if (/1\/\/[A-Za-z]/.test(freq)) {
    return undefined; // null w JSON to undefined w TS
  }

  // Format 1//3, 1//6 itp - wyciągnij liczbę po //
  const match = freq.match(/1\/\/(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  // Jeśli to czysta liczba
  if (/^\d+$/.test(freq)) {
    return parseInt(freq, 10);
  }

  return undefined;
}

/**
 * Przykłady:
 * parseCooldown('1//3') => 3
 * parseCooldown('1//6') => 6
 * parseCooldown('1//D') => undefined
 * parseCooldown('1//W') => undefined
 * parseCooldown('') => undefined
 * parseCooldown(null) => undefined
 */
