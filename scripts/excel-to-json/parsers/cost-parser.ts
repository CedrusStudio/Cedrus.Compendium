/**
 * Parser dla kosztów (cen) z formatu Excel
 * Mapowanie: B=1, S=3, Z=9, P=27, D=81
 * Sumuje wartości wszystkich symboli
 * Obsługuje koszty z mnożeniem (np. "BB+B*Zr" → koszt: 2, dodatkowyKoszt: "1*Zr")
 */

const COST_MAP: Record<string, number> = {
  'B': 1,
  'S': 3,
  'Z': 9,
  'P': 27,
  'D': 81
};

export interface CostParseResult {
  price: number;
  additionalCost?: string;
}

export function parseCostWithMultiplier(costString: string | number | null | undefined): CostParseResult {
  if (costString === null || costString === undefined || costString === '') {
    return { price: 0 };
  }

  // Jeśli już jest liczbą, zwróć ją
  if (typeof costString === 'number') {
    return { price: costString };
  }

  const cost = String(costString).trim();
  
  // Sprawdź czy jest mnożenie (format: "XX+Y*variable")
  const multiplierMatch = cost.match(/^([BSZPD]+)\+([BSZPD]+)\*(.+)$/i);
  
  if (multiplierMatch) {
    const baseCost = multiplierMatch[1];
    const multiplierSymbol = multiplierMatch[2];
    let variable = multiplierMatch[3].trim();
    
    // Usuń zbędne nawiasy i spacje z zmiennej
    variable = variable
      .replace(/^\(\s*/, '')  // Usuń ( i spacje z początku
      .replace(/\s*\)$/, '')  // Usuń spacje i ) z końca
      .trim();
    
    // Parsuj koszt bazowy
    let basePrice = 0;
    for (const char of baseCost.toUpperCase()) {
      if (COST_MAP[char]) {
        basePrice += COST_MAP[char];
      }
    }
    
    // Parsuj mnożnik
    let multiplierValue = 0;
    for (const char of multiplierSymbol.toUpperCase()) {
      if (COST_MAP[char]) {
        multiplierValue += COST_MAP[char];
      }
    }
    
    return {
      price: basePrice,
      additionalCost: `${multiplierValue}*${variable}`
    };
  }
  
  // Jeśli to czysta liczba, parsuj ją
  if (/^\d+$/.test(cost)) {
    return { price: parseInt(cost, 10) };
  }

  // Parsuj symbole i sumuj wartości (stary sposób)
  let total = 0;
  
  for (const char of cost.toUpperCase()) {
    if (COST_MAP[char]) {
      total += COST_MAP[char];
    }
  }

  return { price: total };
}

export function parseCost(costString: string | number | null | undefined): number {
  return parseCostWithMultiplier(costString).price;
}

/**
 * Przykłady:
 * parseCost('B') => 1
 * parseCost('S') => 3
 * parseCost('BB') => 2
 * parseCost('SSB') => 7
 * parseCost('ZS') => 12
 * parseCost('Z') => 9
 * parseCost(5) => 5
 * parseCost('War') => 0 (nieznane symbole ignorowane)
 * 
 * parseCostWithMultiplier('BB+B*Zr') => { price: 2, additionalCost: '1*Zr' }
 * parseCostWithMultiplier('SS+S*|cecha|') => { price: 6, additionalCost: '3*|cecha|' }
 */
