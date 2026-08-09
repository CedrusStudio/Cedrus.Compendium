import { describe, expect, it } from 'vitest';
import { DEFAULT_TAG_DEFINITIONS, DEFAULT_TAG_FACETS } from '@/domain/tags/defaultTagFacets';
import { spellingsForEntity, UNASSIGNED_FACET_KEY } from '@/domain/tags/tagFacets';
import { validateTagDefinitionAliases } from '@/domain/tags/validateTagAlias';
import { tagEntityModelMap } from '@/lib/tagEntityModels';

/**
 * Contract tests for the seeded layout.
 *
 * The headline one is "no double claim": the same spelling must not be owned by
 * two categories on the same entity. That is the only way a mistake here turns
 * into a WRONG search result rather than a worse-looking dropdown — `natura`
 * means nature magic on a Spell and an animal on a Character, and `zdrowie`
 * means a stat on a Perk and a healing effect on a Spell. Both were caught by
 * this rule while Wave 10.7 was being written.
 */
describe('DEFAULT_TAG_FACETS', () => {
  it('claims each spelling at most once per entity', () => {
    const clashes: string[] = [];

    for (const entity of Object.keys(tagEntityModelMap))
    {
      const owners = new Map<string, string[]>();

      for (const facet of DEFAULT_TAG_FACETS.filter(candidate => candidate.entities.includes(entity)))
      {
        for (const definition of DEFAULT_TAG_DEFINITIONS.filter(candidate => candidate.facetKey === facet.key))
        {
          for (const spelling of spellingsForEntity(definition, entity))
          {
            owners.set(spelling, [...(owners.get(spelling) ?? []), `${facet.key}/${definition.tag}`]);
          }
        }
      }

      for (const [spelling, claimedBy] of owners)
      {
        if (claimedBy.length > 1) clashes.push(`${entity}: "${spelling}" ← ${claimedBy.join(' + ')}`);
      }
    }

    expect(clashes).toEqual([]);
  });

  it('keeps `natura` out of the creature-kind category everywhere except Characters', () => {
    const creatureKind = DEFAULT_TAG_FACETS.find(facet => facet.key === 'rodzaj-istoty')!;
    const animals = DEFAULT_TAG_DEFINITIONS.find(definition => definition.tag === 'zwierzęta')!;

    expect(spellingsForEntity(animals, 'characters')).toContain('natura');
    expect(spellingsForEntity(animals, 'perks')).not.toContain('natura');
    // The power-source category must not reach Characters, or those 25 animals
    // would show up under "nature magic".
    expect(DEFAULT_TAG_FACETS.find(facet => facet.key === 'źródło-mocy')!.entities).not.toContain('characters');
    expect(creatureKind.entities).toContain('characters');
  });

  it('names only entities that exist', () => {
    const unknown = DEFAULT_TAG_FACETS
      .flatMap(facet => facet.entities.filter(entity => !tagEntityModelMap[entity]).map(entity => `${facet.key}:${entity}`));

    expect(unknown).toEqual([]);
  });

  it('points every definition at a defined category', () => {
    const keys = new Set(DEFAULT_TAG_FACETS.map(facet => facet.key));
    const orphans = DEFAULT_TAG_DEFINITIONS
      .filter(definition => definition.facetKey && !keys.has(definition.facetKey))
      .map(definition => definition.tag);

    expect(orphans).toEqual([]);
  });

  it('defines each tag exactly once — `TagDefinition.tag` is unique in the database', () => {
    const seen = new Map<string, number>();
    for (const definition of DEFAULT_TAG_DEFINITIONS) seen.set(definition.tag, (seen.get(definition.tag) ?? 0) + 1);

    expect([...seen.entries()].filter(([, count]) => count > 1)).toEqual([]);
  });

  it('leaves the reserved leftovers key alone', () => {
    // `__pozostale__` jest syntetyczne — prawdziwa kategoria o tym kluczu
    // przykryłaby kubeł na tagi bez kategorii i zniknęłaby z filtra.
    expect(DEFAULT_TAG_FACETS.map(facet => facet.key)).not.toContain(UNASSIGNED_FACET_KEY);
  });

  it('passes its own alias validation', () => {
    const violations = DEFAULT_TAG_DEFINITIONS
      .flatMap(definition => validateTagDefinitionAliases(definition, DEFAULT_TAG_FACETS, DEFAULT_TAG_DEFINITIONS)
        .map(violation => `${definition.tag}: ${violation.message}`));

    expect(violations).toEqual([]);
  });
});
