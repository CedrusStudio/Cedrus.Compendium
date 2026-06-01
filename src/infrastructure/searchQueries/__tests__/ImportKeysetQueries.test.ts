import { describe, expect, it } from 'vitest';
import { createManeuverKeysetQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverKeysetQuery';
import { createPerkKeysetQuery } from '@/infrastructure/searchQueries/perks/createPerkKeysetQuery';
import { createSpellKeysetQuery } from '@/infrastructure/searchQueries/spells/createSpellKeysetQuery';
import { createStanceKeysetQuery } from '@/infrastructure/searchQueries/stances/createStanceKeysetQuery';
import { createStateKeysetQuery } from '@/infrastructure/searchQueries/states/createStateKeysetQuery';

describe('import keyset queries', () => {
  it.each([
    ['spell', createSpellKeysetQuery],
    ['maneuver', createManeuverKeysetQuery],
  ])('adds cast time and grade filters for %s imports', (_, factory) => {
    const query = factory(undefined, 'cursor-1', undefined, 20, undefined, ['Standardowa'], 4);

    expect(query.search).toEqual({
      grade: 4,
      castTime: { anyOf: ['Standardowa'] },
    });
  });

  it.each([
    ['perk', createPerkKeysetQuery],
    ['stance', createStanceKeysetQuery],
    ['state', createStateKeysetQuery],
  ])('adds grade filters for %s imports', (_, factory) => {
    const query = factory(undefined, 'cursor-1', undefined, 20, undefined, 6);

    expect(query.search).toEqual({
      grade: 6,
    });
  });
});