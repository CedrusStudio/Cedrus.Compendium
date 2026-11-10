import { expect, it } from 'vitest';
import { CreateEmptyCharacter } from '@/domain/characters/Character';
import { CreateDefaultPower, CreateDefaultSpell } from '@/domain/characters/combat/Power';
import { CreateDefaultRace } from '@/domain/Race';
import { buildCharacterGenerationContext, MAX_CHARACTER_GENERATION_CONTEXT_CHARS } from '../buildCharacterGenerationContext';
import { toAiCharacterGenerationReference } from '../CharacterGenerationContextSource';
import { aiCharacterGenerationRequestSchema } from '../aiCharacterGenerationSchemas';

const ordinary = aiCharacterGenerationRequestSchema.parse({ description: 'Zwiadowca z łukiem' });
const veteran = aiCharacterGenerationRequestSchema.parse({ description: 'Zwiadowca z łukiem', constraints: { notes: 'doświadczony wojownik' } });
const entry = { kind: 'spell', id: 'reference-spell', name: 'Nietypowa iluzja' };

it('builds context without a catalog and uses notes to select a requested tier', () => {
  const result = buildCharacterGenerationContext(veteran, []);
  expect(result).toMatchObject({
    request: veteran, references: [], allowedCatalog: { availability: 'not-configured', entries: [] },
    rulebookContext: { availability: 'not-configured', fragments: [] },
    powerTier: { name: 'weteran' },
  });
  expect(buildCharacterGenerationContext(ordinary, [])).not.toHaveProperty('powerTier');
});

it('pins the reference spell even when it is less relevant than the rest of the catalog', () => {
  const character = CreateEmptyCharacter({ name: 'Aldara', shortName: 'Aldara', tags: [], description: 'Wzór' });
  character.apiKeys = ['test-private-key'];
  character.race = CreateDefaultRace();
  character.powers = [{ ...CreateDefaultPower(), powerSpecificationId: 'ice', spells: [{ ...CreateDefaultSpell(), ...entry }] }];
  const reference = toAiCharacterGenerationReference(character);
  const catalogEntries = [entry, ...Array.from({ length: 150 }, (_, i) => ({
    kind: 'spell', id: 'spell-' + i, name: 'Zwiadowca z łukiem ' + i,
  }))];
  const result = buildCharacterGenerationContext(veteran, [reference], { catalogEntries, rulebookFragments: ['Reguły strzału'] });
  expect(result.allowedCatalog.availability).toBe('configured');
  expect(result.allowedCatalog.entries).toContainEqual(entry);
  expect(result.allowedCatalog.entries.length).toBeLessThan(catalogEntries.length);
  expect(result.references[0]).not.toHaveProperty('apiKeys');
  expect(result.rulebookContext).toEqual({ availability: 'configured', fragments: ['Reguły strzału'] });
  expect(result.powerTier?.name).toBe('weteran');
});

it.each([ordinary, veteran])('keeps the context usable when rulebook fragments leave too little catalog space', request => {
  const fragment = 'x'.repeat(MAX_CHARACTER_GENERATION_CONTEXT_CHARS - 7000);
  const result = buildCharacterGenerationContext(request, [], { catalogEntries: [entry], rulebookFragments: [fragment] });
  expect(result.allowedCatalog).toEqual({ availability: 'not-configured', entries: [] });
  expect(result.rulebookContext).toEqual({ availability: 'configured', fragments: [fragment] });
  expect(JSON.stringify(result).length).toBeLessThan(MAX_CHARACTER_GENERATION_CONTEXT_CHARS);
});
