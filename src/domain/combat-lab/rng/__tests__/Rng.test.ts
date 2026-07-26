import { describe, it, expect } from 'vitest';
import { createRng, mathRandomRng } from '@/domain/combat-lab/rng/Rng';

describe('Rng - deterministic seedable generator', () => {
  describe('createRng()', () => {
    it('produces an identical sequence for the same seed', () => {
      const a = createRng(12345);
      const b = createRng(12345);

      const seqA = Array.from({ length: 20 }, () => a.next());
      const seqB = Array.from({ length: 20 }, () => b.next());

      expect(seqA).toEqual(seqB);
    });

    it('produces different sequences for different seeds', () => {
      const a = createRng(1);
      const b = createRng(2);

      const seqA = Array.from({ length: 20 }, () => a.next());
      const seqB = Array.from({ length: 20 }, () => b.next());

      expect(seqA).not.toEqual(seqB);
    });

    it('emits floats within [0, 1)', () => {
      const rng = createRng(999);
      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('exposes the seed it was created with', () => {
      expect(createRng(42).seed).toBe(42);
    });
  });

  describe('nextInt()', () => {
    it('stays within [0, maxExclusive)', () => {
      const rng = createRng(7);
      for (let i = 0; i < 1000; i++) {
        const value = rng.nextInt(6);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(6);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('is reproducible for the same seed', () => {
      const a = createRng(555);
      const b = createRng(555);
      const seqA = Array.from({ length: 50 }, () => a.nextInt(100));
      const seqB = Array.from({ length: 50 }, () => b.nextInt(100));
      expect(seqA).toEqual(seqB);
    });

    it('throws when maxExclusive <= 0', () => {
      const rng = createRng(1);
      expect(() => rng.nextInt(0)).toThrow();
      expect(() => rng.nextInt(-3)).toThrow();
    });
  });

  describe('nextIntInclusive()', () => {
    it('stays within [min, max] inclusive', () => {
      const rng = createRng(3);
      const seen = new Set<number>();
      for (let i = 0; i < 2000; i++) {
        const value = rng.nextIntInclusive(1, 6);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(6);
        seen.add(value);
      }
      // Over 2000 d6 rolls we expect every face to appear.
      expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('handles a single-value range', () => {
      const rng = createRng(1);
      expect(rng.nextIntInclusive(5, 5)).toBe(5);
    });

    it('throws when max < min', () => {
      const rng = createRng(1);
      expect(() => rng.nextIntInclusive(6, 1)).toThrow();
    });
  });

  describe('mathRandomRng', () => {
    it('produces floats within [0, 1)', () => {
      for (let i = 0; i < 100; i++) {
        const value = mathRandomRng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('nextInt stays within range', () => {
      for (let i = 0; i < 100; i++) {
        const value = mathRandomRng.nextInt(10);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(10);
      }
    });
  });
});
