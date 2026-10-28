/**
 * Which parts of the printable character sheet to render, and how.
 *
 * Options live in the query string rather than in component state so the sheet
 * is server-rendered, linkable and survives a reload — see
 * `features-to-implement/character-sheet-print-plan.md` §3.1.
 */

export const sheetSections =
[
  'stats',
  'vitals',
  'defenses',
  'offenses',
  'equipment',
  'actions',
  'perks',
  'buffs',
  'powers',
  'talents',
  'description',
  'notes',
] as const;

export type SheetSection = typeof sheetSections[number];

export const sheetSectionLabels: Record<SheetSection, string> =
{
  stats: 'cechy i atrybuty',
  vitals: 'zdrowie',
  defenses: 'obrony',
  offenses: 'ataki',
  equipment: 'ekwipunek',
  actions: 'manewry, postawy i stany',
  perks: 'atuty',
  buffs: 'wzmocnienia',
  powers: 'moce i zaklęcia',
  talents: 'umiejętności',
  description: 'opis postaci',
  notes: 'notatki',
};

export type SheetOptions =
{
  sections: readonly SheetSection[];
  /** Full descriptions of maneuvers/modes/spells/perks, appended after the sheet. */
  appendix: boolean;
  /** Hide visible labels only where a statistic has a matching symbol. */
  symbolsOnly?: boolean;
};

export const defaultSheetOptions: SheetOptions =
{
  sections: sheetSections,
  appendix: false,
  symbolsOnly: false,
};

export function isSheetSection(value: string): value is SheetSection
{
  return (sheetSections as readonly string[]).includes(value);
}

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseSheetOptions(searchParams: RawSearchParams | undefined): SheetOptions
{
  if (!searchParams) return defaultSheetOptions;

  return {
    sections: parseSections(firstValue(searchParams['sections'])),
    appendix: parseBoolean(firstValue(searchParams['appendix'])),
    symbolsOnly: parseBoolean(firstValue(searchParams['symbolsOnly'])),
  };
}

/**
 * Sections are serialised in the canonical order rather than the order the
 * caller listed them — the sheet layout is fixed, the query only says which
 * blocks appear.
 */
export function toSheetQuery(options: SheetOptions): string
{
  const params = new URLSearchParams();

  if (options.sections.length !== sheetSections.length)
  {
    params.set('sections', sheetSections.filter(section => options.sections.includes(section)).join(','));
  }

  if (options.appendix) params.set('appendix', '1');
  if (options.symbolsOnly) params.set('symbolsOnly', '1');

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function isSectionEnabled(options: SheetOptions, section: SheetSection): boolean
{
  return options.sections.includes(section);
}

function parseSections(raw: string | undefined): readonly SheetSection[]
{
  if (raw === undefined) return defaultSheetOptions.sections;

  // An empty list is a deliberate "none" — the toolbar produces it when every
  // box is unchecked. Falling back to everything here would flip all sections
  // back on at the moment the user turned the last one off.
  if (raw.trim() === '') return [];

  const requested = raw
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(isSheetSection);

  // A non-empty but entirely unrecognised list is a broken link, not a choice;
  // fall back to everything rather than printing a header and nothing else.
  if (requested.length === 0) return defaultSheetOptions.sections;

  return sheetSections.filter(section => requested.includes(section));
}

function parseBoolean(raw: string | undefined): boolean
{
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'tak';
}

function firstValue(value: string | string[] | undefined): string | undefined
{
  return Array.isArray(value) ? value[0] : value;
}
