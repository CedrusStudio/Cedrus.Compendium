/**
 * Curated power levels — the one place in AI generation where the numbers say
 * what a character SHOULD be rather than what the compendium happens to hold.
 *
 * `buildBalanceProfiles` measures the existing collection, which is honest but
 * conservative: it reproduces whatever is already there, including entries that
 * were never finished. This table is the counterweight, and it is meant to be
 * edited by hand when the intended shape of the setting changes.
 */

/** Where a character's power actually lives. Values are sheet points. */
export type PowerTier = {
  /** Word the description is expected to use, matched on a stem. */
  name: string;
  aliases: string[];
  summary: string;
  /** The attribute the character is known for. */
  speciality: number;
  /** An attribute the description treats as ordinary training. */
  ordinary: number;
  maneuvers: number;
  perks: number;
  spells: number;
};

/**
 * One family of characters and its ladder.
 *
 * Separate scales exist because the kinds are not built the same way at all,
 * and a single table produced nonsense for three of the four: a mage carries
 * around thirty spells and no maneuvers, so a tier demanding nine maneuvers
 * described nothing that exists.
 */
export type PowerScale = {
  category: string;
  /** Character tags that belong to this family. */
  tags: string[];
  summary: string;
  tiers: readonly PowerTier[];
};

/**
 * Calibrated against the compendium on 2026-08-03, over characters that have
 * any attributes at all. The exclusion matters: 27 of 47 `potwory` and 27 of 32
 * `wynaturzenie` are empty stat blocks, and including them put every measured
 * median at zero — a data-quality artefact, not a statement about monsters.
 *
 *   wojownik  n=52  specjalność 6/8/10   manewry 11/15/20  atuty 0/6/11
 *   mag       n=36  specjalność 4/6/7    zaklęcia 31/44/55, zero manewrów
 *   nieumarły n=37  specjalność 5/8/10   manewry 7/15/25   atuty 1/2/7
 *   bestia    n=65  specjalność 7/12/16  manewry 8/18/22   atuty 0/0/1
 */
