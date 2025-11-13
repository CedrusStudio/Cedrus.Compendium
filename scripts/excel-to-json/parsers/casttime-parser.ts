/**
 * Parser dla castTime z opisu manewru
 * Wykrywa i usuwa z description informacje o typie akcji
 */

import { CastTime } from '@/domain/characters/Castable';

interface CastTimeParseResult {
  castTime: CastTime;
  cleanDescription: string;
}

const CAST_TIME_PATTERNS: Array<{
  regex: RegExp;
  castTime: CastTime;
}> = [
  // Nadnatychmiastowa (najwyższy priorytet)
  {
    regex: /(?:manewr\s+)?(?:nadnatychmiastowy|ponadnatychmiastowy|akcja\s+(?:nad)?natychmiastowa)/gi,
    castTime: 'Nadnatychmiastowa'
  },
  // Natychmiastowa
  {
    regex: /(?:manewr\s+)?(?:natychmiastowy|akcja\s+natychmiastowa)/gi,
    castTime: 'Natychmiastowa'
  },
  // Pełnorundowa
  {
    regex: /(?:manewr\s+)?(?:pełnorundowy|całorundowy|akcja\s+(?:pełno|cało)rundowa)/gi,
    castTime: 'Pełnorundowa'
  },
  // Standardowa
  {
    regex: /(?:manewr\s+)?(?:standardowy|akcja\s+standardowa)/gi,
    castTime: 'Standardowa'
  }
];

export function parseCastTimeFromDescription(description: string | null | undefined): CastTimeParseResult {
  if (!description || description.trim() === '') {
    return {
      castTime: 'Standardowa',
      cleanDescription: 'Brak opisu'
    };
  }

  let cleanDescription = description.trim();
  let detectedCastTime: CastTime = 'Standardowa'; // Domyślnie Standardowa

  // Sprawdź każdy pattern (w kolejności priorytetu)
  for (const pattern of CAST_TIME_PATTERNS) {
    const match = cleanDescription.match(pattern.regex);
    
    if (match) {
      detectedCastTime = pattern.castTime;
      
      // Usuń wykryte frazy z opisu
      cleanDescription = cleanDescription.replace(pattern.regex, '').trim();
      
      // Usuń nadmiarowe kropki i spacje
      cleanDescription = cleanDescription
        .replace(/^[.,\s]+/, '') // Usuń kropki/przecinki/spacje z początku
        .replace(/\s+/g, ' ')     // Znormalizuj spacje
        .trim();
      
      // Jeśli opis zaczyna się małą literą, zamień na wielką
      if (cleanDescription.length > 0) {
        cleanDescription = cleanDescription.charAt(0).toUpperCase() + cleanDescription.slice(1);
      }
      
      break; // Zatrzymaj po pierwszym znalezieniu
    }
  }

  return {
    castTime: detectedCastTime,
    cleanDescription: cleanDescription || 'Brak opisu'
  };
}

/**
 * Przykłady:
 * 
 * parseCastTimeFromDescription('Manewr Natychmiastowy. Dodaje 1 dmg')
 * => { castTime: 'Natychmiastowa', cleanDescription: 'Dodaje 1 dmg' }
 * 
 * parseCastTimeFromDescription('Akcja Nadnatychmiastowa. Test sporny')
 * => { castTime: 'Nadnatychmiastowa', cleanDescription: 'Test sporny' }
 * 
 * parseCastTimeFromDescription('Manewr Pełnorundowy. Atak z mocą')
 * => { castTime: 'Pełnorundowa', cleanDescription: 'Atak z mocą' }
 * 
 * parseCastTimeFromDescription('Test sporny fechtunku')
 * => { castTime: 'Standardowa', cleanDescription: 'Test sporny fechtunku' }
 */
