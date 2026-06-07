import { describe, it, expect } from 'vitest';
import { calculateTotalHealth, type Health } from '@/domain/characters/combat/Health';
import type { Statistic } from '@/domain/characters/statistics/Statistic';

describe('Health - Total Health Calculations', () => {
  const createHealth = (overrides?: Partial<Health>): Health => ({
    barrier: 0,
    vitality: 10,
    toughness: 5,
    recoveryLevel: 1,
    lethalHealth: 0,
    lethalRounds: 0,
    bonus: 0,
    ...overrides,
  });

  const createStatistic = (value: number, bonus: number = 0): Statistic => ({
    grade: value,
    value,
    bonus,
    testBonus: 0,
  });

  describe('calculateTotalHealth()', () => {
    it('should calculate basic health with no bonuses', () => {
      const health = createHealth({ vitality: 10, toughness: 5, bonus: 0 });
      const constitution = createStatistic(3, 0);
      const fortitude = createStatistic(2, 0);
      
      // 10 + (5 * 3) + 0 + 2 + 0 = 10 + 15 + 2 = 27
      expect(calculateTotalHealth(health, constitution, fortitude)).toBe(27);
    });

    it('should include constitution bonus', () => {
      const health = createHealth({ vitality: 10, toughness: 5, bonus: 0 });
      const constitution = createStatistic(3, 5);
      const fortitude = createStatistic(2, 0);
      
      // 10 + (5 * 3) + 5 + 2 + 0 = 32
      expect(calculateTotalHealth(health, constitution, fortitude)).toBe(32);
    });

    it('should include fortitude bonus', () => {
      const health = createHealth({ vitality: 10, toughness: 5, bonus: 0 });
      const constitution = createStatistic(3, 0);
      const fortitude = createStatistic(2, 4);

      // 10 + (5 * 3) + 0 + 2 + 4 + 0 = 31
      expect(calculateTotalHealth(health, constitution, fortitude)).toBe(31);
    });

    it('should include health bonus', () => {
      const health = createHealth({ vitality: 10, toughness: 5, bonus: 8 });
      const constitution = createStatistic(3, 0);
      const fortitude = createStatistic(2, 0);
      
      // 10 + (5 * 3) + 0 + 2 + 8 = 35
      expect(calculateTotalHealth(health, constitution, fortitude)).toBe(35);
    });

    it('should handle high constitution value', () => {
      const health = createHealth({ vitality: 15, toughness: 4, bonus: 0 });
      const constitution = createStatistic(10, 3);
      const fortitude = createStatistic(5, 0);
      
      // 15 + (4 * 10) + 3 + 5 + 0 = 15 + 40 + 3 + 5 = 63
      expect(calculateTotalHealth(health, constitution, fortitude)).toBe(63);
    });

    it('should handle zero toughness', () => {
      const health = createHealth({ vitality: 20, toughness: 0, bonus: 0 });
      const constitution = createStatistic(5, 2);
      const fortitude = createStatistic(3, 0);
      
      // 20 + (0 * 5) + 2 + 3 + 0 = 25
      expect(calculateTotalHealth(health, constitution, fortitude)).toBe(25);
    });

    it('should handle zero fortitude', () => {
      const health = createHealth({ vitality: 10, toughness: 3, bonus: 0 });
      const constitution = createStatistic(4, 1);
      const fortitude = createStatistic(0, 0);
      
      // 10 + (3 * 4) + 1 + 0 + 0 = 23
      expect(calculateTotalHealth(health, constitution, fortitude)).toBe(23);
    });

    it('should handle minimum values', () => {
      const health = createHealth({ vitality: 1, toughness: 1, bonus: 0 });
      const constitution = createStatistic(1, 0);
      const fortitude = createStatistic(0, 0);
      
      // 1 + (1 * 1) + 0 + 0 + 0 = 2
      expect(calculateTotalHealth(health, constitution, fortitude)).toBe(2);
    });

    it('should handle all bonuses combined', () => {
      const health = createHealth({ vitality: 12, toughness: 6, bonus: 10 });
      const constitution = createStatistic(5, 8);
      const fortitude = createStatistic(7, 0);
      
      // 12 + (6 * 5) + 8 + 7 + 10 = 12 + 30 + 8 + 7 + 10 = 67
      expect(calculateTotalHealth(health, constitution, fortitude)).toBe(67);
    });

    it('should handle negative health bonus', () => {
      const health = createHealth({ vitality: 20, toughness: 5, bonus: -5 });
      const constitution = createStatistic(3, 0);
      const fortitude = createStatistic(2, 0);
      
      // 20 + (5 * 3) + 0 + 2 + (-5) = 32
      expect(calculateTotalHealth(health, constitution, fortitude)).toBe(32);
    });

    it('should handle large toughness multiplier', () => {
      const health = createHealth({ vitality: 10, toughness: 10, bonus: 0 });
      const constitution = createStatistic(8, 2);
      const fortitude = createStatistic(4, 0);
      
      // 10 + (10 * 8) + 2 + 4 + 0 = 96
      expect(calculateTotalHealth(health, constitution, fortitude)).toBe(96);
    });

    it('should correctly multiply toughness by constitution value', () => {
      const health = createHealth({ vitality: 0, toughness: 7, bonus: 0 });
      const constitution = createStatistic(6, 0);
      const fortitude = createStatistic(0, 0);
      
      // 0 + (7 * 6) + 0 + 0 + 0 = 42
      expect(calculateTotalHealth(health, constitution, fortitude)).toBe(42);
    });
  });
});
