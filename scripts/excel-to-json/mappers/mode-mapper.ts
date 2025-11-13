import { ulid } from 'ulid';
import { Mode } from '@/domain/characters/combat/Mode';
import { parseCost } from '../parsers/cost-parser';
import { parseRequirements } from '../parsers/requirements-parser';
import { parseNameAndGrade } from '../parsers/name-grade-parser';
import { parseTags } from '../parsers/tags-parser';

interface ModeExcelRow {
  Typ?: string;
  Nazwa?: string;
  Działanie?: string;
  Koszt?: string | number;
  Wymagania?: string;
  War?: string | number;
  Typ_1?: string;
  PostawaSokoła2?: string; // Dodatkowe pole - może być użyte jako wymóg
}

interface ModeWithType extends Mode {
  _sourceType?: string; // Wewnętrzne pole do śledzenia typu
}

export function mapMode(row: ModeExcelRow): ModeWithType {
  // Parsuj nazwę i grade
  const rawName = row.Nazwa || '';
  const { name, grade } = parseNameAndGrade(rawName);

  // Parsuj koszt - priorytet dla War, potem Koszt
  const price = row.War 
    ? parseCost(row.War) 
    : parseCost(row.Koszt);

  // Parsuj description
  const description = row.Działanie || 'Brak opisu';

  // Parsuj requirements - dodaj PostawaSokoła2 jeśli istnieje
  const requirementsArray = parseRequirements(row.Wymagania);
  if (row.PostawaSokoła2 && row.PostawaSokoła2.trim()) {
    requirementsArray.push(row.PostawaSokoła2.trim());
  }

  // Parsuj tagi z Typ_1 (ale nie z Typ, bo to kategoria)
  const tags = parseTags([row.Typ_1]);

  return {
    id: ulid(),
    name,
    grade,
    description,
    requirements: requirementsArray,
    price,
    tags,
    _sourceType: row.Typ // Zachowaj typ źródłowy do rozdzielenia
  };
}

export function mapModes(rows: ModeExcelRow[]): ModeWithType[] {
  return rows
    .filter(row => {
      const rawName = row.Nazwa || '';
      // Filtruj puste wiersze oraz wiersze z labelkami Excelowymi
      return rawName && rawName !== 'Nazwa';
    })
    .map(mapMode);
}

/**
 * Rozdziela Modes na Stances i States na podstawie typu lub nazwy
 * Stany to:
 * - Mają w polu Typ wartość zawierającą "stan" (case-insensitive)
 * - LUB nazwa zaczyna się od "Stan"
 * - LUB nazwa pasuje do znanych stanów (Amok, Szał Bitewny, Szarża, Wir Walki, itp.)
 */
export function splitModesIntoStancesAndStates(modes: ModeWithType[]): {
  stances: Mode[];
  states: Mode[];
} {
  const stances: Mode[] = [];
  const states: Mode[] = [];

  // Lista znanych nazw stanów (bez sufixu numerycznego)
  const knownStateNames = [
    'amok',
    'defensywny rytm',
    'stan pojedynku',
    'stan: nieustanna nawałnica ciosów',
    'szał bitewny',
    'szarża',
    'widmowa walka',
    'wir walki',
    'żądza krwi',
    'ostrość umysłu',
    'precyzja wnętrza',
    'rezonująca sztuka',
    'umysł przedłużeniem ostrza',
    'zewnętrzny młot',
    'aura drenora',
    'aura gerneta',
    'aura riny',
    'aura shojiego kaname'
  ];

  modes.forEach((mode) => {
    const type = mode._sourceType?.toLowerCase() || '';
    const name = mode.name.toLowerCase();
    
    // Usuń pole pomocnicze przed dodaniem do wynikowej tablicy
    const { _sourceType, ...cleanMode } = mode;

    // Sprawdź czy to stan
    const isState = 
      type.includes('stan') || 
      name.startsWith('stan') ||
      knownStateNames.some(stateName => 
        name === stateName || 
        name.startsWith(stateName) // Dopasowuje też wersje z numerami (np. "szarża1")
      );

    if (isState) {
      states.push(cleanMode);
    } else {
      stances.push(cleanMode);
    }
  });

  return { stances, states };
}
