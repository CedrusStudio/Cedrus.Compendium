import { z } from 'zod';
import { toStrictJsonSchema } from 'openai/lib/transform';
import { aiCharacterProposalSchema } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import { SKILLS } from '@/domain/characters/statistics/skills';

type JsonSchema = Record<string, unknown>;

function isJsonSchema(value: unknown): value is JsonSchema
{
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Keys of these keywords are author-chosen names (property names, definition
 * names), not JSON Schema keywords. Their *values* are schemas and must be
 * walked, but the key layer itself must never be inspected for keywords —
 * otherwise a legitimate property called `description` or `format` is deleted
 * as if it were an annotation, and the model can no longer return it.
 */
const schemaMapKeywords = new Set([
  'properties',
  '$defs',
  'definitions',
  'patternProperties',
  'dependentSchemas',
]);

/**
 * Lets a required-by-the-wire field still say "absent".
 *
 * Without it the only way to answer an optional field is to invent a value,
 * and a model asked for a second weapon it does not have writes a pool of
 * `0k1` — a weapon that reads as real until you look at the numbers.
 */
function allowNull(schema: JsonSchema): void
{
  if (Array.isArray(schema.anyOf)) {
    const branches = schema.anyOf as JsonSchema[];
    if (!branches.some(branch => branch.type === 'null')) branches.push({ type: 'null' });
    return;
  }

  if (typeof schema.type === 'string') {
    schema.type = [schema.type, 'null'];
    return;
  }

  if (Array.isArray(schema.type) && !schema.type.includes('null')) {
    schema.type = [...schema.type, 'null'];
  }
}

/**
 * Strict Structured Outputs requires every object property to be present, so an
 * optional field becomes a required one that may be null. The paths of those
 * fields are collected as they are rewritten: Zod's `.optional()` accepts
 * `undefined` and rejects `null`, so the provider has to undo the substitution
 * before parsing — see `stripWireNulls`. This is only a wire format conversion;
 * it does not modify DTOs.
 */
function makeAllObjectPropertiesRequired(schema: JsonSchema, path: string[], optionalPaths: string[][]): void
{
  const properties = schema.properties;
  if (isJsonSchema(properties)) {
    const originallyRequired = new Set(Array.isArray(schema.required) ? schema.required as string[] : []);

    for (const [key, propertySchema] of Object.entries(properties)) {
      if (!isJsonSchema(propertySchema)) continue;

      if (!originallyRequired.has(key)) {
        allowNull(propertySchema);
        optionalPaths.push([...path, key]);
      }

      makeAllObjectPropertiesRequired(propertySchema, [...path, key], optionalPaths);
    }

    schema.required = Object.keys(properties);
    schema.additionalProperties = false;
  }

  const items = schema.items;
  if (isJsonSchema(items)) makeAllObjectPropertiesRequired(items, [...path, ITEMS_SEGMENT], optionalPaths);

  for (const keyword of ['anyOf', 'allOf'] as const) {
    const branches = schema[keyword];
    if (!Array.isArray(branches)) continue;
    for (const branch of branches) {
      if (isJsonSchema(branch)) makeAllObjectPropertiesRequired(branch, path, optionalPaths);
    }
  }

  for (const keyword of ['$defs', 'definitions'] as const) {
    const definitions = schema[keyword];
    if (!isJsonSchema(definitions)) continue;
    for (const definition of Object.values(definitions)) {
      if (isJsonSchema(definition)) makeAllObjectPropertiesRequired(definition, path, optionalPaths);
    }
  }
}

/**
 * The editor schema contains local quality constraints (such as `minLength`
 * and numeric ranges). Structured Outputs guarantees the *shape* of the
 * response but does not enforce these, and rejects several of them outright,
 * so they cannot be sent as keywords. Dropping them silently is what made the
 * model produce drafts that Zod then rejected, so each constraint is folded
 * into the node's `description` instead: the model reads it, and Zod still
 * enforces it after the response returns.
 */
const constraintDescriptions: Record<string, (value: unknown) => string | null> = {
  minLength: value => typeof value === 'number' ? `at least ${value} characters` : null,
  maxLength: value => typeof value === 'number' ? `at most ${value} characters` : null,
  pattern: value => typeof value === 'string' ? `must match the regular expression ${value}` : null,
  format: value => typeof value === 'string' ? `${value} format` : null,
  minimum: value => typeof value === 'number' ? `minimum ${value}` : null,
  maximum: value => typeof value === 'number' ? `maximum ${value}` : null,
  exclusiveMinimum: value => typeof value === 'number' ? `greater than ${value}` : null,
  exclusiveMaximum: value => typeof value === 'number' ? `less than ${value}` : null,
  multipleOf: value => typeof value === 'number' ? `a multiple of ${value}` : null,
  minItems: value => typeof value === 'number' ? `at least ${value} items` : null,
  maxItems: value => typeof value === 'number' ? `at most ${value} items` : null,
  uniqueItems: value => value === true ? 'items must be unique' : null,
};

/** Annotations and keywords that carry nothing the model can act on. */
const droppedKeywords = new Set([
  '$schema',
  '$id',
  '$comment',
  'title',
  'default',
  'examples',
  'example',
  'readOnly',
  'writeOnly',
  'deprecated',
  'contentEncoding',
  'contentMediaType',
  'contains',
  'minContains',
  'maxContains',
  'minProperties',
  'maxProperties',
  'propertyNames',
  'unevaluatedProperties',
  'dependentRequired',
  'dependentSchemas',
  'dependencies',
]);

function appendDescription(schema: JsonSchema, notes: readonly string[]): void
{
  if (notes.length === 0) return;

  const existing = typeof schema.description === 'string' ? schema.description.trim() : '';
  const rendered = notes.join('; ');
  schema.description = existing.length > 0 ? `${existing} (${rendered})` : rendered;
}

function rewriteUnsupportedStructuredOutputKeywords(value: unknown): void
{
  if (Array.isArray(value)) {
    value.forEach(rewriteUnsupportedStructuredOutputKeywords);
    return;
  }

  if (!isJsonSchema(value)) return;

  const notes: string[] = [];

  for (const [key, child] of Object.entries(value)) {
    if (droppedKeywords.has(key)) {
      delete value[key];
      continue;
    }

    const describeConstraint = constraintDescriptions[key];
    if (describeConstraint) {
      const note = describeConstraint(child);
      if (note !== null) notes.push(note);
      delete value[key];
      continue;
    }

    if (schemaMapKeywords.has(key)) {
      if (isJsonSchema(child)) {
        for (const namedSchema of Object.values(child)) {
          rewriteUnsupportedStructuredOutputKeywords(namedSchema);
        }
      }
      continue;
    }

    rewriteUnsupportedStructuredOutputKeywords(child);
  }

  appendDescription(value, notes);
}

/**
 * Constraints carried by Zod refinements, by `z.ulid()`, or by the acceptance
 * rules never survive into JSON Schema in a form Structured Outputs can
 * enforce, so the only way to state them is prose on the node that carries
 * them. `[]` navigates into an array's `items`.
 */
const ITEMS_SEGMENT = '[]';

/**
 * Identifiers the proposal owns. Models cannot produce Crockford base32 ULIDs,
 * so the wire contract asks for placeholders and the server mints the real
 * ULIDs afterwards — see `normalizeAiProposalIdentifiers`.
 */
const ownedIdentifierDescription = 'Short placeholder identifier you choose, unique within this array '
  + '(for example "w1"). The server replaces it with a real identifier.';

const ownedIdentifierPaths: readonly (readonly string[])[] = [
  ['talents', 'talents'],
  ['combat', 'defenses'],
  ['combat', 'offenses'],
  ['combat', 'powers'],
  ['buffs', 'buffProfiles'],
  ['buffs', 'stanceModifierProfiles'],
  ['buffs', 'stateModifierProfiles'],
  ['buffs', 'otherModifierProfiles'],
].map(path => [...path, ITEMS_SEGMENT, 'id']);

/**
 * Identifiers that must match a global compendium record supplied in the
 * context. Inventing one fails acceptance validation, so the schema says so.
 */
const catalogIdentifierDescription = 'Copy this identifier verbatim from allowedCatalog or from the reference '
  + 'characters supplied in the context. Never invent one: leave the array empty instead and explain it in warnings.';

const catalogIdentifierPaths: readonly (readonly string[])[] = [
  ['header', 'raceId'],
  ['combat', 'powers', ITEMS_SEGMENT, 'spells', ITEMS_SEGMENT, 'id'],
  ['combat', 'powers', ITEMS_SEGMENT, 'powerSpecificationId'],
];

/**
 * The schema is built once, but the permission is per request, so the wording
 * has to describe both branches and point at the flag that decides which one
 * applies.
 */
const conditionalIdentifierDescription = (flag: string): string =>
  `Copy this identifier verbatim from allowedCatalog. Only when request.constraints.${flag} is true may you `
  + 'instead author a new entry and give it a short placeholder identifier, which the server replaces. '
  + 'Otherwise an entry that is not in the catalog is discarded.';

const conditionalIdentifierPaths: ReadonlyArray<readonly [readonly string[], string]> = [
  [['equipment', 'weapons', ITEMS_SEGMENT, 'id'], 'allowCustomEquipment'],
  [['equipment', 'armors', ITEMS_SEGMENT, 'id'], 'allowCustomEquipment'],
  [['equipment', 'shields', ITEMS_SEGMENT, 'id'], 'allowCustomEquipment'],
  [['equipment', 'inventory', ITEMS_SEGMENT, 'id'], 'allowCustomEquipment'],
  [['equipment', 'mounts', ITEMS_SEGMENT, 'id'], 'allowCustomEquipment'],
  [['perks', ITEMS_SEGMENT, 'id'], 'allowCustomAbilities'],
  [['combat', 'maneuvers', ITEMS_SEGMENT, 'id'], 'allowCustomAbilities'],
  [['combat', 'stances', ITEMS_SEGMENT, 'id'], 'allowCustomAbilities'],
  [['combat', 'states', ITEMS_SEGMENT, 'id'], 'allowCustomAbilities'],
];

/**
 * Requirements are written with Polish statistic labels („Większy Fortel ≥ 5",
 * „walka wręcz ≥ 6") while the DTO keys are English, and nothing connected the
 * two. The model had to guess that `artifice` is fortel — it guessed right and
 * then warned that the attribute might not exist. `SKILLS` is the same table
 * `formatRequirement` renders those labels from, so the wording matches exactly.
 */
const statisticAnnotations = SKILLS.flatMap(([group, key, polish]) => [
  [['statistics', group, key], `Cecha „${polish}". Requirements naming ${polish} refer to this field.`] as const,
  // 7 of 3225 statistics in this compendium carry a non-zero bonus or test
  // bonus. They are manual adjustments, not a place to pre-apply a perk: the
  // application derives those itself, so writing them here counts them twice.
  [
    ['statistics', group, key, 'bonus'],
    'Manual adjustment, almost always 0. Effects of perks, stances and buffs are applied by the application, not written in here.',
  ] as const,
  [
    ['statistics', group, key, 'testBonus'],
    'Manual adjustment to test rolls, almost always 0. Do not use it to pre-apply a perk the character already holds.',
  ] as const,
]);

/**
 * Critical power and range are the character's training plus the weapon's own
 * modifier, and that modifier is often negative: „Walka Wręcz" is −3, „Żelazne
 * Rękawice" −3, „Prymitywna Włócznia" −2, the ordinary „Włócznia" 0 with a −2
 * range. Fourteen weapons subtract, seventy add.
 *
 * So the first version of this — „never leave it at 0" — was wrong: a spearman
 * reaches zero honestly. What the model must not do is ignore the catalog and
 * guess. Median across built characters is 3 for power and 1 for range.
 */
const criticalAnnotations = ['leadingWeapon', 'secondaryWeapon'].flatMap(slot => [
  [
    ['combat', 'offenses', ITEMS_SEGMENT, slot, 'critical', 'power'],
    'Critical power: the character\'s training plus the weapon\'s own critical from the catalog, which may be negative — unarmed is −3 and a primitive spear −2. Median for a built character is 3. Do not leave it at 0 unless the weapon you chose actually subtracts that much.',
  ] as const,
  [
    ['combat', 'offenses', ITEMS_SEGMENT, slot, 'critical', 'range'],
    'Critical range, widening the window that scores a critical: 0 means only the highest face crits, 1 means the top two. Median 1, and the weapon\'s own range from the catalog applies here too — a plain spear carries −2.',
  ] as const,
]);

/**
 * The attack pool the reference fighters actually roll: 2k5+2, 2k4+2, 2k3+0.
 *
 * Two facts the model kept getting wrong. A one-die attack pool is close to
 * nonexistent on a real character — it is what you get by reading a weapon's
 * own entry and forgetting that the character's training adds dice — and the
 * flat bonus is not decoration either. „1k10+2" came back from a review for
 * exactly this reason: the die size was right and the pool was a single die.
 */
const attackPoolAnnotations = ['leadingWeapon', 'secondaryWeapon'].flatMap(slot => [
  [
    ['combat', 'offenses', ITEMS_SEGMENT, slot, 'amount'],
    'Number of attack dice, counting the character\'s training and not only the weapon entry. Real characters roll 2 or more; a pool of 1 is very rare and almost always a mistake. Use 0 only when the slot holds no weapon at all.',
  ] as const,
  [
    ['combat', 'offenses', ITEMS_SEGMENT, slot, 'grade'],
    'Rung on the dice ladder, not the die size: grade 5 rolls k10. Copy it from the weapon entry in the catalog rather than guessing.',
  ] as const,
  // Measured over the 191 attack sets in the compendium that roll any dice:
  // median +1, and +2 among wojacy and rycerze. Zero is a real minority
  // position at 17%, not an error, so this says „usually" and stops there.
  [
    ['combat', 'offenses', ITEMS_SEGMENT, slot, 'bonus'],
    'Flat addition to the attack pool. Usually +1, and +2 for a trained fighter; 0 is uncommon but legitimate.',
  ] as const,
]);

/**
 * An `amount` of 0 turns the whole damage pool into a single number, which is
 * how „obrażenia +7" reached the review.
 *
 * Measured, though, a flat damage bonus is not the anomaly the first version of
 * this said it was: a third of the compendium's warriors and half of everyone
 * carry no damage die at all. Median 1, so one die is the ordinary answer and
 * zero is a choice rather than a mistake.
 */
const damageAnnotations = ['damageBonus', 'additionalDamageBonus'].map(slot =>
  [
    ['combat', 'offenses', ITEMS_SEGMENT, slot, 'amount'],
    'Number of damage dice, usually 1. Use 0 for a character whose damage really is a flat bonus — that is a third of the fighters here, so it is a decision to make rather than a value to avoid.',
  ] as const,
);

const wireSchemaAnnotations: ReadonlyArray<readonly [readonly string[], string]> = [
  ...statisticAnnotations,
  ...criticalAnnotations,
  ...attackPoolAnnotations,
  ...damageAnnotations,
  [
    ['header', 'tags'],
    'Lowercase single words without spaces, for example "wojownik".',
  ],
  [
    ['header', 'tags', ITEMS_SEGMENT],
    'A single lowercase word with no spaces and no uppercase letters, for example "wojownik".',
  ],
  [
    ['combat', 'defaultDefenseId'],
    'The id of one of the entries in combat.defenses, or null.',
  ],
  [
    ['combat', 'defaultOffenseId'],
    'The id of one of the entries in combat.offenses, or null.',
  ],
  [
    ['buffs', 'activeBuffProfileIds'],
    'Ids of entries in buffs.buffProfiles.',
  ],
  [
    ['buffs', 'activeStanceModifierProfileIds'],
    'Ids of entries in buffs.stanceModifierProfiles.',
  ],
  [
    ['buffs', 'activeStateModifierProfileIds'],
    'Ids of entries in buffs.stateModifierProfiles.',
  ],
  [
    ['buffs', 'activeOtherModifierProfileIds'],
    'Ids of entries in buffs.otherModifierProfiles.',
  ],
  [
    ['perks'],
    'The character\'s atuty. Take them from allowedCatalog and respect the requirements each one lists.',
  ],
  ...ownedIdentifierPaths.map(path => [path, ownedIdentifierDescription] as const),
  ...catalogIdentifierPaths.map(path => [path, catalogIdentifierDescription] as const),
  ...conditionalIdentifierPaths.map(([path, flag]) => [path, conditionalIdentifierDescription(flag)] as const),
  [
    ['buffs', 'buffProfiles', ITEMS_SEGMENT, 'linkedEntityId'],
    'The id of an entry in combat.stances or combat.states, or null.',
  ],
  [
    ['buffs', 'stanceModifierProfiles', ITEMS_SEGMENT, 'linkedEntityId'],
    'The id of an entry in combat.stances, or null.',
  ],
  [
    ['buffs', 'stateModifierProfiles', ITEMS_SEGMENT, 'linkedEntityId'],
    'The id of an entry in combat.states, or null.',
  ],
  [
    ['buffs', 'otherModifierProfiles', ITEMS_SEGMENT, 'linkedEntityId'],
    'The id of an entry in combat.stances or combat.states, or null.',
  ],
];

function resolveSchemaPath(schema: JsonSchema, path: readonly string[]): JsonSchema | null
{
  let node: JsonSchema | null = schema;

  for (const segment of path) {
    if (node === null) return null;

    if (segment === ITEMS_SEGMENT) {
      const items: unknown = node.items;
      node = isJsonSchema(items) ? items : null;
      continue;
    }

    const properties: unknown = node.properties;
    const next: unknown = isJsonSchema(properties) ? properties[segment] : undefined;
    node = isJsonSchema(next) ? next : null;
  }

  return node;
}

function annotateWireSchema(schema: JsonSchema): void
{
  for (const [path, description] of wireSchemaAnnotations) {
    const node = resolveSchemaPath(schema, path);
    if (node === null) {
      // A renamed or removed field must not silently lose its contract.
      throw new Error(`AI wire schema annotation targets a missing path: ${path.join('.')}`);
    }
    node.description = description;
  }
}

const optionalWirePaths: string[][] = [];

function createOpenAiStrictSchema(): JsonSchema
{
  const schema = z.toJSONSchema(aiCharacterProposalSchema, {
    target: 'draft-7',
    io: 'input',
  }) as JsonSchema;

  rewriteUnsupportedStructuredOutputKeywords(schema);
  annotateWireSchema(schema);
  makeAllObjectPropertiesRequired(schema, [], optionalWirePaths);
  return toStrictJsonSchema(schema as Parameters<typeof toStrictJsonSchema>[0]) as JsonSchema;
}

/**
 * Existing editor schemas deliberately use coercions and transforms (for
 * example, normalising a power type). OpenAI's Zod helper serialises output
 * schemas and rejects transforms. The model produces the input representation
 * instead; the provider still parses it through the application schema before
 * anything can be persisted.
 */
export const aiCharacterProposalStrictJsonSchema = createOpenAiStrictSchema();

/**
 * Paths of the fields the wire schema turned from optional into
 * nullable-but-required, in the `[]`-for-items notation. `stripWireNulls`
 * consumes them; nothing else should need to know.
 */
export const OPTIONAL_WIRE_PATHS: readonly (readonly string[])[] = optionalWirePaths;

/**
 * Removes the `null`s the wire format made necessary, so an absent optional
 * field arrives at Zod as absent rather than as an explicit null it rejects.
 * Values at every other path are left exactly as the model wrote them.
 */
export function stripWireNulls(value: unknown): unknown
{
  for (const path of optionalWirePaths) stripNullAt(value, path);
  return value;
}

function stripNullAt(node: unknown, path: readonly string[]): void
{
  if (node === null || node === undefined) return;

  if (path.length === 0) return;

  const [segment, ...rest] = path;

  if (segment === ITEMS_SEGMENT) {
    if (Array.isArray(node)) node.forEach(item => stripNullAt(item, rest));
    return;
  }

  if (typeof node !== 'object' || Array.isArray(node)) return;

  const record = node as Record<string, unknown>;
  if (rest.length === 0) {
    if (record[segment] === null) delete record[segment];
    return;
  }

  stripNullAt(record[segment], rest);
}

export const openAiCharacterProposalResponseFormat = {
  type: 'json_schema' as const,
  name: 'ai_character_proposal',
  strict: true,
  schema: aiCharacterProposalStrictJsonSchema,
};
