import { describe, it, expect } from 'vitest';
import { defenseItemSchema } from '@/persistence/schemas/characters/equipment/defenseItemSchema';

describe('defenseItemSchema', () => {
  const validDefensiveItem = {
    id: '01HXYZ12345678901234567890',
    name: 'Iron Shield',
    description: 'A sturdy shield',
    tags: [],
    resistance: 5,
    dexterityRestriction: 0,
    reflexRestriction: 1,
    initiativeRestriction: 2,
    attributePenalty: 0,
    strengthRequirement: 10,
  };

  it('should validate a valid defensive item', () => {
    const result = defenseItemSchema.safeParse(validDefensiveItem);
    expect(result.success).toBe(true);
  });

  describe('default values', () => {
    it('should default all restriction fields to 0 when undefined', () => {
      const { resistance: _r, dexterityRestriction: _dr, reflexRestriction: _rr, initiativeRestriction: _ir, attributePenalty: _ap, strengthRequirement: _sr, ...itemWithoutRestrictions } = validDefensiveItem;
      const result = defenseItemSchema.safeParse(itemWithoutRestrictions);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resistance).toBe(0);
        expect(result.data.dexterityRestriction).toBe(0);
        expect(result.data.reflexRestriction).toBe(0);
        expect(result.data.initiativeRestriction).toBe(0);
        expect(result.data.attributePenalty).toBe(0);
        expect(result.data.strengthRequirement).toBe(0);
      }
    });

    it('should default resistance to 0 when undefined', () => {
      const { resistance: _, ...withoutResistance } = validDefensiveItem;
      const result = defenseItemSchema.safeParse(withoutResistance);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resistance).toBe(0);
      }
    });

    it('should default initiativeRestriction to 0 when empty string', () => {
      const result = defenseItemSchema.safeParse({ ...validDefensiveItem, initiativeRestriction: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.initiativeRestriction).toBe(0);
      }
    });
  });

  describe('validation boundaries', () => {
    it('should reject dexterityRestriction below -10', () => {
      const result = defenseItemSchema.safeParse({ ...validDefensiveItem, dexterityRestriction: -11 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Ograniczenie zręczności');
      }
    });

    it('should accept dexterityRestriction of -10', () => {
      const result = defenseItemSchema.safeParse({ ...validDefensiveItem, dexterityRestriction: -10 });
      expect(result.success).toBe(true);
    });

    it('should accept initiativeRestriction of -10', () => {
      const result = defenseItemSchema.safeParse({ ...validDefensiveItem, initiativeRestriction: -10 });
      expect(result.success).toBe(true);
    });

    it('should reject initiativeRestriction below -10', () => {
      const result = defenseItemSchema.safeParse({ ...validDefensiveItem, initiativeRestriction: -11 });
      expect(result.success).toBe(false);
    });

    it('should accept initiativeRestriction of 20', () => {
      const result = defenseItemSchema.safeParse({ ...validDefensiveItem, initiativeRestriction: 20 });
      expect(result.success).toBe(true);
    });

    it('should reject initiativeRestriction above 20', () => {
      const result = defenseItemSchema.safeParse({ ...validDefensiveItem, initiativeRestriction: 21 });
      expect(result.success).toBe(false);
    });

    it('should accept reflexRestriction of -10', () => {
      const result = defenseItemSchema.safeParse({ ...validDefensiveItem, reflexRestriction: -10 });
      expect(result.success).toBe(true);
    });

    it('should accept attributePenalty of 20', () => {
      const result = defenseItemSchema.safeParse({ ...validDefensiveItem, attributePenalty: 20 });
      expect(result.success).toBe(true);
    });

    it('should accept strengthRequirement of -10', () => {
      const result = defenseItemSchema.safeParse({ ...validDefensiveItem, strengthRequirement: -10 });
      expect(result.success).toBe(true);
    });

    it('should accept strengthRequirement of 20', () => {
      const result = defenseItemSchema.safeParse({ ...validDefensiveItem, strengthRequirement: 20 });
      expect(result.success).toBe(true);
    });

    it('should coerce string values to numbers', () => {
      const result = defenseItemSchema.safeParse({ ...validDefensiveItem, resistance: '5', dexterityRestriction: '-2' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resistance).toBe(5);
        expect(result.data.dexterityRestriction).toBe(-2);
      }
    });
  });
});
