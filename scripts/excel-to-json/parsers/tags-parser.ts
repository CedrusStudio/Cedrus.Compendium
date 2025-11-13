/**
 * Parser dla tagów
 * Konwertuje tekst na valid tags (lowercase, dash-separated)
 * Splituje złożone tagi po "/" (np. Kusze/Łuki → kusze, łuki)
 * ZACHOWUJE polskie znaki
 * Usuwa prefiksy kategorii (manewry-, atuty-)
 */

const IGNORED_TAGS = [
  'manewry',
  'atuty',
  'stany',
  'perki',
  'manewr',
  'atut',
  'perk',
  'postawa',
  'stan',
  'typ'
];

// Mapowanie specjalnych przypadków
const SPECIAL_TAG_MAPPINGS: Record<string, string[]> = {
  'okrzyki-bojowerozkazy': ['okrzyki-bojowe', 'rozkazy'],
  'okrzyki-bojowe-rozkazy': ['okrzyki-bojowe', 'rozkazy'],
  'na-kusze': ['kusze'],
  'harmonnia-ofensywa': ['harmonia', 'ofensywny'],
  'harmonnia-defensywa': ['harmonia', 'obronny'],
  'harmonnia-krytyczne': ['harmonia', 'krytyk'],
  'harmonnia-inne': ['harmonia'],
  'harmonii-oręż': ['harmonia'],
  'harmonnia-oręż': ['harmonia'],
  'stany-harmonii-oręż': ['harmonia'],
  'pod-postawy': ['postawy'],
  'manewry-pod-postawy': ['postawy'],
  'dualistów': ['duale'],
  'manewry-dualistów': ['duale'],
  'girgeńskie-i-durskie-manewry': ['girgeński', 'durski'],
  'girgeński': ['girgeński', 'durski'],
  'manewry-girgeńskie-i-durskie': ['girgeński', 'durski'],
};

// Zamiana końcówek przymiotnikowych i rzeczownikowych
const ADJECTIVE_ENDINGS: Array<[RegExp, string]> = [
  [/obronne$/, 'obronny'],
  [/obronna$/, 'obronny'],
  [/ofensywne$/, 'ofensywny'],
  [/ofensywna$/, 'ofensywny'],
  [/kuszę$/, 'kusze'],  // Forma dopełniacza
  [/harmonii$/, 'harmonia'],  // Forma dopełniacza na końcu
  [/inicjatywy$/, 'inicjatywa'],  // Forma dopełniacza
];

function normalizeTag(tag: string): string {
  let normalized = tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');  // Spacje na myślniki
  
  // Usuń prefix "manewry-", "atuty-", etc. NAJPIERW
  normalized = normalized
    .replace(/^manewry-/, '')
    .replace(/^atuty-/, '')
    .replace(/^postawy-/, '')
    .replace(/^stany-/, '');
  
  // POTEM usuń prefix "na-" dla broni (jeśli został po wcześniejszym czyszczeniu)
  if (normalized.startsWith('na-')) {
    normalized = normalized.replace(/^na-/, '');
  }
  
  // Specjalne mapowania dla broni
  if (normalized === 'łuk') {
    normalized = 'łuki';
  }
  
  // Zamień końcówki przymiotnikowe
  for (const [pattern, replacement] of ADJECTIVE_ENDINGS) {
    normalized = normalized.replace(pattern, replacement);
  }
  
  return normalized;
}

export function parseTags(tagStrings: (string | null | undefined)[]): string[] {
  const tags: string[] = [];

  for (const tagString of tagStrings) {
    if (!tagString || tagString.trim() === '') {
      continue;
    }

    // Najpierw splituj po "/" (przed jakąkolwiek normalizacją)
    const rawSplitTags = String(tagString).includes('/') 
      ? String(tagString).split('/').map(t => t.trim()) 
      : [String(tagString)];
    
    for (const rawTag of rawSplitTags) {
      if (!rawTag) continue;
      
      // Teraz normalizuj każdy tag osobno
      const processedTag = rawTag
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-');
      
      // Sprawdź specjalne mappingi
      if (SPECIAL_TAG_MAPPINGS[processedTag]) {
        for (const specialTag of SPECIAL_TAG_MAPPINGS[processedTag]) {
          if (!tags.includes(specialTag)) {
            tags.push(specialTag);
          }
        }
        continue;
      }
      
      if (processedTag.length < 2) continue;
      
      const normalized = normalizeTag(processedTag);
      
      // Ignoruj tagi z listy wykluczeń
      if (IGNORED_TAGS.includes(normalized)) {
        continue;
      }
      
      // Ignoruj duplikaty
      if (!tags.includes(normalized)) {
        tags.push(normalized);
      }
    }
  }

  return tags;
}

/**
 * Przykłady:
 * parseTags(['Manewry Obronne']) => ['obronny']
 * parseTags(['Manewry Ofensywne']) => ['ofensywny']
 * parseTags(['Kusze/Łuki']) => ['kusze', 'łuki']
 * parseTags(['Na Kusze']) => ['kusze']
 * parseTags(['Okrzyki Bojowe/Rozkazy']) => ['okrzyki-bojowe', 'rozkazy']
 * parseTags(['Harmonnia Ofensywa']) => ['harmonnia-ofensywa']
 * parseTags(['Stany']) => [] (ignoruje główną kategorię)
 */
