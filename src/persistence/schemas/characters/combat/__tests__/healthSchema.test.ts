import { describe, it, expect } from 'vitest';
import { healthSchema } from '@/persistence/schemas/characters/combat/healthSchema';

describe('healthSchema', () => {
  const validHealth = {
    barrier: 10,
    vitality: 50,
    toughness: 5,
    recoveryLevel: 3,
    lethalHealth: 10,
    lethalRounds: 5,
    bonus: 20
  };

  it('should validate valid health', () => {
    const result = healthSchema.safeParse(validHealth);
    expect(result.success).toBe(true);
  });

  it('should coerce all fields from strings to numbers', () => {
    const result = healthSchema.safeParse({
      barrier: '15',
      vitality: '100',
      toughness: '10',
      recoveryLevel: '5',
      lethalHealth: '20',
      lethalRounds: '8',
      bonus: '50'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.barrier).toBe(15);
      expect(result.data.vitality).toBe(100);
      expect(result.data.toughness).toBe(10);
    }
  });

  describe('barrier field', () => {
    it('should accept barrier of 0', () => {
      const result = healthSchema.safeParse({ ...validHealth, barrier: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative barrier', () => {
      const result = healthSchema.safeParse({ ...validHealth, barrier: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bariera musi mieć co najmniej 0.');
      }
    });

    it('should accept barrier of 1000', () => {
      const result = healthSchema.safeParse({ ...validHealth, barrier: 1000 });
      expect(result.success).toBe(true);
    });

    it('should reject barrier greater than 1000', () => {
      const result = healthSchema.safeParse({ ...validHealth, barrier: 1001 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bariera musi mieć najwyżej 1000.');
      }
    });
  });

  describe('vitality field', () => {
    it('should accept vitality of 1', () => {
      const result = healthSchema.safeParse({ ...validHealth, vitality: 1 });
      expect(result.success).toBe(true);
    });

    it('should reject vitality of 0', () => {
      const result = healthSchema.safeParse({ ...validHealth, vitality: 0 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Żywotność musi mieć co najmniej 1.');
      }
    });

    it('should accept vitality of 1000', () => {
      const result = healthSchema.safeParse({ ...validHealth, vitality: 1000 });
      expect(result.success).toBe(true);
    });

    it('should reject vitality greater than 1000', () => {
      const result = healthSchema.safeParse({ ...validHealth, vitality: 1001 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Żywotność musi mieć najwyżej 1000.');
      }
    });
  });

  describe('toughness field', () => {
    it('should accept toughness of 0', () => {
      const result = healthSchema.safeParse({ ...validHealth, toughness: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative toughness', () => {
      const result = healthSchema.safeParse({ ...validHealth, toughness: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept toughness of 20', () => {
      const result = healthSchema.safeParse({ ...validHealth, toughness: 20 });
      expect(result.success).toBe(true);
    });

    it('should reject toughness greater than 20', () => {
      const result = healthSchema.safeParse({ ...validHealth, toughness: 21 });
      expect(result.success).toBe(false);
    });
  });

  describe('recoveryLevel field', () => {
    it('should accept recoveryLevel of 0', () => {
      const result = healthSchema.safeParse({ ...validHealth, recoveryLevel: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative recoveryLevel', () => {
      const result = healthSchema.safeParse({ ...validHealth, recoveryLevel: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept recoveryLevel of 20', () => {
      const result = healthSchema.safeParse({ ...validHealth, recoveryLevel: 20 });
      expect(result.success).toBe(true);
    });

    it('should reject recoveryLevel greater than 20', () => {
      const result = healthSchema.safeParse({ ...validHealth, recoveryLevel: 21 });
      expect(result.success).toBe(false);
    });
  });

  describe('lethalHealth field', () => {
    it('should accept lethalHealth of 0', () => {
      const result = healthSchema.safeParse({ ...validHealth, lethalHealth: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative lethalHealth', () => {
      const result = healthSchema.safeParse({ ...validHealth, lethalHealth: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept lethalHealth of 50', () => {
      const result = healthSchema.safeParse({ ...validHealth, lethalHealth: 50 });
      expect(result.success).toBe(true);
    });

    it('should reject lethalHealth greater than 50', () => {
      const result = healthSchema.safeParse({ ...validHealth, lethalHealth: 51 });
      expect(result.success).toBe(false);
    });
  });

  describe('lethalRounds field', () => {
    it('should accept lethalRounds of 0', () => {
      const result = healthSchema.safeParse({ ...validHealth, lethalRounds: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative lethalRounds', () => {
      const result = healthSchema.safeParse({ ...validHealth, lethalRounds: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept lethalRounds of 20', () => {
      const result = healthSchema.safeParse({ ...validHealth, lethalRounds: 20 });
      expect(result.success).toBe(true);
    });

    it('should reject lethalRounds greater than 20', () => {
      const result = healthSchema.safeParse({ ...validHealth, lethalRounds: 21 });
      expect(result.success).toBe(false);
    });
  });

  describe('bonus field', () => {
    it('should accept bonus of -50', () => {
      const result = healthSchema.safeParse({ ...validHealth, bonus: -50 });
      expect(result.success).toBe(true);
    });

    it('should reject bonus less than -50', () => {
      const result = healthSchema.safeParse({ ...validHealth, bonus: -51 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bonus musi mieć co najmniej -50.');
      }
    });

    it('should accept bonus of 1000', () => {
      const result = healthSchema.safeParse({ ...validHealth, bonus: 1000 });
      expect(result.success).toBe(true);
    });

    it('should reject bonus greater than 1000', () => {
      const result = healthSchema.safeParse({ ...validHealth, bonus: 1001 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bonus musi mieć najwyżej 1000.');
      }
    });
  });

  it('should reject non-integer values', () => {
    const result = healthSchema.safeParse({ ...validHealth, vitality: 50.5 });
    expect(result.success).toBe(false);
  });

  it('should handle all maximum boundary values', () => {
    const result = healthSchema.safeParse({
      barrier: 1000,
      vitality: 1000,
      toughness: 20,
      recoveryLevel: 20,
      lethalHealth: 50,
      lethalRounds: 20,
      bonus: 1000
    });
    expect(result.success).toBe(true);
  });

  it('should handle all minimum boundary values', () => {
    const result = healthSchema.safeParse({
      barrier: 0,
      vitality: 1,
      toughness: 0,
      recoveryLevel: 0,
      lethalHealth: 0,
      lethalRounds: 0,
      bonus: -50
    });
    expect(result.success).toBe(true);
  });
});
