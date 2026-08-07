import { describe, expect, it } from 'vitest';
import {
  buildTagFacetConditions,
  buildTagFacetIndex,
  spellingsForEntity,
  toMongoTagConditions,
  toPrismaTagConditions,
  type TagDefinitionRecord,
  type TagFacetDefinition,
} from '@/domain/tags/tagFacets';

const kindFacet: TagFacetDefinition = {
  key: 'rodzaj-istoty',
  label: 'Rodzaj istoty',
  order: 1,
  selectionMode: 'multi',
  supportsNone: true,
  entities: ['maneuvers', 'characters', 'perks'],
};

const qualityFacet: TagFacetDefinition = {
  key: 'jakość',
  label: 'Jakość',
  order: 2,
  selectionMode: 'multi',
  supportsNone: false,
  entities: ['weapons'],
};

const definitions: TagDefinitionRecord[] = [
  { tag: 'zwierzęta', facetKey: 'rodzaj-istoty', order: 1, aliases: [{ alias: 'natura', entities: ['characters'] }] },
  { tag: 'nieumarli', facetKey: 'rodzaj-istoty', order: 2, aliases: [{ alias: 'nieumarły', entities: ['characters'] }] },
  { tag: 'demon', facetKey: 'rodzaj-istoty', order: 3, aliases: [{ alias: 'demoniczne', entities: ['maneuvers'] }] },
  { tag: 'magiczne', facetKey: 'jakość', order: 1, aliases: [] },
];

describe('spellingsForEntity', () => {
  it('keeps the canonical tag first and adds only aliases scoped to the entity', () => {
    const zwierzeta = definitions[0]!;
    expect(spellingsForEntity(zwierzeta, 'characters')).toEqual(['zwierzęta', 'natura']);
    expect(spellingsForEntity(zwierzeta, 'maneuvers')).toEqual(['zwierzęta']);
  });
});

describe('buildTagFacetIndex', () => {
  it('narrows values to the spellings the entity actually carries', () => {
    const index = buildTagFacetIndex('characters', [kindFacet], definitions, ['natura', 'nieumarły', 'wojak']);
    const facet = index.facets.find(candidate => candidate.key === 'rodzaj-istoty')!;

    expect(facet.values.map(value => value.tag)).toEqual(['zwierzęta', 'nieumarli']);
    expect(facet.values[0]!.spellings).toEqual(['natura']);
    expect(facet.allSpellings).toEqual(['natura', 'nieumarły']);
  });

  it('never hides a tag no definition claims', () => {
    const index = buildTagFacetIndex('characters', [kindFacet], definitions, ['natura', 'wojak', 'mag']);

    expect(index.unassigned).toEqual(['mag', 'wojak']);
  });

  it('does not pull `natura` into creature kind on a Perk, where it means a school of magic', () => {
    const index = buildTagFacetIndex('perks', [kindFacet], definitions, ['natura', 'zwierzęta']);
    const facet = index.facets.find(candidate => candidate.key === 'rodzaj-istoty')!;

    expect(facet.allSpellings).toEqual(['zwierzęta']);
    expect(index.unassigned).toEqual(['natura']);
  });

  it('drops a facet that has nothing to show on this entity', () => {
    const index = buildTagFacetIndex('maneuvers', [kindFacet, qualityFacet], definitions, ['demoniczne']);

    expect(index.facets.map(facet => facet.key)).toEqual(['rodzaj-istoty']);
  });

  it('includes every spelling when built for filtering rather than rendering', () => {
    const index = buildTagFacetIndex('characters', [kindFacet], definitions);
    const facet = index.facets.find(candidate => candidate.key === 'rodzaj-istoty')!;

    expect(facet.allSpellings).toEqual(['zwierzęta', 'natura', 'nieumarli', 'nieumarły', 'demon']);
    expect(index.unassigned).toEqual([]);
  });
});

describe('buildTagFacetConditions', () => {
  const index = buildTagFacetIndex('characters', [kindFacet], definitions, ['natura', 'nieumarły', 'wojak']);

  it('ORs values inside a facet, expanded to entity spellings', () => {
    const conditions = buildTagFacetConditions([{ facetKey: 'rodzaj-istoty', tags: ['zwierzęta', 'nieumarli'] }], index);

    expect(conditions).toEqual([{ facetKey: 'rodzaj-istoty', anyOf: ['natura', 'nieumarły'], noneOf: null }]);
  });

  it('negates the WHOLE facet for "— brak —", aliases included', () => {
    const conditions = buildTagFacetConditions([{ facetKey: 'rodzaj-istoty', tags: [], includeNone: true }], index);

    expect(conditions).toEqual([{ facetKey: 'rodzaj-istoty', anyOf: [], noneOf: ['natura', 'nieumarły'] }]);
  });

  it('treats values plus "— brak —" as a union, not an intersection', () => {
    const conditions = buildTagFacetConditions([{ facetKey: 'rodzaj-istoty', tags: ['nieumarli'], includeNone: true }], index);

    expect(conditions[0]).toEqual({ facetKey: 'rodzaj-istoty', anyOf: ['nieumarły'], noneOf: ['natura', 'nieumarły'] });
  });

  it('drops filters that would narrow nothing', () => {
    expect(buildTagFacetConditions([{ facetKey: 'rodzaj-istoty', tags: [] }], index)).toEqual([]);
    expect(buildTagFacetConditions([{ facetKey: 'nie-ma', tags: ['x'] }], index)).toEqual([]);
    expect(buildTagFacetConditions([{ facetKey: 'rodzaj-istoty', tags: ['nie-ma'] }], index)).toEqual([]);
  });

  it('ignores "— brak —" on a facet that does not support it', () => {
    const weapons = buildTagFacetIndex('weapons', [qualityFacet], definitions, ['magiczne']);

    expect(buildTagFacetConditions([{ facetKey: 'jakość', tags: [], includeNone: true }], weapons)).toEqual([]);
  });
});

describe('renderers', () => {
  const conditions = [
    { facetKey: 'a', anyOf: ['x', 'y'], noneOf: null },
    { facetKey: 'b', anyOf: [], noneOf: ['p'] },
    { facetKey: 'c', anyOf: ['x'], noneOf: ['x', 'y'] },
  ];

  it('renders Prisma clauses', () => {
    expect(toPrismaTagConditions(conditions)).toEqual([
      { tags: { hasSome: ['x', 'y'] } },
      { NOT: { tags: { hasSome: ['p'] } } },
      { OR: [{ tags: { hasSome: ['x'] } }, { NOT: { tags: { hasSome: ['x', 'y'] } } }] },
    ]);
  });

  it('renders the same conditions as Mongo fragments', () => {
    expect(toMongoTagConditions(conditions)).toEqual([
      { tags: { $in: ['x', 'y'] } },
      { tags: { $nin: ['p'] } },
      { $or: [{ tags: { $in: ['x'] } }, { tags: { $nin: ['x', 'y'] } }] },
    ]);
  });

  it('keeps the two renderers structurally in step', () => {
    expect(toPrismaTagConditions(conditions)).toHaveLength(toMongoTagConditions(conditions).length);
  });
});
