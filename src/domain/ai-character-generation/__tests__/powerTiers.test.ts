import { describe, expect, it } from 'vitest';
import { POWER_SCALES, POWER_TIERS, selectPowerScale, selectPowerTier } from '@/domain/ai-character-generation/powerTiers';

describe('selectPowerTier', () => {
  it('reads the level the description names', () => {
    expect(selectPowerTier('Wyróżniający się wojownik barona.')?.name).toBe('wyróżniający');
    expect(selectPowerTier('Świeżo przyjęty rekrut ze wsi.')?.name).toBe('rekrut');
    expect(selectPowerTier('Legendarny szermierz.')?.name).toBe('mistrz');
  });

  it('matches an inflected alias', () => {
    expect(selectPowerTier('Doświadczonego najemnika widziano w mieście.')?.name).toBe('weteran');
  });

  it('says nothing when the description says nothing', () => {
    // Guessing a tier would hide the ambiguity behind confident numbers; the
    // measured balance profiles are the honest fallback.
    expect(selectPowerTier('Wojak Arnold służy baronowi Ertranowi.')).toBeUndefined();
  });

  it('keeps every ladder ordered within its own family', () => {
    for (const scale of POWER_SCALES) {
      for (let index = 1; index < scale.tiers.length; index++) {
        const previous = scale.tiers[index - 1];
        const current = scale.tiers[index];

        expect(current.speciality).toBeGreaterThan(previous.speciality);
        // Mages climb on spells, warriors on maneuvers; the ladder rises on
        // whichever dimension its family actually uses.
        const dimension = scale.category === 'mag' ? 'spells' : 'maneuvers';
        expect(current[dimension]).toBeGreaterThan(previous[dimension]);
      }
    }
  });

  it('gives each family its own shape rather than the warrior one', () => {
    const mage = POWER_SCALES.find(scale => scale.category === 'mag');
    const beast = POWER_SCALES.find(scale => scale.category === 'bestia');

    // Measured: mages carry 31 spells and zero maneuvers; beasts reach
    // attributes no human does and take no perks.
    expect(mage?.tiers.every(tier => tier.maneuvers === 0)).toBe(true);
    expect(mage?.tiers.every(tier => tier.spells > 0)).toBe(true);
    expect(beast?.tiers.every(tier => tier.spells === 0)).toBe(true);
    expect(beast?.tiers.at(-1)?.speciality).toBeGreaterThan(
      POWER_SCALES.find(scale => scale.category === 'wojownik')?.tiers.at(-1)?.speciality ?? 0,
    );
  });

  it('reads the family from the character tags before the description', () => {
    expect(selectPowerScale('Wyróżniający się wojownik.', ['mag']).category).toBe('mag');
    expect(selectPowerScale('Nekromanta z wieży.').category).toBe('mag');
    expect(selectPowerScale('Pradawny nieumarły władca.').category).toBe('nieumarły');
    expect(selectPowerScale('Ktoś bliżej nieokreślony.').category).toBe('wojownik');
  });

  it('picks the tier from the ladder of the right family', () => {
    const mageMaster = selectPowerTier('Legendarny mag ognia.', ['mag']);

    expect(mageMaster?.maneuvers).toBe(0);
    expect(mageMaster?.spells).toBeGreaterThan(0);
  });

  it('never sets ordinary training above the speciality', () => {
    for (const tier of POWER_TIERS) {
      expect(tier.speciality).toBeGreaterThan(tier.ordinary);
    }
  });
});
