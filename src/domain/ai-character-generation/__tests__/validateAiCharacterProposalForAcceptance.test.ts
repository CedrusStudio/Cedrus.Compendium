import { describe, expect, it } from 'vitest';
import {
  validateAiCharacterProposalForAcceptance,
  type AiCharacterGenerationAllowedReferences,
} from '@/domain/ai-character-generation/validateAiCharacterProposalForAcceptance';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';

const allowed: AiCharacterGenerationAllowedReferences = {
  raceIds: new Set(['race-1']),
  stanceIds: new Set(['stance-1']),
  stateIds: new Set(['state-1']),
  maneuverIds: new Set(['maneuver-1']),
  spellIds: new Set(['spell-1']),
  powerSpecificationIds: new Set(['specification-1']),
};

function proposal(overrides: Record<string, unknown> = {}): AiCharacterProposal
{
  return {
    header: { raceId: 'race-1' },
    combat: {
      defenses: [{ id: 'defense-1' }],
      defaultDefenseId: 'defense-1',
      offenses: [{ id: 'offense-1' }],
      defaultOffenseId: 'offense-1',
      stances: [{ id: 'stance-1' }],
      states: [{ id: 'state-1' }],
      maneuvers: [{ id: 'maneuver-1' }],
      powers: [{ powerSpecificationId: 'specification-1', spells: [{ id: 'spell-1' }] }],
    },
    buffs: {
      buffProfiles: [], activeBuffProfileIds: [],
      stanceModifierProfiles: [], activeStanceModifierProfileIds: [],
      stateModifierProfiles: [], activeStateModifierProfileIds: [],
      otherModifierProfiles: [], activeOtherModifierProfileIds: [],
    },
    ...overrides,
  } as unknown as AiCharacterProposal;
}

describe('AI character draft acceptance validation', () => {
  it('allows global IDs supplied in selected reference context', () => {
    expect(validateAiCharacterProposalForAcceptance(proposal(), allowed)).toEqual([]);
  });

  it('rejects a global compendium ID not supplied by the BFF', () => {
    const candidate = proposal({
      combat: {
        ...proposal().combat,
        maneuvers: [{ id: 'invented-maneuver' }],
      },
    });

    expect(validateAiCharacterProposalForAcceptance(candidate, allowed)).toContain(
      'Manewr musi pochodzić z kompendium lub z przekazanych postaci referencyjnych.',
    );
  });

  it('accepts the same invented maneuver once the request permitted authoring', () => {
    const candidate = proposal({
      combat: {
        ...proposal().combat,
        maneuvers: [{ id: 'invented-maneuver' }],
      },
    });

    expect(validateAiCharacterProposalForAcceptance(candidate, allowed, { allowCustomAbilities: true }))
      .toEqual([]);
  });

  it('rejects dangling defaults and active buff profiles', () => {
    const candidate = proposal({
      combat: {
        ...proposal().combat,
        defaultDefenseId: 'missing-defense',
      },
      buffs: {
        ...proposal().buffs,
        activeBuffProfileIds: ['missing-profile'],
      },
    });

    expect(validateAiCharacterProposalForAcceptance(candidate, allowed)).toEqual(expect.arrayContaining([
      'Domyślna obrona musi wskazywać jedną z proponowanych obron.',
      'Aktywny profil wzmocnień musi należeć do propozycji tej postaci.',
    ]));
  });
});
