import { describe, expect, it } from 'vitest';
import type { BalanceProfile } from '@/domain/ai-character-generation/buildBalanceProfiles';
import type { PowerTier } from '@/domain/ai-character-generation/powerTiers';
import {
  compareToBalanceProfile,
  findTierDrift,
} from '@/domain/ai-character-generation/compareToBalanceProfile';

/** The measured `wojak` profile, so the assertions mean something real. */
const wojak: BalanceProfile = {
  tag: 'wojak',
  characters: 48,
  attributes: [
    { name: 'fechtunek', median: 3, high: 8, max: 9 },
    { name: 'fortel', median: 3, high: 7, max: 8 },
    { name: 'precyzja', median: 0, high: 5, max: 8 },
    { name: 'inicjatywa', median: 3, high: 5, max: 6 },
    { name: 'walka wręcz', median: 4, high: 8, max: 9 },
    { name: 'jeździectwo', median: 0, high: 0, max: 9 },
    { name: 'wytrwałość', median: 4, high: 6, max: 8 },
    { name: 'refleks', median: 3, high: 6, max: 8 },
    { name: 'wola', median: 3, high: 5, max: 7 },
  ],
  characteristics: [],
  speciality: { median: 6, high: 8, max: 9 },
  maneuvers: { median: 11, high: 15 },
  perks: { median: 0, high: 6 },
};

const subject = (artifice: number, maneuverCount = 11) => ({
  attributes: { artifice: { value: artifice }, fencing: { value: 5 } },
  maneuverCount,
  perkCount: 0,
});

describe('compareToBalanceProfile', () => {
  it('calls a speciality at the 90th percentile normal, not excessive', () => {
    const comparison = compareToBalanceProfile(subject(7), wojak);
    const fortel = comparison.attributes.find(attribute => attribute.name === 'fortel');

    expect(fortel).toMatchObject({ value: 7, band: 'w normie' });
  });

  it('flags the draft that started all of this', () => {
    // „wyjątkowy talent do fortelu" came back as 3, which is the median.
    const comparison = compareToBalanceProfile(subject(3), wojak);
    const fortel = comparison.attributes.find(attribute => attribute.name === 'fortel');

    expect(fortel?.band).toBe('w normie');
    // …but as the character's best attribute it is far below what a wojak reaches.
    expect(comparison.speciality).toMatchObject({ name: 'fechtunek', value: 5, band: 'poniżej mediany' });
  });

  it('marks a value nothing in the compendium reaches', () => {
    const comparison = compareToBalanceProfile(subject(12), wojak);

    expect(comparison.attributes.find(attribute => attribute.name === 'fortel')?.band)
      .toBe('powyżej maksimum');
  });

  it('measures breadth against the same profile', () => {
    expect(compareToBalanceProfile(subject(7, 2), wojak).maneuvers.band).toBe('poniżej mediany');
    expect(compareToBalanceProfile(subject(7, 20), wojak).maneuvers.band).toBe('wysoko');
  });
});

describe('findTierDrift', () => {
  it('stays quiet while the table matches the compendium', () => {
    const tier: PowerTier = {
      name: 'weteran', aliases: [], summary: '',
      speciality: 6, ordinary: 4, maneuvers: 9, perks: 1, spells: 0,
    };

    expect(findTierDrift([tier], wojak)).toEqual([]);
  });

  it('reports a tier aiming above anything that exists', () => {
    const tier: PowerTier = {
      name: 'półbóg', aliases: [], summary: '',
      speciality: 14, ordinary: 8, maneuvers: 12, perks: 4, spells: 0,
    };

    const drift = findTierDrift([tier], wojak);

    expect(drift).toHaveLength(1);
    expect(drift[0]).toMatchObject({ tier: 'półbóg', field: 'speciality', intended: 14 });
  });

  it('reports a tier demanding breadth far past the 90th percentile', () => {
    const tier: PowerTier = {
      name: 'kolekcjoner', aliases: [], summary: '',
      speciality: 8, ordinary: 5, maneuvers: 40, perks: 3, spells: 0,
    };

    expect(findTierDrift([tier], wojak).map(entry => entry.field)).toEqual(['maneuvers']);
  });
});
