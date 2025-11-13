/**
 * Parser dla wymagań
 * Rozdziela tekst po przecinku i trimuje każdy element
 */

export function parseRequirements(requirementsString: string | null | undefined): string[] {
  if (!requirementsString || requirementsString.trim() === '') {
    return [];
  }

  const requirements = String(requirementsString)
    .split(',')
    .map(req => req.trim())
    .filter(req => req.length > 0 && req !== '1H/Tura');

  return requirements;
}

/**
 * Przykłady:
 * parseRequirements('Zr 3, Int 2') => ['Zr 3', 'Int 2']
 * parseRequirements('Większa Wytrwałość5') => ['Większa Wytrwałość5']
 * parseRequirements('') => []
 * parseRequirements(null) => []
 */
