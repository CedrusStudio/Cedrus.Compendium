import { describe, expect, it } from 'vitest';
import { characterVisibilityWhere, isCharacterVisible, normalizeApiKey } from '@/persistence/characterVisibility';

// Cases 1-6 mirror the source document
// (features-to-implement/visible-only-to-api-keys.md, "Testy obowiazkowe").
describe('characterVisibilityWhere', () => {
  it('Test 1: public character (apiKeys: []), no current API key -> visible', () => {
    expect(characterVisibilityWhere(undefined)).toEqual({ apiKeys: { isEmpty: true } });
  });

  it('Test 2: public character (apiKeys: []), current API key set -> still uses OR that matches public', () => {
    const where = characterVisibilityWhere('ABC');

    expect(where).toEqual({
      OR: [
        { apiKeys: { isEmpty: true } },
        { apiKeys: { has: 'ABC' } },
      ],
    });
  });

  it('Test 3 & 4: private character with a key set builds an OR condition (isEmpty OR has(key))', () => {
    const where = characterVisibilityWhere('ABC');

    expect(where).toEqual({
      OR: [
        { apiKeys: { isEmpty: true } },
        { apiKeys: { has: 'ABC' } },
      ],
    });
  });

  it('Test 5 & 6: no current API key -> only the public branch is generated', () => {
    expect(characterVisibilityWhere(null)).toEqual({ apiKeys: { isEmpty: true } });
    expect(characterVisibilityWhere(undefined)).toEqual({ apiKeys: { isEmpty: true } });
  });

  it('treats a blank/whitespace-only API key as no key', () => {
    expect(characterVisibilityWhere('   ')).toEqual({ apiKeys: { isEmpty: true } });
  });

  it('trims the API key before building the has() condition', () => {
    expect(characterVisibilityWhere('  ABC  ')).toEqual({
      OR: [
        { apiKeys: { isEmpty: true } },
        { apiKeys: { has: 'ABC' } },
      ],
    });
  });
});

describe('normalizeApiKey', () => {
  it('returns null for missing, empty, or whitespace-only values', () => {
    expect(normalizeApiKey(undefined)).toBeNull();
    expect(normalizeApiKey(null)).toBeNull();
    expect(normalizeApiKey('')).toBeNull();
    expect(normalizeApiKey('   ')).toBeNull();
  });

  it('trims a valid key', () => {
    expect(normalizeApiKey('  ABC  ')).toBe('ABC');
  });
});

describe('isCharacterVisible', () => {
  it('Test 1: apiKeys: [], apiKey: undefined -> visible', () => {
    expect(isCharacterVisible([], undefined)).toBe(true);
  });

  it('Test 2: apiKeys: [], apiKey: "ABC" -> visible', () => {
    expect(isCharacterVisible([], 'ABC')).toBe(true);
  });

  it('Test 3: apiKeys: ["ABC"], apiKey: "ABC" -> visible', () => {
    expect(isCharacterVisible(['ABC'], 'ABC')).toBe(true);
  });

  it('Test 4: apiKeys: ["ABC"], apiKey: "XYZ" -> hidden', () => {
    expect(isCharacterVisible(['ABC'], 'XYZ')).toBe(false);
  });

  it('Test 4b: apiKeys: ["ABC"], apiKey: undefined -> hidden', () => {
    expect(isCharacterVisible(['ABC'], undefined)).toBe(false);
  });

  it('Test 5: legacy record (apiKeys: undefined), apiKey: undefined -> visible', () => {
    expect(isCharacterVisible(undefined, undefined)).toBe(true);
  });

  it('Test 6: legacy record (apiKeys: undefined), apiKey: "ABC" -> visible', () => {
    expect(isCharacterVisible(undefined, 'ABC')).toBe(true);
  });

  it('legacy record (apiKeys: null) behaves like an empty array -> visible', () => {
    expect(isCharacterVisible(null, undefined)).toBe(true);
    expect(isCharacterVisible(null, 'ABC')).toBe(true);
  });

  it('matches any element of a multi-key list, not just the first', () => {
    expect(isCharacterVisible(['ABC', 'DEF'], 'DEF')).toBe(true);
    expect(isCharacterVisible(['ABC', 'DEF'], 'GHI')).toBe(false);
  });

  it('treats a blank current API key as no key for a private character', () => {
    expect(isCharacterVisible(['ABC'], '   ')).toBe(false);
  });
});
