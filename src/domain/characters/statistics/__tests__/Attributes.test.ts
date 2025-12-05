import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rollInitiative, rollInitiativeBase } from '@/domain/characters/statistics/Attributes';
import { Statistic } from '@/domain/characters/statistics/Statistic';

describe('Attributes - Initiative Rolling', () => {
  describe('rollInitiativeBase', () => {
    let mathRandomSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mathRandomSpy = vi.spyOn(Math, 'random');
    });

    afterEach(() => {
      mathRandomSpy.mockRestore();
    });

    it('should calculate minimum initiative roll (dice roll = 1)', () => {
      // Math.random() * grade * 2 = 0 -> floor(0) + 1 = 1
      mathRandomSpy.mockReturnValue(0);
      const result = rollInitiativeBase(3, 5, 2, 1);
      expect(result).toBe(1 + 5 + 2 + 1); // 9
    });

    it('should calculate maximum initiative roll (dice roll = grade * 2)', () => {
      // For grade=3: Math.random() * 6 should be just under 6 to get floor(5.99) + 1 = 6
      mathRandomSpy.mockReturnValue(0.999);
      const result = rollInitiativeBase(3, 5, 2, 1);
      expect(result).toBe(6 + 5 + 2 + 1); // 14
    });

    it('should calculate mid-range initiative roll', () => {
      // For grade=3: Math.random() = 0.5 -> 0.5 * 6 = 3 -> floor(3) + 1 = 4
      mathRandomSpy.mockReturnValue(0.5);
      const result = rollInitiativeBase(3, 5, 2, 1);
      expect(result).toBe(4 + 5 + 2 + 1); // 12
    });

    it('should work with grade=4 dice', () => {
      // For grade=4: range is 1-8
      mathRandomSpy.mockReturnValue(0);
      expect(rollInitiativeBase(4, 0, 0, 0)).toBe(1);

      mathRandomSpy.mockReturnValue(0.999);
      expect(rollInitiativeBase(4, 0, 0, 0)).toBe(8);

      mathRandomSpy.mockReturnValue(0.5);
      expect(rollInitiativeBase(4, 0, 0, 0)).toBe(5); // floor(4) + 1
    });

    it('should work with grade=6 dice', () => {
      // For grade=6: range is 1-12
      mathRandomSpy.mockReturnValue(0);
      expect(rollInitiativeBase(6, 0, 0, 0)).toBe(1);

      mathRandomSpy.mockReturnValue(0.999);
      expect(rollInitiativeBase(6, 0, 0, 0)).toBe(12);

      mathRandomSpy.mockReturnValue(0.5);
      expect(rollInitiativeBase(6, 0, 0, 0)).toBe(7); // floor(6) + 1
    });

    it('should add value modifier correctly', () => {
      mathRandomSpy.mockReturnValue(0);
      expect(rollInitiativeBase(3, 10, 0, 0)).toBe(1 + 10); // 11
      expect(rollInitiativeBase(3, 20, 0, 0)).toBe(1 + 20); // 21
    });

    it('should add bonus modifier correctly', () => {
      mathRandomSpy.mockReturnValue(0);
      expect(rollInitiativeBase(3, 0, 5, 0)).toBe(1 + 5); // 6
      expect(rollInitiativeBase(3, 0, -2, 0)).toBe(1 - 2); // -1
    });

    it('should add testBonus modifier correctly', () => {
      mathRandomSpy.mockReturnValue(0);
      expect(rollInitiativeBase(3, 0, 0, 3)).toBe(1 + 3); // 4
      expect(rollInitiativeBase(3, 0, 0, -1)).toBe(1 - 1); // 0
    });

    it('should handle all modifiers together', () => {
      mathRandomSpy.mockReturnValue(0.5); // dice roll = 4 for grade=3
      const result = rollInitiativeBase(3, 10, 5, 2);
      expect(result).toBe(4 + 10 + 5 + 2); // 21
    });

    it('should handle zero values for all modifiers', () => {
      mathRandomSpy.mockReturnValue(0.5);
      const result = rollInitiativeBase(3, 0, 0, 0);
      expect(result).toBe(4); // only dice roll
    });

    it('should handle negative modifiers', () => {
      mathRandomSpy.mockReturnValue(0.5);
      const result = rollInitiativeBase(3, -2, -3, -1);
      expect(result).toBe(4 - 2 - 3 - 1); // -2
    });

    it('should produce result within expected range', () => {
      mathRandomSpy.mockRestore(); // Use real random for this test
      const grade = 3;
      const value = 5;
      const bonus = 2;
      const testBonus = 1;
      
      // Run multiple times to verify range
      for (let i = 0; i < 100; i++) {
        const result = rollInitiativeBase(grade, value, bonus, testBonus);
        const minExpected = 1 + value + bonus + testBonus; // 9
        const maxExpected = (grade * 2) + value + bonus + testBonus; // 14
        expect(result).toBeGreaterThanOrEqual(minExpected);
        expect(result).toBeLessThanOrEqual(maxExpected);
      }
    });

    it('should handle edge case with grade=1', () => {
      mathRandomSpy.mockReturnValue(0);
      expect(rollInitiativeBase(1, 0, 0, 0)).toBe(1);

      mathRandomSpy.mockReturnValue(0.999);
      expect(rollInitiativeBase(1, 0, 0, 0)).toBe(2); // floor(1.998) + 1
    });

    it('should handle large grade values', () => {
      mathRandomSpy.mockReturnValue(0);
      expect(rollInitiativeBase(10, 0, 0, 0)).toBe(1);

      mathRandomSpy.mockReturnValue(0.999);
      expect(rollInitiativeBase(10, 0, 0, 0)).toBe(20); // floor(19.98) + 1
    });
  });

  describe('rollInitiative', () => {
    let mathRandomSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mathRandomSpy = vi.spyOn(Math, 'random');
    });

    afterEach(() => {
      mathRandomSpy.mockRestore();
    });

    it('should use Statistic properties correctly', () => {
      mathRandomSpy.mockReturnValue(0.5);
      
      const stat: Statistic = {
        grade: 3,
        value: 10,
        bonus: 5,
        testBonus: 2
      };

      const result = rollInitiative(stat);
      expect(result).toBe(4 + 10 + 5 + 2); // 21
    });

    it('should handle minimum roll with Statistic', () => {
      mathRandomSpy.mockReturnValue(0);
      
      const stat: Statistic = {
        grade: 3,
        value: 5,
        bonus: 0,
        testBonus: 0
      };

      expect(rollInitiative(stat)).toBe(1 + 5); // 6
    });

    it('should handle maximum roll with Statistic', () => {
      mathRandomSpy.mockReturnValue(0.999);
      
      const stat: Statistic = {
        grade: 3,
        value: 5,
        bonus: 0,
        testBonus: 0
      };

      expect(rollInitiative(stat)).toBe(6 + 5); // 11
    });

    it('should work with all zero Statistic', () => {
      mathRandomSpy.mockReturnValue(0.5);
      
      const stat: Statistic = {
        grade: 3,
        value: 0,
        bonus: 0,
        testBonus: 0
      };

      expect(rollInitiative(stat)).toBe(4); // only dice roll
    });

    it('should work with negative bonuses in Statistic', () => {
      mathRandomSpy.mockReturnValue(0.5);
      
      const stat: Statistic = {
        grade: 3,
        value: 10,
        bonus: -3,
        testBonus: -2
      };

      expect(rollInitiative(stat)).toBe(4 + 10 - 3 - 2); // 9
    });

    it('should work with different grade values', () => {
      mathRandomSpy.mockReturnValue(0.5);
      
      const stat4: Statistic = { grade: 4, value: 0, bonus: 0, testBonus: 0 };
      expect(rollInitiative(stat4)).toBe(5);

      const stat6: Statistic = { grade: 6, value: 0, bonus: 0, testBonus: 0 };
      expect(rollInitiative(stat6)).toBe(7);
    });

    it('should delegate to rollInitiativeBase correctly', () => {
      mathRandomSpy.mockReturnValue(0.25);
      
      const stat: Statistic = {
        grade: 4,
        value: 15,
        bonus: 3,
        testBonus: 1
      };

      const resultFromRollInitiative = rollInitiative(stat);
      const resultFromBase = rollInitiativeBase(
        stat.grade,
        stat.value,
        stat.bonus,
        stat.testBonus
      );

      expect(resultFromRollInitiative).toBe(resultFromBase);
    });
  });

  describe('Integration tests', () => {
    it('should produce consistent results for same random seed', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random');
      mathRandomSpy.mockReturnValue(0.7);

      const stat: Statistic = { grade: 3, value: 10, bonus: 2, testBonus: 1 };
      
      const result1 = rollInitiative(stat);
      const result2 = rollInitiative(stat);
      
      expect(result1).toBe(result2);
      
      mathRandomSpy.mockRestore();
    });

    it('should produce different results with real random', () => {
      const stat: Statistic = { grade: 3, value: 10, bonus: 2, testBonus: 1 };
      
      const results = new Set();
      for (let i = 0; i < 50; i++) {
        results.add(rollInitiative(stat));
      }
      
      // With 50 rolls, we should get at least 3 different values
      expect(results.size).toBeGreaterThan(3);
    });
  });
});
