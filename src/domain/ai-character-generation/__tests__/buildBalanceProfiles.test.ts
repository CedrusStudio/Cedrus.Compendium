import { describe, expect, it } from 'vitest';
import {
  buildBalanceProfiles,
  selectBalanceProfiles,
  type BalanceSourceCharacter,
} from '@/domain/ai-character-generation/buildBalanceProfiles';

const attribute = (value: number) => ({ value });

function fighter(artifice: number, maneuvers = 10, tags = ['wojak']): BalanceSourceCharacter
{
  return {
    tags,
    attributes: { artifice: attribute(artifice), fencing: attribute(3) },
    characteristics: { strength: attribute(4) },
    maneuversIds: Array.from({ length: maneuvers }, (_, index) => `m${index}`),
    perksIds: [],
  };
}

/** Ten is above the threshold a tag needs before it is measured at all. */
const wojacy = Array.from({ length: 10 }, (_, index) => fighter(index));

describe('buildBalanceProfiles', () => {
  it('measures a tag once enough characters carry it', () => {
    const [profile] = buildBalanceProfiles(wojacy);

    expect(profile.tag).toBe('wojak');
    expect(profile.characters).toBe(10);

    const artifice = profile.attributes.find(statistic => statistic.name === 'fortel');
    expect(artifice).toMatchObject({ median: 5, high: 9, max: 9 });
  });

  it('ignores a tag too rare to describe anything', () => {
    // Two characters would give percentiles that are just their two values.
    expect(buildBalanceProfiles([fighter(1, 10, ['smok']), fighter(9, 10, ['smok'])])).toEqual([]);
  });

  it('reports the speciality as the highest attribute a character reaches', () => {
    const [profile] = buildBalanceProfiles(wojacy);

    // Everyone has fencing 3, so the speciality is artifice wherever it is higher.
    expect(profile.speciality.max).toBe(9);
    expect(profile.speciality.median).toBeGreaterThanOrEqual(3);
  });

  it('counts the maneuvers such a character carries', () => {
    const [profile] = buildBalanceProfiles(wojacy);

    expect(profile.maneuvers.median).toBe(10);
  });

  it('picks the profile the description is talking about', () => {
    const profiles = buildBalanceProfiles([
      ...wojacy,
      ...Array.from({ length: 10 }, () => fighter(2, 4, ['mag'])),
    ]);

    const selected = selectBalanceProfiles(profiles, 'Wojak Arnold służy baronowi jako żołnierz liniowy.');

    expect(selected.map(profile => profile.tag)).toEqual(['wojak']);
  });

  it('prefers the tag with more characters behind it', () => {
    const profiles = buildBalanceProfiles([
      ...wojacy,
      ...Array.from({ length: 30 }, () => fighter(2, 4, ['wojownik'])),
    ]);

    const selected = selectBalanceProfiles(profiles, 'wojak i wojownik naraz');

    expect(selected[0].tag).toBe('wojownik');
    expect(selected[0].characters).toBe(30);
  });

  it('returns nothing rather than a misleading profile when no tag matches', () => {
    expect(selectBalanceProfiles(buildBalanceProfiles(wojacy), 'uczony alchemik z wieży')).toEqual([]);
  });
});
