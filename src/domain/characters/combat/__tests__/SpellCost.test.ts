import { describe, expect, it } from 'vitest';
import {
  calculateSpellCost,
  createFixedSpellCost,
  defaultSpellCost,
  formatSpellCost,
  normalizeSpellCost,
} from '@/domain/characters/combat/SpellCost';

describe('SpellCost', () => {
  describe('normalizeSpellCost', () => {
    it('maps a legacy numeric cost to the fixed-cost structure', () => {
      expect(normalizeSpellCost(12)).toEqual({
        ...defaultSpellCost,
        baseCost: 12,
      });
    });

    it('returns the default structure when cost is missing', () => {
      expect(normalizeSpellCost(undefined)).toEqual(defaultSpellCost);
    });
  });

  describe('calculateSpellCost', () => {
    it('returns the base cost for fixed spells', () => {
      expect(calculateSpellCost(createFixedSpellCost(15), 8)).toBe(15);
    });

    it('adds a multiplier-based SZ component', () => {
      expect(calculateSpellCost({
        baseCost: 5,
        scalingMode: 'multiply',
        scalingValue: 2,
        rounding: 'floor',
      }, 4)).toBe(13);
    });

    it('adds a floored divider-based SZ component', () => {
      expect(calculateSpellCost({
        baseCost: 10,
        scalingMode: 'divide',
        scalingValue: 2,
        rounding: 'floor',
      }, 5)).toBe(12);
    });

    it('supports ceil rounding for divider-based SZ costs', () => {
      expect(calculateSpellCost({
        baseCost: 10,
        scalingMode: 'divide',
        scalingValue: 2,
        rounding: 'ceil',
      }, 5)).toBe(13);
    });

    it('supports nearest rounding for divider-based SZ costs', () => {
      expect(calculateSpellCost({
        baseCost: 10,
        scalingMode: 'divide',
        scalingValue: 4,
        rounding: 'round',
      }, 7)).toBe(12);
    });
  });

  describe('formatSpellCost', () => {
    it('formats fixed costs as a plain number', () => {
      expect(formatSpellCost(createFixedSpellCost(20))).toBe('20');
    });

    it('formats multiplier-based costs with SZ notation', () => {
      expect(formatSpellCost({
        baseCost: 5,
        scalingMode: 'multiply',
        scalingValue: 2,
        rounding: 'floor',
      })).toBe('5 + 2×SZ');
    });

    it('formats divider-based costs with explicit rounding', () => {
      expect(formatSpellCost({
        baseCost: 10,
        scalingMode: 'divide',
        scalingValue: 2,
        rounding: 'floor',
      })).toBe('10 + floor(SZ / 2)');
    });
  });
});