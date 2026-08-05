import { describe, expect, it } from 'vitest';
import type { Requirement } from '@/domain/requirements/Requirement';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import { validateAiCharacterProposalRequirements } from '@/domain/ai-character-generation/validateAiCharacterProposalRequirements';

const statistic = (value: number) => ({ grade: 3, value, bonus: 0, testBonus: 0 });

function proposal(overrides: Partial<AiCharacterProposal> = {}): AiCharacterProposal
{
  return {
    header: { name: 'Arnold', shortName: 'Arnold', description: 'Wojak.', tags: [], raceId: null },
    perks: [],
    statistics: {
      characteristics: {
        strength: statistic(4), dexterity: statistic(3), constitution: statistic(3),
        mind: statistic(2), charisma: statistic(0), spellborn: statistic(0),
      },
      attributes: {
        fencing: statistic(6), artifice: statistic(3), precision: statistic(0),
        initiative: statistic(2), martialArt: statistic(4), horsemanship: statistic(0),
        fortitude: statistic(4), reflex: statistic(3), willpower: statistic(3),
      },
    },
    talents: { talents: [] },
    equipment: { weapons: [], armors: [], shields: [], inventory: [], mounts: [] },
    combat: {
      health: {}, defenses: [], defaultDefenseId: null,
      stances: [], states: [], maneuvers: [],
      offenses: [], defaultOffenseId: null, powers: [],
    },
    buffs: {
      buffProfiles: [], activeBuffProfileIds: [],
      stanceModifierProfiles: [], activeStanceModifierProfileIds: [],
      stateModifierProfiles: [], activeStateModifierProfileIds: [],
      otherModifierProfiles: [], activeOtherModifierProfileIds: [],
    },
    explanation: 'x',
    warnings: [],
    ...overrides,
  } as unknown as AiCharacterProposal;
}

describe('validateAiCharacterProposalRequirements', () => {
  it('reports the perk chain the draft actually broke', () => {
    // Straight from a real draft: „Mistrzostwo w fortelu" needs Większy Fortel
    // at rank 6 and the character was given rank 5. Nothing caught it.
    const requirements: Requirement[] = [
      { kind: 'ranked', group: 'perks', targetKey: 'Większy Fortel', value: 6 },
    ];

    const issues = validateAiCharacterProposalRequirements(
      proposal({
        perks: [
          { id: 'wf', name: 'Większy Fortel', grade: 5 },
          { id: 'mwf', name: 'Mistrzostwo w fortelu', grade: 1 },
        ],
      } as Partial<AiCharacterProposal>),
      new Map([['mwf', requirements]]),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('Mistrzostwo w fortelu');
    expect(issues[0]).toContain('Większy Fortel ≥ 6');
  });

  it('stays quiet once the chain is satisfied', () => {
    const requirements: Requirement[] = [
      { kind: 'ranked', group: 'perks', targetKey: 'Większy Fortel', value: 6 },
    ];

    expect(validateAiCharacterProposalRequirements(
      proposal({
        perks: [
          { id: 'wf', name: 'Większy Fortel', grade: 6 },
          { id: 'mwf', name: 'Mistrzostwo w fortelu', grade: 1 },
        ],
      } as Partial<AiCharacterProposal>),
      new Map([['mwf', requirements]]),
    )).toEqual([]);
  });

  it('evaluates a statistic requirement against the proposed statistics', () => {
    const requirements: Requirement[] = [
      { kind: 'ranked', group: 'attributes', targetKey: 'artifice', value: 6 },
    ];

    const issues = validateAiCharacterProposalRequirements(
      proposal({ combat: { ...proposal().combat, maneuvers: [{ id: 'finta', name: 'Finta', grade: 2 }] } } as Partial<AiCharacterProposal>),
      new Map([['finta', requirements]]),
    );

    // artifice is 3 in the fixture, so a demand for 6 must surface.
    expect(issues[0]).toContain('Manewr „Finta (2)"');
    expect(issues[0]).toContain('fortel ≥ 6');
  });

  it('handles a sum requirement across characteristics', () => {
    const requirements: Requirement[] = [
      {
        kind: 'sum',
        targets: [
          { group: 'characteristics', targetKey: 'mind' },
          { group: 'characteristics', targetKey: 'dexterity' },
        ],
        value: 12,
      },
    ];

    const issues = validateAiCharacterProposalRequirements(
      proposal({ perks: [{ id: 'wf', name: 'Większy Fortel', grade: 5 }] } as Partial<AiCharacterProposal>),
      new Map([['wf', requirements]]),
    );

    expect(issues).toHaveLength(1);
  });

  it('ignores entries the compendium places no demands on', () => {
    expect(validateAiCharacterProposalRequirements(
      proposal({ perks: [{ id: 'wf', name: 'Większy Fortel', grade: 1 }] } as Partial<AiCharacterProposal>),
      new Map(),
    )).toEqual([]);
  });
});
