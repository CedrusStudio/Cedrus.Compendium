import { ulid } from 'ulid';

const ULID_PATTERN = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

type Path = readonly string[];

type InternalIdentifierReference = {
  readonly path: Path;
  readonly collection: Path;
  readonly isList?: boolean;
};

/**
 * Collections the proposal owns. Their identifiers are private to the draft,
 * so the model may use any placeholder and the server mints the real ULID.
 */
const internalIdentifierCollections: readonly Path[] = [
  ['talents', 'talents'],
  ['combat', 'defenses'],
  ['combat', 'offenses'],
  ['combat', 'powers'],
  ['buffs', 'buffProfiles'],
  ['buffs', 'stanceModifierProfiles'],
  ['buffs', 'stateModifierProfiles'],
  ['buffs', 'otherModifierProfiles'],
];

/**
 * Equipment, perks, maneuvers, stances and states live in the compendium and
 * are linked to a character, not embedded in it. Minting identifiers for them would make the acceptance
 * transaction insert a duplicate record for every weapon and shield, so unless
 * the request allows authoring, entries the model did not take from the
 * catalog are dropped instead.
 */
const equipmentCollections: readonly Path[] = [
  ['equipment', 'weapons'],
  ['equipment', 'armors'],
  ['equipment', 'shields'],
  ['equipment', 'inventory'],
  ['equipment', 'mounts'],
];

const abilityCollections: readonly Path[] = [
  ['perks'],
  ['combat', 'maneuvers'],
  ['combat', 'stances'],
  ['combat', 'states'],
];

export type NormalizeAiProposalOptions = {
  /** The request let the model author gear that is not in the compendium. */
  allowCustomEquipment?: boolean;
  /** The request let the model author perks that are not in the compendium. */
  allowCustomAbilities?: boolean;
  /** Lets a mistyped identifier be repaired from the name beside it. */
  catalog?: CatalogIdentityIndex;
};

/**
 * Enough of the catalog to tell whether an identifier and the name written next
 * to it agree.
 *
 * Copying a 26-character Crockford string is exactly the sort of thing a model
 * gets subtly wrong, and the failure is silent: a draft arrived labelling an
 * entry „Nagła Zasłona" while carrying the identifier of „Wyrównanie". That id
 * is a real catalog id, so it passed the ULID check and the catalog-membership
 * check, and the character would have been linked to the wrong maneuver.
 */
export type CatalogIdentityIndex = {
  nameById: ReadonlyMap<string, string>;
  idByNameAndGrade: ReadonlyMap<string, string>;
  idByName: ReadonlyMap<string, string>;
};

const nameKey = (name: string) => name.trim().toLowerCase();
const nameGradeKey = (name: string, grade: unknown) => `${nameKey(name)}|${String(grade)}`;

export function buildCatalogIdentityIndex(
  entries: readonly { id: string; name: string; grade?: number }[],
): CatalogIdentityIndex
{
  const nameById = new Map<string, string>();
  const idByNameAndGrade = new Map<string, string>();
  const idByName = new Map<string, string>();

  for (const entry of entries) {
    nameById.set(entry.id, entry.name);
    idByNameAndGrade.set(nameGradeKey(entry.name, entry.grade), entry.id);

    // The lowest rank is the one a character can most plausibly reach, and it
    // is the sensible answer when only a name survives.
    const existing = idByName.get(nameKey(entry.name));
    if (existing === undefined) idByName.set(nameKey(entry.name), entry.id);
  }

  return { nameById, idByNameAndGrade, idByName };
}

/** Fields that point back at one of the collections above. */
const internalIdentifierReferences: readonly InternalIdentifierReference[] = [
  { path: ['combat', 'defaultDefenseId'], collection: ['combat', 'defenses'] },
  { path: ['combat', 'defaultOffenseId'], collection: ['combat', 'offenses'] },
  { path: ['buffs', 'activeBuffProfileIds'], collection: ['buffs', 'buffProfiles'], isList: true },
  { path: ['buffs', 'activeStanceModifierProfileIds'], collection: ['buffs', 'stanceModifierProfiles'], isList: true },
  { path: ['buffs', 'activeStateModifierProfileIds'], collection: ['buffs', 'stateModifierProfiles'], isList: true },
  { path: ['buffs', 'activeOtherModifierProfileIds'], collection: ['buffs', 'otherModifierProfiles'], isList: true },
];

/*
 * Deliberately NOT rewritten, because they must match a global compendium
 * record supplied to the model in its references — `validateAiCharacter-
 * ProposalForAcceptance` rejects the draft when they do not:
 *   header.raceId, combat.stances[].id, combat.states[].id,
 *   combat.maneuvers[].id, combat.powers[].spells[].id,
 *   combat.powers[].powerSpecificationId, buffs.*[].linkedEntityId.
 * Minting new identifiers for those would turn a caught hallucination into a
 * silently broken reference.
 */

