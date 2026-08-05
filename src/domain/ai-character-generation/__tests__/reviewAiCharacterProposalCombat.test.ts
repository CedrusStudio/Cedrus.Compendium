import { describe, expect, it } from 'vitest';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import { reviewAiCharacterProposalCombat } from '@/domain/ai-character-generation/reviewAiCharacterProposalCombat';

const pool = (amount: number, grade = 5, bonus = 2) => ({ amount, grade, bonus, isPhantom: false });

const weapon = (amount: number) => ({
  ...pool(amount),
  critical: { power: 2, range: 1 },
});

/**
 * A weapon as the character carries it. Every field of the DTO is present so
 * the fixture can be spread into a proposal without casting through `unknown`,
 * which would hide exactly the kind of mismatch a fixture is meant to catch.
 */
const gear = (name: string, criticalPower: number): AiCharacterProposal['equipment']['weapons'][number] => ({
  id: `weapon-${name}`,
  name,
  description: 'x',
  tags: [],
  style: 'Jednoręczny',
  range: 0,
  offense: { amount: 1, grade: 5, bonus: 0, isPhantom: false, critical: { power: criticalPower, range: 0 } },
  damageBonus: { amount: 1, grade: 3, bonus: 0, isPhantom: false },
});

const equipmentWith = (...weapons: AiCharacterProposal['equipment']['weapons']) => ({
  weapons, armors: [], shields: [], inventory: [], mounts: [],
});

function proposal(offenses: unknown[], overrides: Record<string, unknown> = {}): AiCharacterProposal
{
  return {
    // A built character carrying a sword, which adds to the critical: the
    // measured conventions are drawn from those, not from plain statblocks.
    perks: [{ id: 'perk-1', name: 'Większy Fechtunek', grade: 3 }],
    equipment: equipmentWith(gear('Miecz', 2)),
    combat: {
      defenses: [{ id: 'def-1', name: 'Podstawowa' }],
      defaultDefenseId: 'def-1',
      offenses,
      defaultOffenseId: offenses.length > 0 ? 'off-1' : null,
      stances: [], states: [], maneuvers: [], powers: [],
      health: {},
      ...overrides,
    },
  } as unknown as AiCharacterProposal;
}

const statblock = (offenses: unknown[]) => ({
  ...proposal(offenses),
  perks: [],
}) as AiCharacterProposal;

const offense = (leadingAmount: number, extra: Record<string, unknown> = {}) => ({
  id: 'off-1',
  name: 'Miecz i tarcza',
  leadingWeapon: weapon(leadingAmount),
  damageBonus: pool(1, 3, 6),
  ...extra,
});

describe('reviewAiCharacterProposalCombat', () => {
  it('says nothing about an ordinary attack set', () => {
    expect(reviewAiCharacterProposalCombat(proposal([offense(2)]))).toEqual([]);
  });

  it('flags a one-die attack pool', () => {
    // Measured: no character tagged wojak, rycerz, wojownik or szermierz rolls
    // a single attack die. „1k10+2" came back from a review.
    const notes = reviewAiCharacterProposalCombat(proposal([offense(1)]));

    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain('1k10+2');
    expect(notes[0]).toContain('jednej kości');
  });

  it('flags an attack set with nothing to attack with', () => {
    expect(reviewAiCharacterProposalCombat(proposal([offense(0)]))[0])
      .toContain('nie ma czym atakować');
  });

  it('flags a second weapon that rolls nothing', () => {
    // The optional field was filled with zeros instead of left out, which reads
    // as a real but useless weapon.
    const notes = reviewAiCharacterProposalCombat(
      proposal([offense(2, { secondaryWeapon: weapon(0) })]),
    );

    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain('drugorzędną');
  });

  it('says nothing about a second weapon that actually rolls', () => {
    expect(reviewAiCharacterProposalCombat(proposal([offense(2, { secondaryWeapon: weapon(2) })])))
      .toEqual([]);
  });

  it('reports a zero critical the gear cannot account for', () => {
    // A sword adds to the critical, so a swordsman at zero is a mistake.
    const noCritical = offense(2, { leadingWeapon: { ...pool(2), critical: { power: 0, range: 0 } } });
    const notes = reviewAiCharacterProposalCombat(proposal([noCritical]));

    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain('siłę krytyka 0');
  });

  it('says nothing when the weapon is what takes the critical away', () => {
    // „Prymitywna Włócznia" is −2 and „Walka Wręcz" −3; fourteen weapons in the
    // compendium subtract, and a spearman reaches zero honestly.
    const noCritical = offense(2, { leadingWeapon: { ...pool(2), critical: { power: 0, range: 0 } } });
    const spearman = {
      ...proposal([noCritical]),
      equipment: equipmentWith(gear('Prymitywna Włócznia', -2)),
    };

    expect(reviewAiCharacterProposalCombat(spearman)).toEqual([]);
  });

  it('says nothing about a bare-knuckle fighter, who carries no weapon at all', () => {
    const noCritical = offense(2, { leadingWeapon: { ...pool(2), critical: { power: 0, range: 0 } } });
    const brawler = {
      ...proposal([noCritical]),
      equipment: equipmentWith(),
    };

    expect(reviewAiCharacterProposalCombat(brawler)).toEqual([]);
  });

  it('says nothing about a zero critical on a plain statblock', () => {
    // Firing on a character with nothing on its sheet would train the reviewer
    // to skip the whole panel.
    const noCritical = offense(2, { leadingWeapon: { ...pool(2), critical: { power: 0, range: 0 } } });

    expect(reviewAiCharacterProposalCombat(statblock([noCritical]))).toEqual([]);
  });

  it('leaves the critical alone when there is no attack pool to speak of', () => {
    const empty = offense(0, { leadingWeapon: { ...pool(0), critical: { power: 0, range: 0 } } });
    const notes = reviewAiCharacterProposalCombat(proposal([empty]));

    // One note about the empty pool, not a second about its critical.
    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain('nie ma czym atakować');
  });

  it('stays quiet about a flat damage bonus, which is a third of the fighters', () => {
    expect(reviewAiCharacterProposalCombat(proposal([offense(2, { damageBonus: pool(0, 1, 7) })])))
      .toEqual([]);
  });

  it('notices that no combat set is marked as the default', () => {
    const notes = reviewAiCharacterProposalCombat(
      proposal([offense(2)], { defaultOffenseId: null, defaultDefenseId: null }),
    );

    expect(notes).toHaveLength(2);
  });
});
