import { describe, expect, it } from 'vitest';

import { defaultBestiaryColumnVisibility, resolveBestiaryColumnVisibility } from '@/application/bestiary/bestiaryColumnPreferences';

describe('bestiaryColumnPreferences', () => {
  it('returns the current default visibility when no preference is stored', () => {
    expect(resolveBestiaryColumnVisibility()).toEqual(defaultBestiaryColumnVisibility);
  });

  it('overrides only the saved keys and keeps the remaining defaults', () => {
    expect(resolveBestiaryColumnVisibility({ powers: true, initiative: false })).toEqual({
      ...defaultBestiaryColumnVisibility,
      powers: true,
      initiative: false,
    });
  });
});