import { describe, it, expect } from 'vitest';
import { getStatisticTotalTestValue, type Statistic } from '../Statistic';

describe('Statistic - Statistic Calculation System', () => {
  // Test helper
  const createStatistic = (
    grade: number,
    value: number,
    bonus: number,
    testBonus: number
  ): Statistic => ({
    grade,
    value,
    bonus,
    testBonus,
  });

  describe('getStatisticTotalTestValue()', () => {
    describe('basic calculations', () => {
      it('should sum value, bonus, and testBonus', () => {
        const statistic = createStatistic(5, 10, 2, 3);
        // 10 + 2 + 3 = 15 (grade is not included)
        expect(getStatisticTotalTestValue(statistic)).toBe(15);
      });

      it('should handle all positive values', () => {
        const statistic = createStatistic(3, 8, 4, 2);
        expect(getStatisticTotalTestValue(statistic)).toBe(14);
      });

      it('should handle all zero values', () => {
        const statistic = createStatistic(0, 0, 0, 0);
        expect(getStatisticTotalTestValue(statistic)).toBe(0);
      });

      it('should exclude grade from calculation', () => {
        const statistic = createStatistic(100, 5, 2, 1);
        // Grade should not affect the result
        expect(getStatisticTotalTestValue(statistic)).toBe(8);
      });
    });

    describe('negative values', () => {
      it('should handle negative bonus', () => {
        const statistic = createStatistic(5, 10, -3, 2);
        // 10 + (-3) + 2 = 9
        expect(getStatisticTotalTestValue(statistic)).toBe(9);
      });

      it('should handle negative testBonus', () => {
        const statistic = createStatistic(5, 10, 2, -4);
        // 10 + 2 + (-4) = 8
        expect(getStatisticTotalTestValue(statistic)).toBe(8);
      });

      it('should handle negative value', () => {
        const statistic = createStatistic(5, -5, 3, 2);
        // (-5) + 3 + 2 = 0
        expect(getStatisticTotalTestValue(statistic)).toBe(0);
      });

      it('should handle all negative values', () => {
        const statistic = createStatistic(5, -10, -2, -3);
        // (-10) + (-2) + (-3) = -15
        expect(getStatisticTotalTestValue(statistic)).toBe(-15);
      });

      it('should handle result that nets to zero', () => {
        const statistic = createStatistic(5, 10, -5, -5);
        // 10 + (-5) + (-5) = 0
        expect(getStatisticTotalTestValue(statistic)).toBe(0);
      });

      it('should handle negative result', () => {
        const statistic = createStatistic(8, 3, -4, -5);
        // 3 + (-4) + (-5) = -6
        expect(getStatisticTotalTestValue(statistic)).toBe(-6);
      });
    });

    describe('edge cases', () => {
      it('should handle large positive values', () => {
        const statistic = createStatistic(10, 1000, 500, 250);
        expect(getStatisticTotalTestValue(statistic)).toBe(1750);
      });

      it('should handle large negative values', () => {
        const statistic = createStatistic(5, -1000, -500, -250);
        expect(getStatisticTotalTestValue(statistic)).toBe(-1750);
      });

      it('should handle floating point values correctly', () => {
        const statistic = createStatistic(5, 10.5, 2.3, 1.2);
        expect(getStatisticTotalTestValue(statistic)).toBeCloseTo(14.0, 5);
      });

      it('should handle very small values', () => {
        const statistic = createStatistic(1, 0.1, 0.2, 0.3);
        expect(getStatisticTotalTestValue(statistic)).toBeCloseTo(0.6, 5);
      });

      it('should handle mixed large positive and negative values', () => {
        const statistic = createStatistic(5, 1000, -300, -200);
        // 1000 + (-300) + (-200) = 500
        expect(getStatisticTotalTestValue(statistic)).toBe(500);
      });
    });

    describe('only one component present', () => {
      it('should handle only value present', () => {
        const statistic = createStatistic(5, 10, 0, 0);
        expect(getStatisticTotalTestValue(statistic)).toBe(10);
      });

      it('should handle only bonus present', () => {
        const statistic = createStatistic(5, 0, 5, 0);
        expect(getStatisticTotalTestValue(statistic)).toBe(5);
      });

      it('should handle only testBonus present', () => {
        const statistic = createStatistic(5, 0, 0, 3);
        expect(getStatisticTotalTestValue(statistic)).toBe(3);
      });
    });

    describe('typical game scenarios', () => {
      it('should calculate test value for beginner character', () => {
        const statistic = createStatistic(2, 4, 0, 0);
        expect(getStatisticTotalTestValue(statistic)).toBe(4);
      });

      it('should calculate test value for intermediate character', () => {
        const statistic = createStatistic(5, 10, 2, 1);
        expect(getStatisticTotalTestValue(statistic)).toBe(13);
      });

      it('should calculate test value for advanced character', () => {
        const statistic = createStatistic(10, 20, 5, 3);
        expect(getStatisticTotalTestValue(statistic)).toBe(28);
      });

      it('should calculate test value with temporary penalty', () => {
        const statistic = createStatistic(5, 10, -2, 1);
        // Character has base 10, penalty -2, but test bonus +1
        expect(getStatisticTotalTestValue(statistic)).toBe(9);
      });

      it('should calculate test value with temporary buff', () => {
        const statistic = createStatistic(5, 10, 3, 5);
        // Character has base 10, bonus +3, buff +5
        expect(getStatisticTotalTestValue(statistic)).toBe(18);
      });

      it('should calculate test value with debuff only affecting test', () => {
        const statistic = createStatistic(5, 10, 2, -3);
        // Character has base 10, permanent bonus +2, but test debuff -3
        expect(getStatisticTotalTestValue(statistic)).toBe(9);
      });
    });

    describe('boundary values', () => {
      it('should handle very large positive values', () => {
        const statistic = createStatistic(5, 10000000, 5000000, 2500000);
        expect(getStatisticTotalTestValue(statistic)).toBe(17500000);
      });

      it('should handle very large negative values', () => {
        const statistic = createStatistic(5, -10000000, -5000000, -2500000);
        expect(getStatisticTotalTestValue(statistic)).toBe(-17500000);
      });

      it('should handle zero grade with high other values', () => {
        const statistic = createStatistic(0, 100, 50, 25);
        // Grade doesn't affect calculation
        expect(getStatisticTotalTestValue(statistic)).toBe(175);
      });
    });

    describe('realistic combinations', () => {
      it('should handle strength test for warrior', () => {
        const strength = createStatistic(8, 16, 3, 0);
        expect(getStatisticTotalTestValue(strength)).toBe(19);
      });

      it('should handle intelligence test for mage', () => {
        const intelligence = createStatistic(10, 20, 4, 2);
        expect(getStatisticTotalTestValue(intelligence)).toBe(26);
      });

      it('should handle dexterity test for rogue', () => {
        const dexterity = createStatistic(9, 18, 2, 1);
        expect(getStatisticTotalTestValue(dexterity)).toBe(21);
      });

      it('should handle charisma test with penalty', () => {
        const charisma = createStatistic(3, 6, 1, -2);
        expect(getStatisticTotalTestValue(charisma)).toBe(5);
      });

      it('should handle constitution test with equipment bonus', () => {
        const constitution = createStatistic(7, 14, 5, 0);
        expect(getStatisticTotalTestValue(constitution)).toBe(19);
      });
    });
  });
});