function isRecord(value: unknown): value is Record<string, unknown>
{
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolvePath(root: unknown, path: Path): unknown
{
  let current: unknown = root;
  for (const segment of path) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function isUlid(value: unknown): value is string
{
  return typeof value === 'string' && ULID_PATTERN.test(value);
}

/**
 * A language model cannot produce Crockford base32 ULIDs, and Structured
 * Outputs cannot force it to: the response format guarantees shape, not
 * content. The model is therefore asked for short placeholders, which this
 * function swaps for real ULIDs before the proposal reaches the Zod contract.
 *
 * Placeholders are resolved per collection, so the same string used for a
 * weapon and for an armour stays two distinct entries, while a reference such
 * as `activeBuffProfileIds` still resolves to the profile it names. A
 * reference to something the model never declared is left untouched on
 * purpose, so acceptance validation still reports it.
 *
 * The argument is the freshly parsed provider response and is mutated in
 * place; it is never a value the application already owns.
 */
export function normalizeAiProposalIdentifiers(
  proposal: unknown,
  options: NormalizeAiProposalOptions = {},
): unknown
{
  if (!isRecord(proposal)) return proposal;

  const authoredCollections = [
    ...internalIdentifierCollections,
    ...(options.allowCustomEquipment ? equipmentCollections : []),
    ...(options.allowCustomAbilities ? abilityCollections : []),
  ];
  const catalogBackedCollections = [
    ...(options.allowCustomEquipment ? [] : equipmentCollections),
    ...(options.allowCustomAbilities ? [] : abilityCollections),
  ];

  const mintedByCollection = new Map<string, Map<string, string>>();

  for (const collectionPath of authoredCollections) {
    const entries = resolvePath(proposal, collectionPath);
    if (!Array.isArray(entries)) continue;

    const minted = new Map<string, string>();
    mintedByCollection.set(collectionPath.join('.'), minted);

    for (const entry of entries) {
      if (!isRecord(entry)) continue;
      if (isUlid(entry.id)) continue;

      const generated = ulid();
      if (typeof entry.id === 'string' && entry.id.trim().length > 0) {
        minted.set(entry.id.trim(), generated);
      }
      entry.id = generated;
    }
  }

  const droppedReferences: string[] = [];
  const repairedReferences: string[] = [];

  for (const collectionPath of catalogBackedCollections) {
    const parent = resolvePath(proposal, collectionPath.slice(0, -1));
    if (!isRecord(parent)) continue;

    const key = collectionPath[collectionPath.length - 1];
    const entries = parent[key];
    if (!Array.isArray(entries)) continue;

    const lost: string[] = [];
    const kept = entries.filter(entry => {
      if (!isRecord(entry)) return false;

      const resolution = resolveCatalogEntry(entry, options.catalog);
      if (resolution === 'dropped') {
        lost.push(typeof entry.name === 'string' ? entry.name : '?');
        return false;
      }
      if (resolution === 'repaired') repairedReferences.push(String(entry.name));

      return true;
    });

    // Naming the casualties is the difference between "some perks went" and
    // knowing the model wanted „Mistrzostwo w fortelu" and could not have it.
    if (lost.length > 0) droppedReferences.push(`${key}: ${lost.join(', ')}`);
    parent[key] = kept;
  }

  for (const { path, collection, isList } of internalIdentifierReferences) {
    const minted = mintedByCollection.get(collection.join('.')) ?? new Map<string, string>();
    const parent = resolvePath(proposal, path.slice(0, -1));
    if (!isRecord(parent)) continue;

    const key = path[path.length - 1];
    const value = parent[key];

    const remap = (item: unknown): unknown => typeof item === 'string'
      ? minted.get(item.trim()) ?? item
      : item;

    if (isList) {
      if (!Array.isArray(value)) continue;
      const remapped = value.map(remap);
      // A pointer at something the model never declared cannot be a ULID and
      // would fail the DTO contract outright. Dropping it keeps the rest of
      // the draft reviewable, and the warning says what was lost.
      const kept = remapped.filter(isUlid);
      if (kept.length !== remapped.length) droppedReferences.push(key);
      parent[key] = kept;
      continue;
    }

    if (typeof value !== 'string') continue;

    const remapped = remap(value);
    const declared = resolvePath(proposal, collection);
    const exists = Array.isArray(declared)
      && declared.some(entry => isRecord(entry) && entry.id === remapped);

    // A default pointing at nothing would survive into the saved character as a
    // broken selection, so it is cleared rather than carried.
    if (exists) {
      parent[key] = remapped;
    } else {
      parent[key] = null;
      droppedReferences.push(key);
    }
  }

  // `linkedEntityId` names a stance or state, whose identifiers come from the
  // compendium and are never minted here. An invented one is not a ULID, so it
  // is cleared rather than allowed to fail the whole draft; acceptance
  // validation still reports a link that points outside the proposal.
  for (const collectionPath of internalIdentifierCollections) {
    const entries = resolvePath(proposal, collectionPath);
    if (!Array.isArray(entries)) continue;

    for (const entry of entries) {
      if (!isRecord(entry)) continue;
      if (!('linkedEntityId' in entry)) continue;
      if (entry.linkedEntityId === null || entry.linkedEntityId === undefined) continue;
      if (isUlid(entry.linkedEntityId)) continue;

      entry.linkedEntityId = null;
      droppedReferences.push('linkedEntityId');
    }
  }

  appendWarnings(proposal, droppedReferences);
  appendRepairWarning(proposal, repairedReferences);

  return proposal;
}

/**
 * Decides what to do with one entry that is supposed to come from the catalog.
 *
 * The name is trusted over the identifier. A model that writes „Odwet" has
 * clearly found the entry it means; the 26 characters beside it are the part it
 * fumbles, and they are recoverable from the catalog. Only when the name is not
 * in the catalog either is there nothing left to salvage.
 */
function resolveCatalogEntry(
  entry: Record<string, unknown>,
  catalog: CatalogIdentityIndex | undefined,
): 'kept' | 'repaired' | 'dropped'
{
  const name = typeof entry.name === 'string' ? entry.name : undefined;

  if (catalog === undefined) return isUlid(entry.id) ? 'kept' : 'dropped';
  if (name === undefined) return isUlid(entry.id) && catalog.nameById.has(String(entry.id)) ? 'kept' : 'dropped';

  if (isUlid(entry.id)) {
    const catalogName = catalog.nameById.get(entry.id);
    if (catalogName !== undefined && nameKey(catalogName) === nameKey(name)) return 'kept';
  }

  const repaired = catalog.idByNameAndGrade.get(nameGradeKey(name, entry.grade))
    ?? catalog.idByName.get(nameKey(name));

  if (repaired === undefined) return 'dropped';

  entry.id = repaired;
  return 'repaired';
}

function appendRepairWarning(proposal: Record<string, unknown>, repaired: readonly string[]): void
{
  if (repaired.length === 0) return;
  if (!Array.isArray(proposal.warnings)) return;

  const names = [...new Set(repaired)].join(', ');
  const warning = `Poprawiono identyfikatory wpisów, które model podpisał poprawną nazwą, ale wskazał `
    + `identyfikatorem innego wpisu: ${names}.`;

  proposal.warnings = [...proposal.warnings, warning.slice(0, 500)].slice(0, MAX_PROPOSAL_WARNINGS);
}

const MAX_PROPOSAL_WARNINGS = 20;

/**
 * The warning is read by the person reviewing the draft, so it names the parts
 * of the character sheet rather than the DTO keys they happen to live under.
 */
const FIELD_LABELS: Record<string, string> = {
  perks: 'atuty',
  weapons: 'bronie',
  armors: 'zbroje',
  shields: 'tarcze',
  inventory: 'przedmioty',
  mounts: 'wierzchowce',
  maneuvers: 'manewry',
  stances: 'postawy',
  states: 'stany',
  linkedEntityId: 'powiązania profili wzmocnień',
  defaultDefenseId: 'domyślna obrona',
  defaultOffenseId: 'domyślna ofensywa',
  activeBuffProfileIds: 'aktywne profile wzmocnień',
  activeStanceModifierProfileIds: 'aktywne profile postaw',
  activeStateModifierProfileIds: 'aktywne profile stanów',
  activeOtherModifierProfileIds: 'aktywne profile pozostałych modyfikatorów',
};

function appendWarnings(proposal: Record<string, unknown>, droppedReferences: readonly string[]): void
{
  if (droppedReferences.length === 0) return;
  if (!Array.isArray(proposal.warnings)) return;

  const fields = [...new Set(droppedReferences)]
    .map(field => {
      const [key, names] = field.split(': ');
      const label = FIELD_LABELS[key] ?? key;
      return names ? `${label} (${names})` : label;
    })
    .join('; ');
  const warning = `Model zaproponował wpisy spoza kompendium i zostały usunięte: ${fields}. `
    + 'Zaznacz zgodę na tworzenie nowych wpisów, jeśli mają powstać.';

  proposal.warnings = [...proposal.warnings, warning.slice(0, 500)].slice(0, MAX_PROPOSAL_WARNINGS);
}
