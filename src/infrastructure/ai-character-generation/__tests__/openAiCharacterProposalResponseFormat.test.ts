import { describe, expect, it } from 'vitest';
import { aiCharacterProposalSchema } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import { normalizeAiProposalIdentifiers } from '@/domain/ai-character-generation/normalizeAiProposalIdentifiers';
import {
  OPTIONAL_WIRE_PATHS,
  aiCharacterProposalStrictJsonSchema,
  stripWireNulls,
} from '@/infrastructure/ai-character-generation/openAiCharacterProposalResponseFormat';

type JsonSchema = Record<string, unknown>;

const unsupportedKeywords = new Set([
  'minLength',
  'maxLength',
  'pattern',
  'format',
  'minimum',
  'maximum',
  'minItems',
  'maxItems',
  'default',
  'title',
]);

/**
 * The keys inside `properties` are field names chosen by the DTOs, not JSON
 * Schema keywords. Conflating the two is exactly the defect this suite guards:
 * a field called `description` was being deleted as if it were an annotation.
 */
const schemaMapKeywords = new Set(['properties', '$defs', 'definitions', 'patternProperties', 'dependentSchemas']);

function collectSchemaKeywords(value: unknown, keywords: Set<string>): void
{
  if (Array.isArray(value)) {
    value.forEach(item => collectSchemaKeywords(item, keywords));
    return;
  }

  if (typeof value !== 'object' || value === null) return;

  for (const [key, child] of Object.entries(value)) {
    if (schemaMapKeywords.has(key)) {
      if (typeof child === 'object' && child !== null) {
        Object.values(child).forEach(namedSchema => collectSchemaKeywords(namedSchema, keywords));
      }
      continue;
    }

    keywords.add(key);
    collectSchemaKeywords(child, keywords);
  }
}

function at(path: readonly string[]): JsonSchema
{
  let node: unknown = aiCharacterProposalStrictJsonSchema;

  for (const segment of path) {
    const current = node as JsonSchema;
    node = segment === '[]' ? current.items : (current.properties as JsonSchema)[segment];
    expect(node, `missing schema node at ${path.join('.')}`).toBeTypeOf('object');
  }

  return node as JsonSchema;
}

/** Produces the response a model constrained by this schema would give. */
function generateConformingResponse(node: JsonSchema, arrayLength: number): unknown
{
  // Optional fields answer with null, which is the whole point of the change:
  // an absent second weapon must not have to be faked as a pool of zeros.
  if (Array.isArray(node.type) && node.type.includes('null')) return null;
  if (Array.isArray(node.anyOf)) {
    const branches = node.anyOf as JsonSchema[];
    if (branches.some(branch => branch.type === 'null')) return null;
    return generateConformingResponse(branches[0], arrayLength);
  }
  if (Array.isArray(node.enum)) return node.enum[0];

  const description = typeof node.description === 'string' ? node.description : '';

  switch (node.type) {
    case 'object': {
      const properties = (node.properties ?? {}) as Record<string, JsonSchema>;
      return Object.fromEntries(
        Object.entries(properties).map(([key, child]) => [key, generateConformingResponse(child, arrayLength)]),
      );
    }
    case 'array':
      return Array.from(
        { length: arrayLength },
        () => generateConformingResponse(node.items as JsonSchema, 0),
      );
    case 'string':
      if (description.startsWith('Short placeholder')) return 'placeholder-1';
      if (description.startsWith('Copy this identifier')) return '01J0000000000000000000000A';
      if (description.includes('lowercase word')) return 'wojownik';
      return 'Tekst';
    case 'integer':
    case 'number': {
      const minimum = /minimum (-?\d+)/.exec(description);
      return minimum ? Number(minimum[1]) : 1;
    }
    case 'boolean':
      return true;
    default:
      return null;
  }
}

describe('aiCharacterProposalStrictJsonSchema', () => {
  it('keeps the OpenAI wire schema to its structural subset', () => {
    const keywords = new Set<string>();
    collectSchemaKeywords(aiCharacterProposalStrictJsonSchema, keywords);

    for (const unsupportedKeyword of unsupportedKeywords) {
      expect(keywords).not.toContain(unsupportedKeyword);
    }
  });

  it('still asks the model for every DTO field, including one named like an annotation', () => {
    expect(Object.keys(at(['header']).properties as JsonSchema)).toContain('description');
    expect(at(['header']).required).toContain('description');
    expect(Object.keys(at(['equipment', 'weapons', '[]']).properties as JsonSchema)).toContain('description');
  });

  it('names each statistic the way requirements name it', () => {
    // Requirements read „Większy Fortel ≥ 5" while the field is `artifice`.
    // Without the link the model has to guess, and it warned that the attribute
    // might not exist at all.
    expect(at(['statistics', 'attributes', 'artifice']).description).toContain('fortel');
    expect(at(['statistics', 'attributes', 'martialArt']).description).toContain('walka wręcz');
    expect(at(['statistics', 'characteristics', 'strength']).description).toContain('siła');
  });

  it('states dropped Zod constraints as prose the model can act on', () => {
    expect(at(['header', 'shortName']).description).toContain('at most 15 characters');
    expect(at(['talents', 'talents', '[]', 'grade']).description).toContain('maximum 50');
  });

  it('separates identifiers the draft owns from identifiers copied out of the catalog', () => {
    expect(at(['talents', 'talents', '[]', 'id']).description).toContain('placeholder');
    expect(at(['combat', 'defenses', '[]', 'id']).description).toContain('placeholder');
    expect(at(['combat', 'stances', '[]', 'id']).description).toContain('verbatim');
    expect(at(['combat', 'powers', '[]', 'powerSpecificationId']).description).toContain('verbatim');
    // Equipment is compendium data, so it is copied rather than authored.
    expect(at(['equipment', 'weapons', '[]', 'id']).description).toContain('verbatim');
    expect(at(['equipment', 'mounts', '[]', 'id']).description).toContain('verbatim');
  });

  it('lets an optional field answer with null instead of faking a value', () => {
    const secondaryWeapon = at(['combat', 'offenses', '[]', 'secondaryWeapon']);
    expect(secondaryWeapon.type).toEqual(['object', 'null']);

    // And the substitution is undone before the DTO ever sees it.
    const stripped = stripWireNulls({ header: { name: 'Arnold', raceId: null } }) as {
      header: Record<string, unknown>;
    };
    expect('raceId' in stripped.header).toBe(false);
    expect(OPTIONAL_WIRE_PATHS.some(path => path.join('.') === 'header.raceId')).toBe(true);
  });

  it('accepts a response that satisfies the wire schema', () => {
    for (const arrayLength of [0, 1]) {
      const response = generateConformingResponse(aiCharacterProposalStrictJsonSchema, arrayLength);
      // Exactly what a provider does: undo the wire substitution, then normalise.
      const result = aiCharacterProposalSchema.safeParse(
        normalizeAiProposalIdentifiers(stripWireNulls(response)),
      );

      expect(
        result.success ? [] : result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
      ).toEqual([]);
    }
  });
});
