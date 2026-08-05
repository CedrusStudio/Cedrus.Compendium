import { describe, expect, it } from 'vitest';
import type { CharacterGenerationCatalogEntry } from '@/domain/ai-character-generation/CharacterGenerationProvider';
import type { AiCharacterGenerationReference } from '@/domain/ai-character-generation/CharacterGenerationContextSource';
import {
  getAiCharacterGenerationAllowedReferences,
  validateAiCharacterProposalForAcceptance,
} from '@/domain/ai-character-generation/validateAiCharacterProposalForAcceptance';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';

const CATALOG_RACE_ID = '01ARZ3NDEKTSV4RRFFQ69G5F01';
const CATALOG_MANEUVER_ID = '01ARZ3NDEKTSV4RRFFQ69G5F02';

const catalog: CharacterGenerationCatalogEntry[] = [
  { kind: 'race', id: CATALOG_RACE_ID, name: 'Człowiek' },
  { kind: 'maneuver', id: CATALOG_MANEUVER_ID, name: 'Finta', grade: 1 },
];

function proposalUsing(raceId: string, maneuverId: string): AiCharacterProposal
{
  return {
    header: { name: 'Arnold', shortName: 'Arnold', description: 'Wojak.', tags: [], raceId },
    perks: [],
    statistics: { characteristics: {}, attributes: {} },
    talents: { talents: [] },
    equipment: { weapons: [], armors: [], shields: [], inventory: [], mounts: [] },
    combat: {
      health: {},
      defenses: [], defaultDefenseId: null,
      stances: [], states: [],
      maneuvers: [{ id: maneuverId, name: 'Finta' }],
      offenses: [], defaultOffenseId: null,
      powers: [],
    },
    buffs: {
      buffProfiles: [], activeBuffProfileIds: [],
      stanceModifierProfiles: [], activeStanceModifierProfileIds: [],
      stateModifierProfiles: [], activeStateModifierProfileIds: [],
      otherModifierProfiles: [], activeOtherModifierProfileIds: [],
    },
    explanation: 'x',
    warnings: [],
  } as unknown as AiCharacterProposal;
}

describe('allowed references', () => {
  it('accepts a pick from the compendium even without reference characters', () => {
    // The regression: allowed ids used to come only from reference characters,
    // so a draft generated with none could not name a single race or maneuver.
    const allowed = getAiCharacterGenerationAllowedReferences([], catalog);

    expect(validateAiCharacterProposalForAcceptance(
      proposalUsing(CATALOG_RACE_ID, CATALOG_MANEUVER_ID),
      allowed,
    )).toEqual([]);
  });

  it('still rejects an identifier that is in neither the catalog nor a reference', () => {
    const allowed = getAiCharacterGenerationAllowedReferences([], catalog);
    const issues = validateAiCharacterProposalForAcceptance(
      proposalUsing(CATALOG_RACE_ID, '01ARZ3NDEKTSV4RRFFQ69G5F99'),
      allowed,
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('Manewr');
  });

  it('lets an authored maneuver through when the request permitted one', () => {
    const allowed = getAiCharacterGenerationAllowedReferences([], catalog);

    expect(validateAiCharacterProposalForAcceptance(
      proposalUsing(CATALOG_RACE_ID, '01ARZ3NDEKTSV4RRFFQ69G5F99'),
      allowed,
      { allowCustomAbilities: true },
    )).toEqual([]);
  });

  it('keeps whatever the reference characters contribute', () => {
    const reference = {
      race: { id: 'race-from-reference' },
      stances: [], states: [], maneuvers: [{ id: 'maneuver-from-reference' }], powers: [],
    } as unknown as AiCharacterGenerationReference;

    const allowed = getAiCharacterGenerationAllowedReferences([reference], catalog);

    expect(allowed.raceIds.has('race-from-reference')).toBe(true);
    expect(allowed.raceIds.has(CATALOG_RACE_ID)).toBe(true);
    expect(allowed.maneuverIds.has('maneuver-from-reference')).toBe(true);
  });
});