export const POWER_SCALES: readonly PowerScale[] = [
  {
    category: 'wojownik',
    tags: ['wojak', 'wojownik', 'rycerz', 'zbój', 'walczący-wręcz', 'dystansowy', 'łucznik', 'kusznik', 'jeździec'],
    summary: 'Człowiek walczący orężem: manewry są jego repertuarem, atuty rzadkością.',
    tiers: [
      { name: 'rekrut', aliases: ['nowicjusz', 'młody', 'początkujący', 'giermek', 'adept'],
        summary: 'Świeżo wyszkolony, zna podstawy.', speciality: 4, ordinary: 2, maneuvers: 5, perks: 0, spells: 0 },
      { name: 'weteran', aliases: ['doświadczony', 'zaprawiony', 'wyszkolony', 'zawodowy'],
        summary: 'Sprawny zawodowiec, typowy dla kompendium.', speciality: 6, ordinary: 4, maneuvers: 11, perks: 1, spells: 0 },
      { name: 'wyróżniający', aliases: ['wybitny', 'znakomity', 'słynny', 'uznany', 'najlepszy'],
        summary: 'Wyraźnie lepszy od otoczenia w swojej specjalności.', speciality: 8, ordinary: 5, maneuvers: 15, perks: 4, spells: 0 },
      { name: 'mistrz', aliases: ['legendarny', 'arcymistrz', 'niezrównany', 'mistrzowski'],
        summary: 'Szczyt tego, co osiąga człowiek orężem.', speciality: 10, ordinary: 6, maneuvers: 20, perks: 8, spells: 0 },
    ],
  },
  {
    category: 'mag',
    tags: ['mag', 'czarodziej', 'nekromancja', 'kinetyka', 'ogień', 'zimno', 'błyskawice', 'altoria', 'rdzeń'],
    summary: 'Moc leży w zaklęciach, nie w manewrach — atrybuty pozostają skromne.',
    tiers: [
      { name: 'rekrut', aliases: ['nowicjusz', 'uczeń', 'adept', 'terminator'],
        summary: 'Zna kilka formuł i niewiele poza nimi.', speciality: 3, ordinary: 1, maneuvers: 0, perks: 0, spells: 10 },
      { name: 'weteran', aliases: ['doświadczony', 'wyszkolony', 'zawodowy'],
        summary: 'Pełnoprawny mag, typowy dla kompendium.', speciality: 4, ordinary: 2, maneuvers: 0, perks: 0, spells: 31 },
      { name: 'wyróżniający', aliases: ['wybitny', 'znakomity', 'słynny', 'uznany'],
        summary: 'Rozległy repertuar i rozpoznawalna specjalizacja.', speciality: 6, ordinary: 3, maneuvers: 0, perks: 0, spells: 44 },
      { name: 'mistrz', aliases: ['legendarny', 'arcymistrz', 'niezrównany', 'mistrzowski'],
        summary: 'Włada niemal wszystkim, co jego szkoła zna.', speciality: 7, ordinary: 4, maneuvers: 0, perks: 0, spells: 55 },
    ],
  },
  {
    category: 'nieumarły',
    tags: ['nieumarły', 'eteryczny', 'trupojad', 'duch'],
    summary: 'Walczy manewrami jak człowiek, ale słabiej, za to z własnymi atutami.',
    tiers: [
      { name: 'rekrut', aliases: ['słaby', 'pomniejszy', 'świeży'],
        summary: 'Ledwie powstały, groźny tylko w grupie.', speciality: 3, ordinary: 1, maneuvers: 3, perks: 0, spells: 0 },
      { name: 'weteran', aliases: ['zwykły', 'typowy', 'doświadczony'],
        summary: 'Standardowy przeciwnik tego rodzaju.', speciality: 5, ordinary: 3, maneuvers: 7, perks: 1, spells: 0 },
      { name: 'wyróżniający', aliases: ['wybitny', 'starszy', 'możny', 'znaczący'],
        summary: 'Zachował część dawnych umiejętności.', speciality: 8, ordinary: 4, maneuvers: 15, perks: 2, spells: 0 },
      { name: 'mistrz', aliases: ['legendarny', 'pradawny', 'władca', 'niezrównany'],
        summary: 'Coś, co przetrwało wieki i nauczyło się przez ten czas.', speciality: 10, ordinary: 5, maneuvers: 25, perks: 7, spells: 0 },
    ],
  },
  {
    category: 'bestia',
    tags: ['potwory', 'potwór', 'wynaturzenie', 'natura', 'dziki', 'demon', 'diabeł', 'zwierzę', 'wodne'],
    summary: 'Nie ma wyszkolenia, ma naturę: atrybuty sięgają wyżej niż u ludzi, atutów brak.',
    tiers: [
      { name: 'rekrut', aliases: ['drobny', 'młody', 'pomniejszy', 'słaby'],
        summary: 'Zwierzę albo pomiot, groźny w stadzie.', speciality: 4, ordinary: 2, maneuvers: 3, perks: 0, spells: 0 },
      { name: 'weteran', aliases: ['dorosły', 'zwykły', 'typowy'],
        summary: 'Wyrośnięty okaz swojego gatunku.', speciality: 7, ordinary: 4, maneuvers: 8, perks: 0, spells: 0 },
      { name: 'wyróżniający', aliases: ['wybitny', 'matriarcha', 'alfa', 'przewodnik', 'znaczący'],
        summary: 'Największy i najstarszy w okolicy.', speciality: 12, ordinary: 6, maneuvers: 18, perks: 0, spells: 0 },
      { name: 'mistrz', aliases: ['legendarny', 'pradawny', 'niezrównany', 'pierwotny'],
        summary: 'Istota, o której krążą opowieści.', speciality: 16, ordinary: 8, maneuvers: 22, perks: 1, spells: 0 },
    ],
  },
];

/** Flat view for tests and reports that do not care about the split. */
export const POWER_TIERS: readonly PowerTier[] = POWER_SCALES.flatMap(scale => scale.tiers);

const stripDiacritics = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '');
const contains = (haystack: string, word: string) => haystack.includes(stripDiacritics(word.toLowerCase()).slice(0, 6));

/**
 * The scale a character belongs to.
 *
 * Tags decide it when there are any — they are the compendium's own
 * classification. The description is the fallback, and „wojownik" is the last
 * resort because it is the only family where a generic human fits.
 */
export function selectPowerScale(description: string, tags: readonly string[] = []): PowerScale
{
  const byTag = POWER_SCALES.find(scale => tags.some(tag => scale.tags.includes(tag.toLowerCase())));
  if (byTag) return byTag;

  const haystack = stripDiacritics(description.toLowerCase());
  const byDescription = POWER_SCALES.find(scale => scale.tags.some(tag => contains(haystack, tag)));

  return byDescription ?? POWER_SCALES[0];
}

/**
 * The tier a description is asking for, or `undefined` when it does not say.
 *
 * Silence is not „weteran": guessing a tier from an ambiguous description would
 * hide the ambiguity behind confident numbers, and the measured profiles
 * already give the model a sane default.
 */
export function selectPowerTier(description: string, tags: readonly string[] = []): PowerTier | undefined
{
  const haystack = stripDiacritics(description.toLowerCase());
  const scale = selectPowerScale(description, tags);

  return scale.tiers.find(tier => [tier.name, ...tier.aliases].some(word => contains(haystack, word)));
}
