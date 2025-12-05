import { describe, it, expect } from 'vitest';
import {
  calculateSelectedReduction,
  filteredDefenseKeys,
  CreateDefaultDefense,
  type Defense,
  type ReductionType,
} from '@/domain/characters/combat/Defense';

describe('Defense - Defense Calculation System', () => {
  // Test helper
  const createDefense = (overrides?: Partial<Defense>): Defense => ({
    id: 'test-id',
    name: 'Test Defense',
    description: 'Test description',
    immunity: 0,
    resistance: 0,
    protection: 5,
    block: 3,
    parry: 4,
    dodge: 2,
    bonus: 1,
    ...overrides,
  });

  describe('calculateSelectedReduction()', () => {
    describe('full reduction type', () => {
      it('should sum block, parry, dodge, bonus, and protection', () => {
        const defense = createDefense({
          protection: 5,
          block: 3,
          parry: 4,
          dodge: 2,
          bonus: 1,
        });
        // 5 + 3 + 4 + 2 + 1 = 15
        expect(calculateSelectedReduction(defense, 'full')).toBe(15);
      });

      it('should exclude immunity and resistance', () => {
        const defense = createDefense({
          immunity: 10,
          resistance: 8,
          protection: 5,
          block: 3,
          parry: 4,
          dodge: 2,
          bonus: 1,
        });
        // immunity and resistance are not included in full
        expect(calculateSelectedReduction(defense, 'full')).toBe(15);
      });

      it('should handle zero values', () => {
        const defense = createDefense({
          protection: 0,
          block: 0,
          parry: 0,
          dodge: 0,
          bonus: 0,
        });
        expect(calculateSelectedReduction(defense, 'full')).toBe(0);
      });

      it('should handle large values', () => {
        const defense = createDefense({
          protection: 50,
          block: 30,
          parry: 40,
          dodge: 20,
          bonus: 10,
        });
        expect(calculateSelectedReduction(defense, 'full')).toBe(150);
      });
    });

    describe('block reduction type', () => {
      it('should sum block, bonus, and protection only', () => {
        const defense = createDefense({
          protection: 5,
          block: 3,
          parry: 4,
          dodge: 2,
          bonus: 1,
        });
        // 5 + 3 + 1 = 9 (excludes parry and dodge)
        expect(calculateSelectedReduction(defense, 'block')).toBe(9);
      });

      it('should exclude parry and dodge', () => {
        const defense = createDefense({
          protection: 10,
          block: 5,
          parry: 100,
          dodge: 200,
          bonus: 2,
        });
        expect(calculateSelectedReduction(defense, 'block')).toBe(17);
      });

      it('should handle zero values for block type', () => {
        const defense = createDefense({
          protection: 0,
          block: 0,
          bonus: 0,
        });
        expect(calculateSelectedReduction(defense, 'block')).toBe(0);
      });

      it('should include only block-related defenses', () => {
        const defense = createDefense({
          immunity: 5,
          resistance: 5,
          protection: 2,
          block: 8,
          parry: 3,
          dodge: 3,
          bonus: 4,
        });
        // 2 + 8 + 4 = 14
        expect(calculateSelectedReduction(defense, 'block')).toBe(14);
      });
    });

    describe('direct reduction type', () => {
      it('should sum bonus and protection only', () => {
        const defense = createDefense({
          protection: 5,
          block: 3,
          parry: 4,
          dodge: 2,
          bonus: 1,
        });
        // 5 + 1 = 6 (excludes block, parry, dodge)
        expect(calculateSelectedReduction(defense, 'direct')).toBe(6);
      });

      it('should exclude block, parry, and dodge', () => {
        const defense = createDefense({
          protection: 10,
          block: 100,
          parry: 200,
          dodge: 300,
          bonus: 5,
        });
        expect(calculateSelectedReduction(defense, 'direct')).toBe(15);
      });

      it('should handle zero values for direct type', () => {
        const defense = createDefense({
          protection: 0,
          bonus: 0,
        });
        expect(calculateSelectedReduction(defense, 'direct')).toBe(0);
      });

      it('should include only direct damage reduction', () => {
        const defense = createDefense({
          immunity: 10,
          resistance: 10,
          protection: 7,
          block: 5,
          parry: 5,
          dodge: 5,
          bonus: 3,
        });
        // 7 + 3 = 10
        expect(calculateSelectedReduction(defense, 'direct')).toBe(10);
      });
    });

    describe('invalid reduction type', () => {
      it('should throw error for invalid reduction type', () => {
        const defense = createDefense();
        expect(() =>
          calculateSelectedReduction(defense, 'invalid' as ReductionType)
        ).toThrow('Invalid reduction type');
      });
    });
  });

  describe('filteredDefenseKeys()', () => {
    const defense = createDefense();

    describe('full reduction type', () => {
      it('should include all active defense keys', () => {
        const keys = filteredDefenseKeys(defense, 'full');
        expect(keys).toContain('protection');
        expect(keys).toContain('block');
        expect(keys).toContain('parry');
        expect(keys).toContain('dodge');
        expect(keys).toContain('bonus');
      });

      it('should exclude metadata and passive keys', () => {
        const keys = filteredDefenseKeys(defense, 'full');
        expect(keys).not.toContain('id');
        expect(keys).not.toContain('name');
        expect(keys).not.toContain('description');
        expect(keys).not.toContain('immunity');
        expect(keys).not.toContain('resistance');
      });

      it('should return correct count of keys', () => {
        const keys = filteredDefenseKeys(defense, 'full');
        // Should have: protection, block, parry, dodge, bonus = 5 keys
        expect(keys.length).toBe(5);
      });
    });

    describe('block reduction type', () => {
      it('should include block-related keys only', () => {
        const keys = filteredDefenseKeys(defense, 'block');
        expect(keys).toContain('protection');
        expect(keys).toContain('block');
        expect(keys).toContain('bonus');
      });

      it('should exclude parry and dodge', () => {
        const keys = filteredDefenseKeys(defense, 'block');
        expect(keys).not.toContain('parry');
        expect(keys).not.toContain('dodge');
      });

      it('should exclude metadata and passive keys', () => {
        const keys = filteredDefenseKeys(defense, 'block');
        expect(keys).not.toContain('id');
        expect(keys).not.toContain('name');
        expect(keys).not.toContain('description');
        expect(keys).not.toContain('immunity');
        expect(keys).not.toContain('resistance');
      });

      it('should return correct count of keys', () => {
        const keys = filteredDefenseKeys(defense, 'block');
        // Should have: protection, block, bonus = 3 keys
        expect(keys.length).toBe(3);
      });
    });

    describe('direct reduction type', () => {
      it('should include direct damage reduction keys only', () => {
        const keys = filteredDefenseKeys(defense, 'direct');
        expect(keys).toContain('protection');
        expect(keys).toContain('bonus');
      });

      it('should exclude block, parry, and dodge', () => {
        const keys = filteredDefenseKeys(defense, 'direct');
        expect(keys).not.toContain('block');
        expect(keys).not.toContain('parry');
        expect(keys).not.toContain('dodge');
      });

      it('should exclude metadata and passive keys', () => {
        const keys = filteredDefenseKeys(defense, 'direct');
        expect(keys).not.toContain('id');
        expect(keys).not.toContain('name');
        expect(keys).not.toContain('description');
        expect(keys).not.toContain('immunity');
        expect(keys).not.toContain('resistance');
      });

      it('should return correct count of keys', () => {
        const keys = filteredDefenseKeys(defense, 'direct');
        // Should have: protection, bonus = 2 keys
        expect(keys.length).toBe(2);
      });
    });

    describe('invalid reduction type', () => {
      it('should throw error for invalid reduction type', () => {
        expect(() =>
          filteredDefenseKeys(defense, 'invalid' as ReductionType)
        ).toThrow('Invalid reduction type');
      });
    });
  });

  describe('CreateDefaultDefense()', () => {
    it('should create defense with default values', () => {
      const defense = CreateDefaultDefense();
      expect(defense.name).toBe('Nowa Defensywa');
      expect(defense.description).toBe('Opis defensywy');
      expect(defense.immunity).toBe(0);
      expect(defense.resistance).toBe(0);
      expect(defense.protection).toBe(0);
      expect(defense.block).toBe(0);
      expect(defense.parry).toBe(0);
      expect(defense.dodge).toBe(0);
      expect(defense.bonus).toBe(0);
    });

    it('should create defense with unique id', () => {
      const defense = CreateDefaultDefense();
      expect(defense.id).toBeDefined();
      expect(typeof defense.id).toBe('string');
      expect(defense.id.length).toBeGreaterThan(0);
    });

    it('should create multiple defenses with same default values', () => {
      const defense1 = CreateDefaultDefense();
      const defense2 = CreateDefaultDefense();
      expect(defense1.name).toBe(defense2.name);
      expect(defense1.immunity).toBe(defense2.immunity);
      expect(defense1.protection).toBe(defense2.protection);
    });

    it('should create defense object with all required fields', () => {
      const defense = CreateDefaultDefense();
      expect(defense).toHaveProperty('id');
      expect(defense).toHaveProperty('name');
      expect(defense).toHaveProperty('description');
      expect(defense).toHaveProperty('immunity');
      expect(defense).toHaveProperty('resistance');
      expect(defense).toHaveProperty('protection');
      expect(defense).toHaveProperty('block');
      expect(defense).toHaveProperty('parry');
      expect(defense).toHaveProperty('dodge');
      expect(defense).toHaveProperty('bonus');
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle defense with all zeros for all reduction types', () => {
      const defense = createDefense({
        immunity: 0,
        resistance: 0,
        protection: 0,
        block: 0,
        parry: 0,
        dodge: 0,
        bonus: 0,
      });
      expect(calculateSelectedReduction(defense, 'full')).toBe(0);
      expect(calculateSelectedReduction(defense, 'block')).toBe(0);
      expect(calculateSelectedReduction(defense, 'direct')).toBe(0);
    });

    it('should handle defense with maximum values', () => {
      const defense = createDefense({
        protection: 999,
        block: 999,
        parry: 999,
        dodge: 999,
        bonus: 999,
      });
      expect(calculateSelectedReduction(defense, 'full')).toBe(4995);
      expect(calculateSelectedReduction(defense, 'block')).toBe(2997);
      expect(calculateSelectedReduction(defense, 'direct')).toBe(1998);
    });

    it('should calculate reductions hierarchically (direct < block < full)', () => {
      const defense = createDefense({
        protection: 10,
        block: 5,
        parry: 3,
        dodge: 2,
        bonus: 4,
      });
      const directReduction = calculateSelectedReduction(defense, 'direct');
      const blockReduction = calculateSelectedReduction(defense, 'block');
      const fullReduction = calculateSelectedReduction(defense, 'full');

      // direct (14) < block (19) < full (24)
      expect(directReduction).toBe(14);
      expect(blockReduction).toBe(19);
      expect(fullReduction).toBe(24);
      expect(directReduction).toBeLessThan(blockReduction);
      expect(blockReduction).toBeLessThan(fullReduction);
    });

    it('should filter keys consistently with calculation', () => {
      const defense = createDefense({
        protection: 5,
        block: 3,
        parry: 4,
        dodge: 2,
        bonus: 1,
      });

      // Verify that filtered keys match the values used in calculation
      const fullKeys = filteredDefenseKeys(defense, 'full');
      const fullSum = fullKeys.reduce((sum, key) => sum + (defense[key] as number), 0);
      expect(fullSum).toBe(calculateSelectedReduction(defense, 'full'));

      const blockKeys = filteredDefenseKeys(defense, 'block');
      const blockSum = blockKeys.reduce((sum, key) => sum + (defense[key] as number), 0);
      expect(blockSum).toBe(calculateSelectedReduction(defense, 'block'));

      const directKeys = filteredDefenseKeys(defense, 'direct');
      const directSum = directKeys.reduce((sum, key) => sum + (defense[key] as number), 0);
      expect(directSum).toBe(calculateSelectedReduction(defense, 'direct'));
    });
  });
});
