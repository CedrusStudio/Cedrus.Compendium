import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockRandomSequence, restoreRandom } from '@/__tests__/setup';
import {
  roll,
  toOffenseString,
  toCriticalRangeString,
  calculateCriticalDamage,
  calculateWeaponDamageRoll,
  handleWeaponDamageRolls,
  handleDamageOffenseRolls,
  type WeaponOffense,
  type DamageOffense,
} from '../Offense';

describe('Offense - Dice Rolling and Damage Calculations', () => {
  afterEach(() => {
    restoreRandom();
  });

  describe('roll()', () => {
    it('should roll dice within valid range for grade 5', () => {
      mockRandomSequence([0, 0.5, 0.999]);
      expect(roll(5)).toBe(1); // floor(0 * 10) + 1
      expect(roll(5)).toBe(6); // floor(0.5 * 10) + 1
      expect(roll(5)).toBe(10); // floor(0.999 * 10) + 1
    });

    it('should roll dice within valid range for grade 10', () => {
      mockRandomSequence([0, 0.5, 0.999]);
      expect(roll(10)).toBe(1); // floor(0 * 20) + 1
      expect(roll(10)).toBe(11); // floor(0.5 * 20) + 1
      expect(roll(10)).toBe(20); // floor(0.999 * 20) + 1
    });

    it('should handle grade 1 dice (k2)', () => {
      mockRandomSequence([0, 0.999]);
      expect(roll(1)).toBe(1);
      expect(roll(1)).toBe(2);
    });

    it('should handle grade 15 dice (k30)', () => {
      mockRandomSequence([0, 0.999]);
      expect(roll(15)).toBe(1);
      expect(roll(15)).toBe(30);
    });
  });

  describe('toOffenseString()', () => {
    it('should format offense with dice and positive bonus', () => {
      expect(toOffenseString({ amount: 2, grade: 5, bonus: 3, isPhantom: false })).toBe('2k10+3');
    });

    it('should format offense with dice and negative bonus', () => {
      expect(toOffenseString({ amount: 1, grade: 3, bonus: -2, isPhantom: false })).toBe('1k6-2');
    });

    it('should format offense with dice and no bonus', () => {
      expect(toOffenseString({ amount: 3, grade: 4, bonus: 0, isPhantom: false })).toBe('3k8');
    });

    it('should format offense with only bonus (no dice)', () => {
      expect(toOffenseString({ amount: 0, grade: 5, bonus: 5, isPhantom: false })).toBe('+5');
      expect(toOffenseString({ amount: 1, grade: 0, bonus: 5, isPhantom: false })).toBe('+5');
    });

    it('should format offense with phantom dice', () => {
      expect(toOffenseString({ amount: 2, grade: 5, bonus: 0, isPhantom: true })).toBe('2k10w');
      expect(toOffenseString({ amount: 1, grade: 3, bonus: 4, isPhantom: true })).toBe('1k6w+4');
    });

    it('should format with plus sign when requested and dice present', () => {
      expect(toOffenseString({ amount: 2, grade: 5, bonus: 0, isPhantom: false }, true)).toBe('+2k10');
      expect(toOffenseString({ amount: 1, grade: 3, bonus: 2, isPhantom: false }, true)).toBe('+1k6+2');
    });

    it('should handle zero bonus', () => {
      expect(toOffenseString({ amount: 2, grade: 5, bonus: 0, isPhantom: false })).toBe('2k10');
    });

    it('should return only bonus when no dice and no bonus', () => {
      expect(toOffenseString({ amount: 0, grade: 0, bonus: 0, isPhantom: false })).toBe('');
    });
  });

  describe('toCriticalRangeString()', () => {
    it('should format critical range for grade 5, range 0', () => {
      const offense: WeaponOffense = {
        amount: 1,
        grade: 5,
        bonus: 0,
        isPhantom: false,
        critical: { power: 5, range: 0 },
      };
      expect(toCriticalRangeString(offense)).toBe('10-10');
    });

    it('should format critical range for grade 5, range 3', () => {
      const offense: WeaponOffense = {
        amount: 1,
        grade: 5,
        bonus: 0,
        isPhantom: false,
        critical: { power: 5, range: 3 },
      };
      expect(toCriticalRangeString(offense)).toBe('7-10');
    });

    it('should format critical range for grade 10, range 5', () => {
      const offense: WeaponOffense = {
        amount: 2,
        grade: 10,
        bonus: 2,
        isPhantom: false,
        critical: { power: 10, range: 5 },
      };
      expect(toCriticalRangeString(offense)).toBe('15-20');
    });

    it('should clamp critical range to 0 minimum', () => {
      const offense: WeaponOffense = {
        amount: 1,
        grade: 3,
        bonus: 0,
        isPhantom: false,
        critical: { power: 2, range: 10 }, // range > grade*2
      };
      expect(toCriticalRangeString(offense)).toBe('0-6');
    });
  });

  describe('calculateCriticalDamage()', () => {
    const createOffense = (grade: number, criticalRange: number, criticalPower: number): WeaponOffense => ({
      amount: 1,
      grade,
      bonus: 0,
      isPhantom: false,
      critical: { power: criticalPower, range: criticalRange },
    });

    it('should return critical damage when roll meets threshold', () => {
      const offense = createOffense(5, 3, 10); // k10, critical 7-10, power 10
      expect(calculateCriticalDamage(offense, 10)).toBe(10);
      expect(calculateCriticalDamage(offense, 7)).toBe(10);
    });

    it('should return 0 when roll does not meet threshold', () => {
      const offense = createOffense(5, 3, 10); // k10, critical 7-10, power 10
      expect(calculateCriticalDamage(offense, 6)).toBe(0);
      expect(calculateCriticalDamage(offense, 1)).toBe(0);
    });

    it('should handle critical range 0 (only max roll critical)', () => {
      const offense = createOffense(5, 0, 8); // k10, critical 10-10
      expect(calculateCriticalDamage(offense, 10)).toBe(8);
      expect(calculateCriticalDamage(offense, 9)).toBe(0);
    });

    it('should handle wide critical range', () => {
      const offense = createOffense(5, 5, 5); // k10, critical 5-10
      expect(calculateCriticalDamage(offense, 10)).toBe(5);
      expect(calculateCriticalDamage(offense, 5)).toBe(5);
      expect(calculateCriticalDamage(offense, 4)).toBe(0);
    });
  });

  describe('calculateWeaponDamageRoll()', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return damage and critical damage for critical hit', () => {
      mockRandomSequence([0.999]); // Roll max (10 for k10)
      const offense: WeaponOffense = {
        amount: 1,
        grade: 5,
        bonus: 2,
        isPhantom: false,
        critical: { power: 8, range: 0 },
      };
      const [damage, critical] = calculateWeaponDamageRoll(offense);
      expect(damage).toBe(10);
      expect(critical).toBe(8);
    });

    it('should return damage and 0 critical for non-critical hit', () => {
      mockRandomSequence([0.5]); // Roll 6 for k10
      const offense: WeaponOffense = {
        amount: 1,
        grade: 5,
        bonus: 2,
        isPhantom: false,
        critical: { power: 8, range: 0 },
      };
      const [damage, critical] = calculateWeaponDamageRoll(offense);
      expect(damage).toBe(6);
      expect(critical).toBe(0);
    });
  });

  describe('handleWeaponDamageRolls()', () => {
    it('should handle single weapon roll without critical', () => {
      mockRandomSequence([0.5]); // Roll 6 for k10
      const offense: WeaponOffense = {
        amount: 1,
        grade: 5,
        bonus: 3,
        isPhantom: false,
        critical: { power: 5, range: 0 },
      };
      const result = handleWeaponDamageRolls(offense);
      expect(result.total).toBe(9); // 6 + 3 bonus
      expect(result.rolls).toEqual([[6, false]]);
    });

    it('should handle multiple weapon rolls with mixed criticals', () => {
      mockRandomSequence([0.999, 0.3, 0.999]); // Rolls: 10 (crit), 4 (no crit), 10 (crit)
      const offense: WeaponOffense = {
        amount: 3,
        grade: 5,
        bonus: 2,
        isPhantom: false,
        critical: { power: 5, range: 0 },
      };
      const result = handleWeaponDamageRolls(offense);
      // (10+2+5) + (4+2+0) + (10+2+5) = 17 + 6 + 17 = 40
      expect(result.total).toBe(40);
      expect(result.rolls).toEqual([
        [10, true],
        [4, false],
        [10, true],
      ]);
    });

    it('should handle weapon with zero bonus', () => {
      mockRandomSequence([0.5]);
      const offense: WeaponOffense = {
        amount: 1,
        grade: 3,
        bonus: 0,
        isPhantom: false,
        critical: { power: 0, range: 0 },
      };
      const result = handleWeaponDamageRolls(offense);
      expect(result.total).toBe(4); // floor(0.5 * 6) + 1 = 4
      expect(result.rolls).toEqual([[4, false]]);
    });
  });

  describe('handleDamageOffenseRolls()', () => {
    it('should handle undefined offense', () => {
      const result = handleDamageOffenseRolls(undefined);
      expect(result.total).toBe(0);
      expect(result.rolls).toEqual([]);
    });

    it('should handle single damage roll with bonus', () => {
      mockRandomSequence([0.5]); // Roll 6 for k10
      const offense: DamageOffense = {
        amount: 1,
        grade: 5,
        bonus: 3,
        isPhantom: false,
      };
      const result = handleDamageOffenseRolls(offense);
      expect(result.total).toBe(9); // 6 + 3
      expect(result.rolls).toEqual([6]);
    });

    it('should handle multiple damage rolls', () => {
      mockRandomSequence([0.3, 0.7, 0.1]); // Rolls: 4, 8, 2 for k10
      const offense: DamageOffense = {
        amount: 3,
        grade: 5,
        bonus: 5,
        isPhantom: false,
      };
      const result = handleDamageOffenseRolls(offense);
      expect(result.total).toBe(19); // 4 + 8 + 2 + 5 = 19
      expect(result.rolls).toEqual([4, 8, 2]);
    });

    it('should handle zero amount', () => {
      const offense: DamageOffense = {
        amount: 0,
        grade: 5,
        bonus: 3,
        isPhantom: false,
      };
      const result = handleDamageOffenseRolls(offense);
      expect(result.total).toBe(3); // Only bonus
      expect(result.rolls).toEqual([]);
    });

    it('should handle negative bonus', () => {
      mockRandomSequence([0.5]); // Roll 6
      const offense: DamageOffense = {
        amount: 1,
        grade: 5,
        bonus: -2,
        isPhantom: false,
      };
      const result = handleDamageOffenseRolls(offense);
      expect(result.total).toBe(4); // 6 - 2
      expect(result.rolls).toEqual([6]);
    });
  });
});
