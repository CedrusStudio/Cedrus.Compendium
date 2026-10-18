import { describe, expect, it } from 'vitest';
import { ownedFilterFor, narrowToOwned, ownedFilterKey } from '../characterOwnership';
import { CreateEmptyCharacter } from '@/domain/characters/Character';
import type { SearchEntityPayload } from '@/common/global/SearchPayloads';

const createCharacter = () => CreateEmptyCharacter({ name: 'Aldara', shortName: 'A', tags: [], description: '' });
describe('compendium membership identity and pagination', () => {
  it('owns exact IDs, including when names and grades are identical', () => {
    const character = createCharacter();
    character.perks = [{ id: 'owned', name: 'Same', grade: 1 } as never];
    expect(ownedFilterFor(character, 'perks')).toEqual({ values: ['owned'] });
  });
  it.each(['maneuvers','perks','stances','states'] as const)('selects exact IDs for %s', kind => {
    const character = createCharacter();
    character[kind] = [{ id: 'b' }, { id: 'a' }, { id: 'a' }] as never;
    expect(ownedFilterFor(character, kind).values).toEqual(['a','b']);
  });
  it.each(['weapons','armors','shields','inventory','mounts'] as const)('selects exact equipment IDs for %s', kind => {
    const character = createCharacter();
    character.equipment[kind] = [{ id: 'equipment' }] as never;
    expect(ownedFilterFor(character, kind).values).toEqual(['equipment']);
  });
  it('uses specification IDs and deduplicates spells from different powers', () => {
    const character = createCharacter();
    character.powers = [{ powerSpecificationId: 'spec', spells: [{ id: 'spell' }] }, { powerSpecificationId: 'spec', spells: [{ id: 'spell' }] }] as never;
    expect(ownedFilterFor(character, 'powerSpecifications').values).toEqual(['spec']);
    expect(ownedFilterFor(character, 'spells').values).toEqual(['spell']);
    character.race = { id: 'race' } as never;
    expect(ownedFilterFor(character, 'races').values).toEqual(['race']);
  });
  it('composes exact membership with all filters and preserves pagination for >400 entries', () => {
    const query: SearchEntityPayload = { entity: 'perk', search: { name: 'A', grade: 3, tags: ['tag'] }, pagination: { pageNumber: 43, pageSize: 10 } };
    const ids = Array.from({ length: 450 }, (_, i) => String(i));
    narrowToOwned(query, { values: ids });
    expect(query.search).toEqual({ name: 'A', grade: 3, tags: ['tag'], id: { anyOf: ids } });
    expect(query.pagination).toEqual({ pageNumber: 43, pageSize: 10 });
  });
  it('leaves unscoped queries untouched and gives stable keys independent of order or duplicates', () => {
    const query: SearchEntityPayload = { entity: 'perk' };
    narrowToOwned(query, null);
    expect(query).toEqual({ entity: 'perk' });
    expect(ownedFilterKey({ values: ['b','a','a'] })).toBe(ownedFilterKey({ values: ['a','b'] }));
    expect(ownedFilterKey({ values: [] })).not.toBe(ownedFilterKey(null));
  });
});
