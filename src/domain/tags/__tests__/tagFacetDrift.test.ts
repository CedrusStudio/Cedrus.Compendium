import { describe, expect, it } from 'vitest';
import { DRIFT_ALERT_THRESHOLD, entitiesUsingTag, findTagFacetDrift, significantUndefinedTags, type TagUsage } from '@/domain/tags/tagFacetDrift';
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

  /**
   * The failure Marek hit: `krasnoludy` lives on Items, got assigned to a
   * Mounts-only category, and vanished from "unassigned" while doing nothing.
   */
  it('reports an assignment whose category covers none of the lists carrying the tag', () => {
    const mountsOnly: TagFacetDefinition[] = [{
      key: 'pochodzenie-wierzchowca', label: 'Pochodzenie', order: 1,
      selectionMode: 'multi', supportsNone: true, entities: ['mounts'],
    }];
    const misplaced: TagDefinitionRecord[] = [{ tag: 'krasnoludy', facetKey: 'pochodzenie-wierzchowca', aliases: [] }];

    const drift = findTagFacetDrift({ inventory: { 'krasnoludy': 2 } }, mountsOnly, misplaced);

    expect(drift.ineffectiveAssignments).toEqual([{
      tag: 'krasnoludy',
      facetKey: 'pochodzenie-wierzchowca',
      tagEntities: ['inventory'],
      facetEntities: ['mounts'],
    }]);
    // Nie może jednocześnie uchodzić za nieprzypisany — to jedno zjawisko.
    expect(drift.undefinedTags).toEqual([]);
  });

  it('says nothing when the category covers at least one list carrying the tag', () => {
    const drift = findTagFacetDrift({ maneuvers: { 'zwierzęta': 5 }, characters: { 'natura': 2 } }, facets, definitions);

    expect(drift.ineffectiveAssignments).toEqual([]);
  });

  it('does not double-report a tag nobody uses — that is already an unused definition', () => {
    const drift = findTagFacetDrift({ maneuvers: { 'zwierzęta': 1 } }, facets, definitions);

    expect(drift.unusedDefinitions.map(entry => entry.tag)).toEqual(['gadzie']);
    expect(drift.ineffectiveAssignments).toEqual([]);
  });

  /**
   * The real `durski`: a fighting style on Maneuvers and a breed on the one
   * Mount. The category reaches Maneuvers, so nothing is broken — but the Mount
   * quietly lands in "Pozostałe" and only a human can say whether that is right.
   */
  it('reports a category that reaches some of the tag lists but not all of them', () => {
    const drift = findTagFacetDrift({ maneuvers: { 'zwierzęta': 8 }, mounts: { 'zwierzęta': 1 } }, facets, definitions);

    expect(drift.partialCoverage).toEqual([{ facetKey: 'rodzaj-istoty', entity: 'mounts', tags: ['zwierzęta'] }]);
    // Nadal działa tam, gdzie sięga — to pytanie, nie błąd.
    expect(drift.ineffectiveAssignments).toEqual([]);
  });

  it('groups by category and list, so one decision is one line', () => {
    const usage: TagUsage = { maneuvers: { 'zwierzęta': 8, 'gadzie': 3 }, mounts: { 'zwierzęta': 1, 'gadzie': 1 } };

    // Dwa tagi, jedno pytanie: „czy Rodzaj istoty ma objąć Wierzchowce?".
    expect(findTagFacetDrift(usage, facets, definitions).partialCoverage)
      .toEqual([{ facetKey: 'rodzaj-istoty', entity: 'mounts', tags: ['zwierzęta', 'gadzie'] }]);
  });

  it('credits a contested spelling to the category that reaches the list', () => {
    // `natura` to magia natury na Zaklęciach i zwierzę na Postaciach. Bez tego
    // rozstrzygnięcia magiczna `natura` „występowałaby" na 25 Postaciach.
    const twoMeanings: TagFacetDefinition[] = [
      ...facets,
      { key: 'źródło-mocy', label: 'Źródło mocy', order: 2, selectionMode: 'multi', supportsNone: true, entities: ['spells'] },
    ];
    const withMagic: TagDefinitionRecord[] = [...definitions, { tag: 'natura', facetKey: 'źródło-mocy', aliases: [] }];
    const usage: TagUsage = { spells: { 'natura': 12 }, characters: { 'natura': 25 } };

    expect(entitiesUsingTag('natura', usage, withMagic, twoMeanings)).toEqual(['spells']);
    expect(entitiesUsingTag('zwierzęta', usage, withMagic, twoMeanings)).toEqual(['characters']);
    expect(findTagFacetDrift(usage, twoMeanings, withMagic).partialCoverage).toEqual([]);
  });

  it('keeps full coverage and no coverage out of the partial list', () => {
    const full = findTagFacetDrift({ maneuvers: { 'zwierzęta': 5 }, characters: { 'natura': 2 } }, facets, definitions);
    expect(full.partialCoverage).toEqual([]);

    const none = findTagFacetDrift({ perks: { 'zwierzęta': 5 } }, facets, definitions);
    expect(none.ineffectiveAssignments.map(entry => entry.tag)).toEqual(['zwierzęta']);
    expect(none.partialCoverage).toEqual([]);
  });
});

describe('entitiesUsingTag', () => {
  it('follows aliases, so a scoped spelling counts as the tag being present', () => {
    const usage: TagUsage = { characters: { 'natura': 25 }, maneuvers: { 'zwierzęta': 127 }, perks: { 'natura': 52 } };

    // `natura` is an alias of `zwierzęta` for Characters only — the Perk one is
    // a different meaning and must not be attributed here.
    expect(entitiesUsingTag('zwierzęta', usage, definitions)).toEqual(['characters', 'maneuvers']);
  });

  it('returns nothing for a tag the library does not carry', () => {
    expect(entitiesUsingTag('gadzie', { maneuvers: { 'zwierzęta': 1 } }, definitions)).toEqual([]);
  });
});
