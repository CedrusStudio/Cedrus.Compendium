import { describe, it, expect } from 'vitest';
import { raceSchema, addRaceSchema, racesSchema } from '@/persistence/schemas/characters/raceSchema';

describe('raceSchema', () => {
  const validRace = {
    id: '01HXYZ12345678901234567890',
    name: 'Human',
    description: 'A human race',
    tags: ['humanoid'],
    strengthModifier: 2,
    dexterityModifier: 1,
    constitutionModifier: 0,
    mindModifier: -1,
    charismaModifier: 3,
    spellbornModifier: 0
  };

  it('should validate valid race', () => {
    const result = raceSchema.safeParse(validRace);
    expect(result.success).toBe(true);
  });

  it('should coerce modifiers from strings to numbers', () => {
    const result = raceSchema.safeParse({ 
      ...validRace, 
      strengthModifier: '5',
      dexterityModifier: '3'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.strengthModifier).toBe(5);
      expect(result.data.dexterityModifier).toBe(3);
    }
  });

  it('should accept modifier of -5', () => {
    const result = raceSchema.safeParse({ ...validRace, strengthModifier: -5 });
    expect(result.success).toBe(true);
  });

  it('should reject modifier less than -5', () => {
    const result = raceSchema.safeParse({ ...validRace, strengthModifier: -6 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Modyfikator siły musi być co najmniej -5.');
    }
  });

  it('should accept modifier of 20', () => {
    const result = raceSchema.safeParse({ ...validRace, dexterityModifier: 20 });
    expect(result.success).toBe(true);
  });

  it('should reject modifier greater than 20', () => {
    const result = raceSchema.safeParse({ ...validRace, constitutionModifier: 21 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Modyfikator kondycji musi być najwyżej 20.');
    }
  });

  it('should reject non-integer modifier', () => {
    const result = raceSchema.safeParse({ ...validRace, mindModifier: 1.5 });
    expect(result.success).toBe(false);
  });

  it('should accept all modifiers at 0', () => {
    const result = raceSchema.safeParse({
      ...validRace,
      strengthModifier: 0,
      dexterityModifier: 0,
      constitutionModifier: 0,
      mindModifier: 0,
      charismaModifier: 0,
      spellbornModifier: 0
    });
    expect(result.success).toBe(true);
  });

  it('should validate all modifier boundaries independently', () => {
    const testCases = [
      { field: 'strengthModifier', errorMessage: 'Modyfikator siły' },
      { field: 'dexterityModifier', errorMessage: 'Modyfikator zręczności' },
      { field: 'constitutionModifier', errorMessage: 'Modyfikator kondycji' },
      { field: 'mindModifier', errorMessage: 'Modyfikator umysłu' },
      { field: 'charismaModifier', errorMessage: 'Modyfikator charyzmy' },
      { field: 'spellbornModifier', errorMessage: 'Modyfikator czarokrwistości' }
    ];

    testCases.forEach(({ field, errorMessage }) => {
      const result = raceSchema.safeParse({ ...validRace, [field]: 21 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(errorMessage);
      }
    });
  });

  it('should default modifier to 0 when undefined', () => {
    const { strengthModifier: _s, dexterityModifier: _d, constitutionModifier: _c, mindModifier: _m, charismaModifier: _ch, spellbornModifier: _sp, ...raceWithoutModifiers } = validRace;
    const result = raceSchema.safeParse(raceWithoutModifiers);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.strengthModifier).toBe(0);
      expect(result.data.dexterityModifier).toBe(0);
      expect(result.data.constitutionModifier).toBe(0);
      expect(result.data.mindModifier).toBe(0);
      expect(result.data.charismaModifier).toBe(0);
      expect(result.data.spellbornModifier).toBe(0);
    }
  });

  it('should coerce empty string modifier to 0', () => {
    const result = raceSchema.safeParse({ ...validRace, strengthModifier: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.strengthModifier).toBe(0);
    }
  });

  it('should accept empty description', () => {
    const result = raceSchema.safeParse({ ...validRace, description: '' });
    expect(result.success).toBe(true);
  });

  it('should reject description exceeding 1000 characters', () => {
    const result = raceSchema.safeParse({ ...validRace, description: 'A'.repeat(1001) });
    expect(result.success).toBe(false);
  });

  it('should accept empty tags', () => {
    const result = raceSchema.safeParse({ ...validRace, tags: [] });
    expect(result.success).toBe(true);
  });
});

describe('addRaceSchema', () => {
  it('should omit id field', () => {
    const raceWithoutId = {
      name: 'Elf',
      description: 'Elven race',
      tags: ['humanoid'],
      strengthModifier: 0,
      dexterityModifier: 2,
      constitutionModifier: -1,
      mindModifier: 1,
      charismaModifier: 1,
      spellbornModifier: 2
    };
    const result = addRaceSchema.safeParse(raceWithoutId);
    expect(result.success).toBe(true);
  });
});

describe('racesSchema', () => {
  it('should validate empty array', () => {
    const result = racesSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it('should validate array with valid races', () => {
    const races = [
      {
        id: '01HXYZ12345678901234567890',
        name: 'Human',
        description: 'Desc',
        tags: [],
        strengthModifier: 0,
        dexterityModifier: 0,
        constitutionModifier: 0,
        mindModifier: 0,
        charismaModifier: 0,
        spellbornModifier: 0
      },
      {
        id: '01HXYZ12345678901234567891',
        name: 'Elf',
        description: 'Desc',
        tags: [],
        strengthModifier: 0,
        dexterityModifier: 2,
        constitutionModifier: 0,
        mindModifier: 0,
        charismaModifier: 0,
        spellbornModifier: 0
      }
    ];
    const result = racesSchema.safeParse(races);
    expect(result.success).toBe(true);
  });

  it('should reject array with more than 100 races', () => {
    const manyRaces = Array.from({ length: 101 }, (_, i) => ({
      id: `01HXYZ1234567890123456${String(i).padStart(4, '0')}`,
      name: `Race ${i}`,
      description: 'Desc',
      tags: [],
      strengthModifier: 0,
      dexterityModifier: 0,
      constitutionModifier: 0,
      mindModifier: 0,
      charismaModifier: 0,
      spellbornModifier: 0
    }));
    const result = racesSchema.safeParse(manyRaces);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Możesz mieć najwyżej 100 ras.');
    }
  });
});
