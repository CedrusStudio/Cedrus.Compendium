import { describe, it, expect } from 'vitest';
import { statisticSchema } from '@/persistence/schemas/characters/statistics/statisticSchema';

describe('statisticSchema', () => {
  const validStatistic = {
    grade: 3,
    value: 5,
    bonus: 2,
    testBonus: 1
  };

  it('should validate valid statistic', () => {
    const result = statisticSchema.safeParse(validStatistic);
    expect(result.success).toBe(true);
  });

  it('should coerce all fields from strings to numbers', () => {
    const result = statisticSchema.safeParse({
      grade: '10',
      value: '15',
      bonus: '5',
      testBonus: '3'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grade).toBe(10);
      expect(result.data.value).toBe(15);
      expect(result.data.bonus).toBe(5);
      expect(result.data.testBonus).toBe(3);
    }
  });

  describe('grade field', () => {
    it('should accept grade of 1', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, grade: 1 });
      expect(result.success).toBe(true);
    });

    it('should reject grade of 0', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, grade: 0 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Ranga musi mieć co najmniej 1.');
      }
    });

    it('should accept grade of 50', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, grade: 50 });
      expect(result.success).toBe(true);
    });

    it('should reject grade of 51', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, grade: 51 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Ranga musi być najwyżej 50.');
      }
    });

    it('should reject non-integer grade', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, grade: 3.5 });
      expect(result.success).toBe(false);
    });
  });

  describe('value field', () => {
    it('should accept value of -10', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, value: -10 });
      expect(result.success).toBe(true);
    });

    it('should reject value less than -10', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, value: -11 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Wartość musi być co najmniej -10.');
      }
    });

    it('should accept value of 25', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, value: 25 });
      expect(result.success).toBe(true);
    });

    it('should reject value greater than 25', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, value: 26 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Wartość musi być najwyżej 25.');
      }
    });

    it('should accept value of 0', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, value: 0 });
      expect(result.success).toBe(true);
    });
  });

  describe('bonus field', () => {
    it('should accept bonus of -10', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, bonus: -10 });
      expect(result.success).toBe(true);
    });

    it('should reject bonus less than -10', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, bonus: -11 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bonus musi być co najmniej -10.');
      }
    });

    it('should accept bonus of 20', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, bonus: 20 });
      expect(result.success).toBe(true);
    });

    it('should reject bonus greater than 20', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, bonus: 21 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bonus musi być najwyżej 20.');
      }
    });
  });

  describe('testBonus field', () => {
    it('should accept testBonus of -10', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, testBonus: -10 });
      expect(result.success).toBe(true);
    });

    it('should reject testBonus less than -10', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, testBonus: -11 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bonus testowy musi być co najmniej -10.');
      }
    });

    it('should accept testBonus of 20', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, testBonus: 20 });
      expect(result.success).toBe(true);
    });

    it('should reject testBonus greater than 20', () => {
      const result = statisticSchema.safeParse({ ...validStatistic, testBonus: 21 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Bonus testowy musi być najwyżej 20.');
      }
    });
  });

  it('should reject missing required fields', () => {
    const result = statisticSchema.safeParse({ grade: 1 });
    expect(result.success).toBe(false);
  });

  it('should handle all boundary values simultaneously', () => {
    const result = statisticSchema.safeParse({
      grade: 50,
      value: 25,
      bonus: 20,
      testBonus: 20
    });
    expect(result.success).toBe(true);
  });

  it('should handle all minimum values simultaneously', () => {
    const result = statisticSchema.safeParse({
      grade: 1,
      value: -10,
      bonus: -10,
      testBonus: -10
    });
    expect(result.success).toBe(true);
  });
});
