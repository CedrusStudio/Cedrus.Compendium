import { describe, it, expect } from 'vitest';
import { defenseSchema } from '@/persistence/schemas/characters/combat/defenseSchema';

describe('defenseSchema', () => {
  const validDefense = {
    id: '01HXYZ12345678901234567890',
    name: 'Shield Defense',
    description: 'Strong defensive posture',
    immunity: 5,
    resistance: 10,
    protection: 15,
    block: 8,
    parry: 12,
    dodge: 10,
    bonus: 20
  };

  it('should validate valid defense', () => {
    const result = defenseSchema.safeParse(validDefense);
    expect(result.success).toBe(true);
  });

  it('should coerce all numeric fields from strings', () => {
    const result = defenseSchema.safeParse({
      ...validDefense,
      immunity: '8',
      resistance: '12',
      protection: '20',
      block: '10',
      parry: '15',
      dodge: '13',
      bonus: '25'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.immunity).toBe(8);
      expect(result.data.resistance).toBe(12);
    }
  });

  it('should accept defense without description', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { description, ...defenseWithoutDesc } = validDefense;
    const result = defenseSchema.safeParse(defenseWithoutDesc);
    expect(result.success).toBe(true);
  });

  describe('description field', () => {
    it('should reject description less than 2 characters', () => {
      const result = defenseSchema.safeParse({ ...validDefense, description: 'A' });
      expect(result.success).toBe(false);
    });

    it('should accept description with exactly 1000 characters', () => {
      const result = defenseSchema.safeParse({ ...validDefense, description: 'A'.repeat(1000) });
      expect(result.success).toBe(true);
    });

    it('should reject description greater than 1000 characters', () => {
      const result = defenseSchema.safeParse({ ...validDefense, description: 'A'.repeat(1001) });
      expect(result.success).toBe(false);
    });
  });

  describe('immunity field', () => {
    it('should accept immunity of 0', () => {
      const result = defenseSchema.safeParse({ ...validDefense, immunity: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative immunity', () => {
      const result = defenseSchema.safeParse({ ...validDefense, immunity: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept immunity of 50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, immunity: 50 });
      expect(result.success).toBe(true);
    });

    it('should reject immunity greater than 50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, immunity: 51 });
      expect(result.success).toBe(false);
    });
  });

  describe('resistance field', () => {
    it('should accept resistance of 0', () => {
      const result = defenseSchema.safeParse({ ...validDefense, resistance: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative resistance', () => {
      const result = defenseSchema.safeParse({ ...validDefense, resistance: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept resistance of 50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, resistance: 50 });
      expect(result.success).toBe(true);
    });

    it('should reject resistance greater than 50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, resistance: 51 });
      expect(result.success).toBe(false);
    });
  });

  describe('protection field', () => {
    it('should accept protection of 0', () => {
      const result = defenseSchema.safeParse({ ...validDefense, protection: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative protection', () => {
      const result = defenseSchema.safeParse({ ...validDefense, protection: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept protection of 50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, protection: 50 });
      expect(result.success).toBe(true);
    });

    it('should reject protection greater than 50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, protection: 51 });
      expect(result.success).toBe(false);
    });
  });

  describe('block field', () => {
    it('should accept block of 0', () => {
      const result = defenseSchema.safeParse({ ...validDefense, block: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative block', () => {
      const result = defenseSchema.safeParse({ ...validDefense, block: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept block of 50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, block: 50 });
      expect(result.success).toBe(true);
    });

    it('should reject block greater than 50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, block: 51 });
      expect(result.success).toBe(false);
    });
  });

  describe('parry field', () => {
    it('should accept parry of 0', () => {
      const result = defenseSchema.safeParse({ ...validDefense, parry: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative parry', () => {
      const result = defenseSchema.safeParse({ ...validDefense, parry: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept parry of 50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, parry: 50 });
      expect(result.success).toBe(true);
    });

    it('should reject parry greater than 50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, parry: 51 });
      expect(result.success).toBe(false);
    });
  });

  describe('dodge field', () => {
    it('should accept dodge of 0', () => {
      const result = defenseSchema.safeParse({ ...validDefense, dodge: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative dodge', () => {
      const result = defenseSchema.safeParse({ ...validDefense, dodge: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept dodge of 50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, dodge: 50 });
      expect(result.success).toBe(true);
    });

    it('should reject dodge greater than 50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, dodge: 51 });
      expect(result.success).toBe(false);
    });
  });

  describe('bonus field', () => {
    it('should accept bonus of -50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, bonus: -50 });
      expect(result.success).toBe(true);
    });

    it('should reject bonus less than -50', () => {
      const result = defenseSchema.safeParse({ ...validDefense, bonus: -51 });
      expect(result.success).toBe(false);
    });

    it('should accept bonus of 1000', () => {
      const result = defenseSchema.safeParse({ ...validDefense, bonus: 1000 });
      expect(result.success).toBe(true);
    });

    it('should reject bonus greater than 1000', () => {
      const result = defenseSchema.safeParse({ ...validDefense, bonus: 1001 });
      expect(result.success).toBe(false);
    });
  });

  it('should handle all boundary values at maximum', () => {
    const result = defenseSchema.safeParse({
      id: '01HXYZ12345678901234567890',
      name: 'Max Defense',
      immunity: 50,
      resistance: 50,
      protection: 50,
      block: 50,
      parry: 50,
      dodge: 50,
      bonus: 1000
    });
    expect(result.success).toBe(true);
  });

  it('should handle all boundary values at minimum', () => {
    const result = defenseSchema.safeParse({
      id: '01HXYZ12345678901234567890',
      name: 'Min Defense',
      immunity: 0,
      resistance: 0,
      protection: 0,
      block: 0,
      parry: 0,
      dodge: 0,
      bonus: -50
    });
    expect(result.success).toBe(true);
  });
});
