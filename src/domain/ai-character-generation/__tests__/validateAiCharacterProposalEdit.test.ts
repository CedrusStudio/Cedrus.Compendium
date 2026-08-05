import { describe, expect, it } from 'vitest';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import type { CharacterGenerationCatalogEntry } from '@/domain/ai-character-generation/CharacterGenerationProvider';
import { validateAiCharacterProposalEdit } from '@/domain/ai-character-generation/validateAiCharacterProposalEdit';

const FINTA = '01ARZ3NDEKTSV4RRFFQ69G5F01';
const GARDA = '01ARZ3NDEKTSV4RRFFQ69G5F02';
const ODWET = '01ARZ3NDEKTSV4RRFFQ69G5F03';
const RACE = '01ARZ3NDEKTSV4RRFFQ69G5F04';
const INVENTED = '01ARZ3NDEKTSV4RRFFQ69G5F09';

const FORTEL_3 = '01ARZ3NDEKTSV4RRFFQ69G5F11';
const FORTEL_4 = '01ARZ3NDEKTSV4RRFFQ69G5F12';
const ELF = '01ARZ3NDEKTSV4RRFFQ69G5F13';

/** What the compendium holds, as the reviewer's picker would report it. */
const catalog: CharacterGenerationCatalogEntry[] = [
  { kind: 'maneuver', id: FINTA, name: 'Finta' },
  { kind: 'maneuver', id: GARDA, name: 'Garda' },
  { kind: 'maneuver', id: ODWET, name: 'Odwet' },
  { kind: 'perk', id: FORTEL_3, name: 'Większy Fortel', grade: 3 },
  { kind: 'perk', id: FORTEL_4, name: 'Większy Fortel', grade: 4 },
  { kind: 'race', id: ELF, name: 'Elf' },
];

function proposal(overrides: Record<string, unknown> = {}): AiCharacterProposal
{
  return {
    header: { name: 'Arnold', shortName: 'Arnold', description: 'Wojak.', tags: [], raceId: RACE },
    perks: [],
    statistics: { characteristics: {}, attributes: {} },
    talents: { talents: [] },
    equipment: { weapons: [], armors: [], shields: [], inventory: [], mounts: [] },
    combat: {
      health: {}, defenses: [], defaultDefenseId: null,
      stances: [], states: [],
      maneuvers: [{ id: FINTA, name: 'Finta' }, { id: GARDA, name: 'Garda' }],
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

const withManeuvers = (entries: { id: string; name: string }[]) => proposal({
  combat: { ...proposal().combat, maneuvers: entries },
});

const withPerks = (entries: { id: string; name: string; grade: number }[]) => proposal({ perks: entries });

describe('validateAiCharacterProposalEdit', () => {
  it('accepts removing an entry the model over-picked', () => {
    expect(validateAiCharacterProposalEdit(proposal(), withManeuvers([{ id: FINTA, name: 'Finta' }]), catalog))
      .toEqual([]);
  });

  it('accepts an unchanged proposal', () => {
    expect(validateAiCharacterProposalEdit(proposal(), proposal(), catalog)).toEqual([]);
  });

  it('accepts adding an entry the compendium already holds', () => {
    const edited = withManeuvers([
      { id: FINTA, name: 'Finta' },
      { id: GARDA, name: 'Garda' },
      { id: ODWET, name: 'Odwet' },
    ]);

    expect(validateAiCharacterProposalEdit(proposal(), edited, catalog)).toEqual([]);
  });

  it('accepts raising a rank, which is a different record entirely', () => {
    // The reason additions are allowed at all: „Większy Fortel" at 3 does not
    // satisfy a requirement for 4, and rank 4 is its own compendium entry.
    const original = withPerks([{ id: FORTEL_3, name: 'Większy Fortel', grade: 3 }]);
    const edited = withPerks([{ id: FORTEL_4, name: 'Większy Fortel', grade: 4 }]);

    expect(validateAiCharacterProposalEdit(original, edited, catalog)).toEqual([]);
  });

  it('refuses an entry that exists in neither the draft nor the compendium', () => {
    const edited = withManeuvers([{ id: FINTA, name: 'Finta' }, { id: INVENTED, name: 'Wymyślony Cios' }]);
    const issues = validateAiCharacterProposalEdit(proposal(), edited, catalog);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('nie istnieje w kompendium');
  });

  it('refuses a rank typed over the top of a link to a different record', () => {
    // Otherwise the review notes would describe a rank 4 perk while the draft
    // links the rank 3 one, and the requirement report would be a fiction.
    const edited = withPerks([{ id: FORTEL_3, name: 'Większy Fortel', grade: 4 }]);
    const issues = validateAiCharacterProposalEdit(proposal(), edited, catalog);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('nie zgadza się z wpisem kompendium');
  });

  it('keeps an entry the model authored under an allowCustom switch', () => {
    // It is in the draft already, so it is not an addition; refusing it would
    // make every edit of such a draft impossible.
    const original = withManeuvers([{ id: INVENTED, name: 'Wymyślony Cios' }]);

    expect(validateAiCharacterProposalEdit(original, original, catalog)).toEqual([]);
  });

  it('accepts swapping the race for one the compendium has', () => {
    const edited = proposal({ header: { ...proposal().header, raceId: ELF } });

    expect(validateAiCharacterProposalEdit(proposal(), edited, catalog)).toEqual([]);
  });

  it('refuses a race that is not in the compendium', () => {
    const edited = proposal({ header: { ...proposal().header, raceId: INVENTED } });

    expect(validateAiCharacterProposalEdit(proposal(), edited, catalog)).toHaveLength(1);
  });

  it('allows clearing the race', () => {
    const edited = proposal({ header: { ...proposal().header, raceId: null } });

    expect(validateAiCharacterProposalEdit(proposal(), edited, catalog)).toEqual([]);
  });

  it('says nothing about statistics or tags, which are the character\'s own', () => {
    const edited = proposal({
      header: { ...proposal().header, tags: ['wojak', 'rycerz'] },
      statistics: { characteristics: { strength: { grade: 3, value: 9, bonus: 0, testBonus: 0 } }, attributes: {} },
    });

    expect(validateAiCharacterProposalEdit(proposal(), edited, catalog)).toEqual([]);
  });
});
