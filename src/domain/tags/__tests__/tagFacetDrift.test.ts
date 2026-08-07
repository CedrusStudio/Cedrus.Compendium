import { describe, expect, it } from 'vitest';
import { DRIFT_ALERT_THRESHOLD, findTagFacetDrift, significantUndefinedTags, type TagUsage } from '@/domain/tags/tagFacetDrift';
import type { TagDefinitionRecord, TagFacetDefinition } from '@/domain/tags/tagFacets';

const facets: TagFacetDefinition[] = [{
  key: 'rodzaj-istoty',
  label: 'Rodzaj istoty',
  order: 1,
  selectionMode: 'multi',
  supportsNone: true,
  entities: ['maneuvers', 'characters'],
}];

const definitions: TagDefinitionRecord[] = [
  { tag: 'zwierzęta', facetKey: 'rodzaj-istoty', aliases: [{ alias: 'natura', entities: ['characters'] }] },
  { tag: 'gadzie', facetKey: 'rodzaj-istoty', aliases: [] },
];

describe('findTagFacetDrift', () => {
  it('reports tags no definition claims, busiest first', () => {
    const usage: TagUsage = {
      maneuvers: { 'zwierzęta': 127, 'krytyk': 71, 'fortel': 81 },
      characters: { 'natura': 25, 'krytyk': 4 },
    };

    const drift = findTagFacetDrift(usage, facets, definitions);

    // `fortel` 81 outranks `krytyk` 71 + 4 = 75 — the count is summed ACROSS
    // entities, which is the whole point of ordering by it.
    expect(drift.undefinedTags.map(entry => entry.tag)).toEqual(['fortel', 'krytyk']);
    expect(drift.undefinedTags.find(entry => entry.tag === 'krytyk'))
      .toEqual({ tag: 'krytyk', entities: ['maneuvers', 'characters'], occurrences: 75 });
  });

  it('counts an alias as claimed, so a scoped spelling is not reported as drift', () => {
    const drift = findTagFacetDrift({ characters: { 'natura': 25 } }, facets, definitions);

    expect(drift.undefinedTags).toEqual([]);
  });

  it('reports definitions nothing uses', () => {
    const drift = findTagFacetDrift({ maneuvers: { 'zwierzęta': 1 } }, facets, definitions);

    expect(drift.unusedDefinitions).toEqual([{ tag: 'gadzie', facetKey: 'rodzaj-istoty' }]);
  });

  it('reports a facet scoped to an entity that carries none of its tags', () => {
    const drift = findTagFacetDrift({ maneuvers: { 'zwierzęta': 1 }, characters: { 'wojak': 48 } }, facets, definitions);

    expect(drift.deadFacetEntities).toEqual([{ facetKey: 'rodzaj-istoty', entity: 'characters' }]);
  });

  it('keeps a single mistyped tag below the alert threshold', () => {
    const drift = findTagFacetDrift({ maneuvers: { 'ofensywna': 1, 'krytyk': 71 } }, facets, definitions);

    expect(significantUndefinedTags(drift).map(entry => entry.tag)).toEqual(['krytyk']);
    expect(DRIFT_ALERT_THRESHOLD).toBeGreaterThan(1);
  });
});
