import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePowerRolls } from '../usePowerRolls';
import * as OffenseModule from '@/domain/characters/combat/Offense';
import type { PowerOffense, SpellOffense, SpellDamage } from '@/domain/characters/combat/Power';

// Mock the domain functions
vi.mock('@/domain/characters/combat/Offense', async () => {
  const actual = await vi.importActual('@/domain/characters/combat/Offense');
  return {
    ...actual,
    roll: vi.fn(),
    calculateWeaponDamageRoll: vi.fn(),
    handleWeaponDamageRolls: vi.fn(),
    handleDamageOffenseRolls: vi.fn(),
    calculateCriticalDamage: vi.fn(),
  };
});

describe('usePowerRolls', () => {
  // Test data factories
  const createSpellOffense = (overrides?: Partial<SpellOffense>): SpellOffense => ({
    amount: 2,
    grade: 6,
    bonus: 4,
    isPhantom: false,
    critical: { power: 8, range: 3 },
    ...overrides,
  });

  const createSpellDamage = (overrides?: Partial<SpellDamage>): SpellDamage => ({
    amount: 1,
    grade: 4,
    bonus: 3,
    isPhantom: false,
    ...overrides,
  });

  const createPowerOffense = (overrides?: Partial<PowerOffense>): PowerOffense => ({
    spellOffense: createSpellOffense(),
    spellDamage: createSpellDamage(),
    description: 'Test Power Offense',
    cost: 15,
    ...overrides,
  });

  const mockPowerOffenses: PowerOffense[] = [
    createPowerOffense(),
    createPowerOffense({
      spellOffense: createSpellOffense({ bonus: 6, grade: 8 }),
      spellDamage: createSpellDamage({ bonus: 5, grade: 5 }),
      description: 'Second Power Offense',
      cost: 20,
    }),
    createPowerOffense({
      spellOffense: createSpellOffense({ bonus: 2, grade: 3 }),
      spellDamage: createSpellDamage({ bonus: 1, grade: 2 }),
      description: 'Third Power Offense',
      cost: 10,
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with offense at selectedIndex', () => {
      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      expect(result.current.currentSpellOffense).toEqual(mockPowerOffenses[0].spellOffense);
      expect(result.current.currentSpellDamage).toEqual(mockPowerOffenses[0].spellDamage);
    });

    it('should initialize with different selectedIndex', () => {
      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 1));

      expect(result.current.currentSpellOffense).toEqual(mockPowerOffenses[1].spellOffense);
      expect(result.current.currentSpellDamage).toEqual(mockPowerOffenses[1].spellDamage);
    });

    it('should initialize with empty roll arrays', () => {
      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      expect(result.current.spellOffenseRolls).toEqual([]);
      expect(result.current.spellDamageRolls).toEqual([]);
    });

    it('should return 0 for totalResult when no rolls have been made', () => {
      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      expect(result.current.totalResult()).toBe(0);
    });

    it('should handle last index correctly', () => {
      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 2));

      expect(result.current.currentSpellOffense).toEqual(mockPowerOffenses[2].spellOffense);
      expect(result.current.currentSpellDamage).toEqual(mockPowerOffenses[2].spellDamage);
    });
  });

  describe('handleRoll()', () => {
    it('should call domain functions to generate rolls', () => {
      const mockSpellOffenseRolls: [number, boolean][] = [[10, true], [7, false]];
      const mockSpellDamageRolls: number[] = [5, 6];

      vi.mocked(OffenseModule.handleWeaponDamageRolls).mockReturnValue({
        total: 0,
        rolls: mockSpellOffenseRolls,
      });

      vi.mocked(OffenseModule.handleDamageOffenseRolls).mockReturnValue({
        total: 0,
        rolls: mockSpellDamageRolls,
      });

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.handleRoll();
      });

      expect(OffenseModule.handleWeaponDamageRolls).toHaveBeenCalledWith(mockPowerOffenses[0].spellOffense);
      expect(OffenseModule.handleDamageOffenseRolls).toHaveBeenCalledWith(mockPowerOffenses[0].spellDamage);
    });

    it('should update spell offense and damage roll states', () => {
      const mockSpellOffenseRolls: [number, boolean][] = [[12, true], [8, false], [6, false]];
      const mockSpellDamageRolls: number[] = [4, 5];

      vi.mocked(OffenseModule.handleWeaponDamageRolls).mockReturnValue({
        total: 0,
        rolls: mockSpellOffenseRolls,
      });

      vi.mocked(OffenseModule.handleDamageOffenseRolls).mockReturnValue({
        total: 0,
        rolls: mockSpellDamageRolls,
      });

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.handleRoll();
      });

      expect(result.current.spellOffenseRolls).toEqual(mockSpellOffenseRolls);
      expect(result.current.spellDamageRolls).toEqual(mockSpellDamageRolls);
    });

    it('should generate new rolls on each call', () => {
      const firstOffenseRolls: [number, boolean][] = [[6, false]];
      const secondOffenseRolls: [number, boolean][] = [[11, true]];
      const firstDamageRolls: number[] = [3];
      const secondDamageRolls: number[] = [7];

      vi.mocked(OffenseModule.handleWeaponDamageRolls)
        .mockReturnValueOnce({ total: 0, rolls: firstOffenseRolls })
        .mockReturnValueOnce({ total: 0, rolls: secondOffenseRolls });

      vi.mocked(OffenseModule.handleDamageOffenseRolls)
        .mockReturnValueOnce({ total: 0, rolls: firstDamageRolls })
        .mockReturnValueOnce({ total: 0, rolls: secondDamageRolls });

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.handleRoll();
      });

      expect(result.current.spellOffenseRolls).toEqual(firstOffenseRolls);
      expect(result.current.spellDamageRolls).toEqual(firstDamageRolls);

      act(() => {
        result.current.handleRoll();
      });

      expect(result.current.spellOffenseRolls).toEqual(secondOffenseRolls);
      expect(result.current.spellDamageRolls).toEqual(secondDamageRolls);
    });

    it('should handle empty rolls from domain functions', () => {
      vi.mocked(OffenseModule.handleWeaponDamageRolls).mockReturnValue({
        total: 0,
        rolls: [],
      });

      vi.mocked(OffenseModule.handleDamageOffenseRolls).mockReturnValue({
        total: 0,
        rolls: [],
      });

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.handleRoll();
      });

      expect(result.current.spellOffenseRolls).toEqual([]);
      expect(result.current.spellDamageRolls).toEqual([]);
    });

    it('should use current spell offense and damage states', () => {
      const customSpellOffense = createSpellOffense({ grade: 10 });
      const customSpellDamage = createSpellDamage({ grade: 8 });

      vi.mocked(OffenseModule.handleWeaponDamageRolls).mockReturnValue({
        total: 0,
        rolls: [[15, true]],
      });

      vi.mocked(OffenseModule.handleDamageOffenseRolls).mockReturnValue({
        total: 0,
        rolls: [12],
      });

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setCurrentSpellOffense(customSpellOffense);
        result.current.setCurrentSpellDamage(customSpellDamage);
      });

      act(() => {
        result.current.handleRoll();
      });

      expect(OffenseModule.handleWeaponDamageRolls).toHaveBeenCalledWith(customSpellOffense);
      expect(OffenseModule.handleDamageOffenseRolls).toHaveBeenCalledWith(customSpellDamage);
    });
  });

  describe('handleSpellOffenseReroll()', () => {
    it('should reroll specific spell offense dice at given index', () => {
      // calculateWeaponDamageRoll returns [damage, criticalDamageValue]
      vi.mocked(OffenseModule.calculateWeaponDamageRoll).mockReturnValue([11, 7]);
      // Mock calculateCriticalDamage for the side effect that recalculates all criticals
      vi.mocked(OffenseModule.calculateCriticalDamage).mockImplementation((offense, roll) => {
        // The side effect recalculates critical for all rolls
        if (roll === 11) return 7;  // New roll is critical
        if (roll === 9) return 5;   // Existing roll that was already critical
        return 0;                    // Other rolls are not critical
      });

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[6, false], [8, false], [9, true]]);
      });

      act(() => {
        result.current.handleSpellOffenseReroll(1, mockPowerOffenses[0].spellOffense, result.current.setSpellOffenseRolls);
      });

      expect(OffenseModule.calculateWeaponDamageRoll).toHaveBeenCalledWith(mockPowerOffenses[0].spellOffense);
      expect(result.current.spellOffenseRolls[1]).toEqual([11, true]); // critical > 0
      expect(result.current.spellOffenseRolls[0]).toEqual([6, false]); // unchanged
      expect(result.current.spellOffenseRolls[2]).toEqual([9, true]); // unchanged
    });

    it('should mark as critical when calculateWeaponDamageRoll returns critical > 0', () => {
      // calculateWeaponDamageRoll returns [12, 10] where 10 is critical damage
      vi.mocked(OffenseModule.calculateWeaponDamageRoll).mockReturnValue([12, 10]);
      // Mock calculateCriticalDamage for the side effect
      vi.mocked(OffenseModule.calculateCriticalDamage).mockImplementation((offense, roll) => {
        return roll === 12 ? 10 : 0;
      });

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[5, false]]);
      });

      act(() => {
        result.current.handleSpellOffenseReroll(0, mockPowerOffenses[0].spellOffense, result.current.setSpellOffenseRolls);
      });

      expect(result.current.spellOffenseRolls[0]).toEqual([12, true]);
    });

    it('should mark as non-critical when calculateWeaponDamageRoll returns 0 critical', () => {
      vi.mocked(OffenseModule.calculateWeaponDamageRoll).mockReturnValue([6, 0]);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[11, true]]);
      });

      act(() => {
        result.current.handleSpellOffenseReroll(0, mockPowerOffenses[0].spellOffense, result.current.setSpellOffenseRolls);
      });

      expect(result.current.spellOffenseRolls[0]).toEqual([6, false]);
    });

    it('should only update the specified index', () => {
      // calculateWeaponDamageRoll returns [9, 4] where 4 is critical damage
      vi.mocked(OffenseModule.calculateWeaponDamageRoll).mockReturnValue([9, 4]);
      // Mock calculateCriticalDamage for the side effect
      vi.mocked(OffenseModule.calculateCriticalDamage).mockImplementation((offense, roll) => {
        if (roll === 9) return 4;   // New roll is critical
        if (roll === 8) return 5;   // Existing roll that was already critical
        return 0;
      });

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[5, false], [7, false], [8, true], [6, false]]);
      });

      act(() => {
        result.current.handleSpellOffenseReroll(2, mockPowerOffenses[0].spellOffense, result.current.setSpellOffenseRolls);
      });

      expect(result.current.spellOffenseRolls).toEqual([
        [5, false],
        [7, false],
        [9, true], // changed
        [6, false],
      ]);
    });

    it('should not affect spell damage rolls', () => {
      vi.mocked(OffenseModule.calculateWeaponDamageRoll).mockReturnValue([10, 5]);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[7, false]]);
        result.current.setSpellDamageRolls([4, 5]);
      });

      act(() => {
        result.current.handleSpellOffenseReroll(0, mockPowerOffenses[0].spellOffense, result.current.setSpellOffenseRolls);
      });

      expect(result.current.spellDamageRolls).toEqual([4, 5]);
    });

    it('should work with different spell offenses', () => {
      const customSpellOffense = createSpellOffense({ grade: 10, bonus: 8 });
      // calculateWeaponDamageRoll returns [18, 12] where 12 is critical damage
      vi.mocked(OffenseModule.calculateWeaponDamageRoll).mockReturnValue([18, 12]);
      // Mock calculateCriticalDamage for the side effect
      vi.mocked(OffenseModule.calculateCriticalDamage).mockImplementation((offense, roll) => {
        return roll === 18 ? 12 : 0;
      });

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[9, false]]);
      });

      act(() => {
        result.current.handleSpellOffenseReroll(0, customSpellOffense, result.current.setSpellOffenseRolls);
      });

      expect(OffenseModule.calculateWeaponDamageRoll).toHaveBeenCalledWith(customSpellOffense);
      expect(result.current.spellOffenseRolls[0]).toEqual([18, true]);
    });
  });

  describe('handleSpellDamageReroll()', () => {
    it('should reroll specific spell damage dice at given index', () => {
      vi.mocked(OffenseModule.roll).mockReturnValue(7);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellDamageRolls([3, 4, 5]);
      });

      act(() => {
        result.current.handleSpellDamageReroll(1, mockPowerOffenses[0].spellDamage, result.current.setSpellDamageRolls);
      });

      expect(OffenseModule.roll).toHaveBeenCalledWith(mockPowerOffenses[0].spellDamage.grade);
      expect(result.current.spellDamageRolls).toEqual([3, 7, 5]);
    });

    it('should only update the specified index', () => {
      vi.mocked(OffenseModule.roll).mockReturnValue(8);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellDamageRolls([2, 3, 4, 5]);
      });

      act(() => {
        result.current.handleSpellDamageReroll(0, mockPowerOffenses[0].spellDamage, result.current.setSpellDamageRolls);
      });

      expect(result.current.spellDamageRolls).toEqual([8, 3, 4, 5]);
    });

    it('should use correct dice grade from spell damage', () => {
      const customSpellDamage = createSpellDamage({ grade: 12 });
      vi.mocked(OffenseModule.roll).mockReturnValue(20);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellDamageRolls([6]);
      });

      act(() => {
        result.current.handleSpellDamageReroll(0, customSpellDamage, result.current.setSpellDamageRolls);
      });

      expect(OffenseModule.roll).toHaveBeenCalledWith(12);
    });

    it('should not affect spell offense rolls', () => {
      vi.mocked(OffenseModule.roll).mockReturnValue(9);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[8, true]]);
        result.current.setSpellDamageRolls([5]);
      });

      act(() => {
        result.current.handleSpellDamageReroll(0, mockPowerOffenses[0].spellDamage, result.current.setSpellDamageRolls);
      });

      expect(result.current.spellOffenseRolls).toEqual([[8, true]]);
    });

    it('should handle rerolling last index', () => {
      vi.mocked(OffenseModule.roll).mockReturnValue(10);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellDamageRolls([3, 4, 5, 6]);
      });

      act(() => {
        result.current.handleSpellDamageReroll(3, mockPowerOffenses[0].spellDamage, result.current.setSpellDamageRolls);
      });

      expect(result.current.spellDamageRolls).toEqual([3, 4, 5, 10]);
    });
  });

  describe('State Updates and Side Effects', () => {
    it('should recalculate critical status when spell offense is updated', () => {
      vi.mocked(OffenseModule.calculateCriticalDamage)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(8)
        .mockReturnValueOnce(5);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[7, false], [10, false], [9, false]]);
      });

      const newSpellOffense = createSpellOffense({ critical: { power: 12, range: 4 } });

      act(() => {
        result.current.setCurrentSpellOffense(newSpellOffense);
      });

      expect(OffenseModule.calculateCriticalDamage).toHaveBeenCalledWith(newSpellOffense, 7);
      expect(OffenseModule.calculateCriticalDamage).toHaveBeenCalledWith(newSpellOffense, 10);
      expect(OffenseModule.calculateCriticalDamage).toHaveBeenCalledWith(newSpellOffense, 9);
    });

    it('should not recalculate criticals when no spell offense rolls exist', () => {
      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      const newSpellOffense = createSpellOffense();

      act(() => {
        result.current.setCurrentSpellOffense(newSpellOffense);
      });

      expect(OffenseModule.calculateCriticalDamage).not.toHaveBeenCalled();
    });

    it('should update critical flags correctly based on calculateCriticalDamage', () => {
      vi.mocked(OffenseModule.calculateCriticalDamage)
        .mockReturnValueOnce(6) // first roll becomes critical
        .mockReturnValueOnce(0); // second roll stays non-critical

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[8, false], [5, false]]);
      });

      const newSpellOffense = createSpellOffense();

      act(() => {
        result.current.setCurrentSpellOffense(newSpellOffense);
      });

      expect(result.current.spellOffenseRolls).toEqual([[8, true], [5, false]]);
    });

    it('should allow updating spell damage without side effects', () => {
      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      const newSpellDamage = createSpellDamage({ grade: 10, bonus: 8 });

      act(() => {
        result.current.setCurrentSpellDamage(newSpellDamage);
      });

      expect(result.current.currentSpellDamage).toEqual(newSpellDamage);
      // No domain functions should be called for this setter
      expect(OffenseModule.calculateCriticalDamage).not.toHaveBeenCalled();
    });
  });

  describe('Offense Index Change (useEffect)', () => {
    it('should reset state when selectedIndex changes', () => {
      const { result, rerender } = renderHook(
        ({ offenses, index }) => usePowerRolls(offenses, index),
        {
          initialProps: { offenses: mockPowerOffenses, index: 0 },
        }
      );

      act(() => {
        result.current.setSpellOffenseRolls([[8, true], [7, false]]);
        result.current.setSpellDamageRolls([5, 6]);
      });

      expect(result.current.spellOffenseRolls).toEqual([[8, true], [7, false]]);
      expect(result.current.spellDamageRolls).toEqual([5, 6]);

      // Change selected index
      rerender({ offenses: mockPowerOffenses, index: 1 });

      expect(result.current.currentSpellOffense).toEqual(mockPowerOffenses[1].spellOffense);
      expect(result.current.currentSpellDamage).toEqual(mockPowerOffenses[1].spellDamage);
      expect(result.current.spellOffenseRolls).toEqual([]);
      expect(result.current.spellDamageRolls).toEqual([]);
    });

    it('should not reset state when selectedIndex stays the same', () => {
      const { result, rerender } = renderHook(
        ({ offenses, index }) => usePowerRolls(offenses, index),
        {
          initialProps: { offenses: mockPowerOffenses, index: 0 },
        }
      );

      act(() => {
        result.current.setSpellOffenseRolls([[9, true]]);
        result.current.setSpellDamageRolls([6]);
      });

      // Rerender with same index
      rerender({ offenses: mockPowerOffenses, index: 0 });

      expect(result.current.spellOffenseRolls).toEqual([[9, true]]);
      expect(result.current.spellDamageRolls).toEqual([6]);
    });

    it('should update to new offense when offenses array changes', () => {
      const newPowerOffenses = [
        createPowerOffense({
          spellOffense: createSpellOffense({ grade: 12, bonus: 10 }),
          spellDamage: createSpellDamage({ grade: 8, bonus: 6 }),
        }),
      ];

      const { result, rerender } = renderHook(
        ({ offenses, index }) => usePowerRolls(offenses, index),
        {
          initialProps: { offenses: mockPowerOffenses, index: 0 },
        }
      );

      // Change offenses array
      rerender({ offenses: newPowerOffenses, index: 0 });

      expect(result.current.currentSpellOffense).toEqual(newPowerOffenses[0].spellOffense);
      expect(result.current.currentSpellDamage).toEqual(newPowerOffenses[0].spellDamage);
    });

    it('should reset rolls when moving from index 0 to index 2', () => {
      const { result, rerender } = renderHook(
        ({ offenses, index }) => usePowerRolls(offenses, index),
        {
          initialProps: { offenses: mockPowerOffenses, index: 0 },
        }
      );

      act(() => {
        result.current.setSpellOffenseRolls([[10, true]]);
        result.current.setSpellDamageRolls([7]);
      });

      rerender({ offenses: mockPowerOffenses, index: 2 });

      expect(result.current.currentSpellOffense).toEqual(mockPowerOffenses[2].spellOffense);
      expect(result.current.currentSpellDamage).toEqual(mockPowerOffenses[2].spellDamage);
      expect(result.current.spellOffenseRolls).toEqual([]);
      expect(result.current.spellDamageRolls).toEqual([]);
    });

    it('should clear rolls even with custom current states', () => {
      const customSpellOffense = createSpellOffense({ grade: 15 });
      const customSpellDamage = createSpellDamage({ grade: 12 });

      const { result, rerender } = renderHook(
        ({ offenses, index }) => usePowerRolls(offenses, index),
        {
          initialProps: { offenses: mockPowerOffenses, index: 0 },
        }
      );

      act(() => {
        result.current.setCurrentSpellOffense(customSpellOffense);
        result.current.setCurrentSpellDamage(customSpellDamage);
        result.current.setSpellOffenseRolls([[11, true]]);
        result.current.setSpellDamageRolls([8]);
      });

      rerender({ offenses: mockPowerOffenses, index: 1 });

      // Should reset to offense from array, not custom states
      expect(result.current.currentSpellOffense).toEqual(mockPowerOffenses[1].spellOffense);
      expect(result.current.currentSpellDamage).toEqual(mockPowerOffenses[1].spellDamage);
      expect(result.current.spellOffenseRolls).toEqual([]);
      expect(result.current.spellDamageRolls).toEqual([]);
    });
  });

  describe('Total Damage Calculation', () => {
    beforeEach(() => {
      vi.mocked(OffenseModule.calculateCriticalDamage).mockReturnValue(0);
    });

    it('should return 0 when no rolls have been made', () => {
      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      expect(result.current.totalResult()).toBe(0);
    });

    it('should calculate total damage from spell offense and spell damage', () => {
      // Mock calculateCriticalDamage to return 0 for all rolls
      vi.mocked(OffenseModule.calculateCriticalDamage).mockReturnValue(0);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        // Spell offense: [8, 10] with bonus 5 each + 0 critical = (8+5+0) + (10+5+0) = 28
        result.current.setSpellOffenseRolls([[8, false], [10, false]]);
        result.current.setCurrentSpellOffense(createSpellOffense({ bonus: 5 }));

        // Spell damage: [6, 7] with bonus 3 = 6 + 7 + 3 = 16
        result.current.setSpellDamageRolls([6, 7]);
        result.current.setCurrentSpellDamage(createSpellDamage({ bonus: 3 }));
      });

      // Total: 28 + 16 = 44
      expect(result.current.totalResult()).toBe(44);
    });

    it('should include critical damage in calculation', () => {
      // Mock calculateCriticalDamage to be called during totalResult calculation
      vi.mocked(OffenseModule.calculateCriticalDamage).mockImplementation((offense, roll) => {
        // First roll (12) is critical with damage 8
        if (roll === 12) return 8;
        // Second roll (7) is not critical
        return 0;
      });

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        // Spell offense: [12, 7] with bonus 3
        // Roll 12: 12 + 3 + 8 (critical) = 23
        // Roll 7: 7 + 3 + 0 (no critical) = 10
        // Spell offense total: 23 + 10 = 33
        // SpellDamage: 0 rolls + bonus 3 = 3
        // Total: 33 + 3 = 36
        result.current.setSpellOffenseRolls([[12, true], [7, false]]);
        result.current.setCurrentSpellOffense(createSpellOffense({ bonus: 3, critical: { power: 8, range: 3 } }));
      });

      expect(result.current.totalResult()).toBe(36);
    });

    it('should calculate with only spell offense rolls', () => {
      // Mock calculateCriticalDamage to return 0 (no critical)
      vi.mocked(OffenseModule.calculateCriticalDamage).mockReturnValue(0);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[9, false]]);
        result.current.setCurrentSpellOffense(createSpellOffense({ bonus: 4 }));
      });

      // Roll 9: 9 + 4 + 0 (no critical) = 13, plus spellDamage bonus 3 = 16
      expect(result.current.totalResult()).toBe(16);
    });

    it('should calculate with only spell damage rolls', () => {
      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellDamageRolls([5, 6]);
        result.current.setCurrentSpellDamage(createSpellDamage({ bonus: 2 }));
      });

      // 5 + 6 + 2 = 13
      expect(result.current.totalResult()).toBe(13);
    });

    it('should handle multiple spell offense dice', () => {
      // Mock calculateCriticalDamage to return 0 for all rolls (no criticals)
      vi.mocked(OffenseModule.calculateCriticalDamage).mockReturnValue(0);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[6, false], [7, false], [8, false], [9, false]]);
        result.current.setCurrentSpellOffense(createSpellOffense({ bonus: 2 }));
      });

      // Spell offense: (6+2+0) + (7+2+0) + (8+2+0) + (9+2+0) = 38
      // SpellDamage: 0 rolls + bonus 3 = 3
      // Total: 38 + 3 = 41
      expect(result.current.totalResult()).toBe(41);
    });

    it('should handle multiple spell damage dice', () => {
      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellDamageRolls([3, 4, 5, 6, 7]);
        result.current.setCurrentSpellDamage(createSpellDamage({ bonus: 10 }));
      });

      // 3 + 4 + 5 + 6 + 7 + 10 = 35
      expect(result.current.totalResult()).toBe(35);
    });

    it('should update total when rolls change', () => {
      // Mock calculateCriticalDamage to return 0 (no criticals)
      vi.mocked(OffenseModule.calculateCriticalDamage).mockReturnValue(0);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[7, false]]);
        result.current.setCurrentSpellOffense(createSpellOffense({ bonus: 3 }));
      });

      // 7 + 3 + 0 (crit) = 10, plus spellDamage bonus 3 = 13
      expect(result.current.totalResult()).toBe(13);

      act(() => {
        result.current.setSpellOffenseRolls([[7, false], [9, false]]);
      });

      // (7+3) + (9+3) = 22, plus spellDamage bonus 3 = 25
      expect(result.current.totalResult()).toBe(25);
    });

    it('should handle zero bonus values', () => {
      // Mock calculateCriticalDamage to return 0
      vi.mocked(OffenseModule.calculateCriticalDamage).mockReturnValue(0);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[8, false]]);
        result.current.setCurrentSpellOffense(createSpellOffense({ bonus: 0 }));
        result.current.setSpellDamageRolls([5]);
        result.current.setCurrentSpellDamage(createSpellDamage({ bonus: 0 }));
      });

      // Offense: 8 + 0 + 0 = 8, Damage: 5 + 0 = 5, Total: 13
      expect(result.current.totalResult()).toBe(13);
    });

    it('should handle negative bonus values', () => {
      // Mock calculateCriticalDamage to return 0
      vi.mocked(OffenseModule.calculateCriticalDamage).mockReturnValue(0);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[10, false]]);
        result.current.setCurrentSpellOffense(createSpellOffense({ bonus: -3 }));
        result.current.setSpellDamageRolls([8]);
        result.current.setCurrentSpellDamage(createSpellDamage({ bonus: -2 }));
      });

      // Offense: 10 + (-3) + 0 = 7, Damage: 8 + (-2) = 6, Total: 13
      expect(result.current.totalResult()).toBe(13);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single offense in array', () => {
      const singleOffense = [createPowerOffense()];

      const { result } = renderHook(() => usePowerRolls(singleOffense, 0));

      expect(result.current.currentSpellOffense).toEqual(singleOffense[0].spellOffense);
      expect(result.current.currentSpellDamage).toEqual(singleOffense[0].spellDamage);
    });

    it('should handle very large bonus values', () => {
      // Mock calculateCriticalDamage to return 0
      vi.mocked(OffenseModule.calculateCriticalDamage).mockReturnValue(0);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[5, false]]);
        result.current.setCurrentSpellOffense(createSpellOffense({ bonus: 100 }));
        result.current.setSpellDamageRolls([3]);
        result.current.setCurrentSpellDamage(createSpellDamage({ bonus: 50 }));
      });

      // Offense: 5 + 100 + 0 = 105, Damage: 3 + 50 = 53, Total: 158
      expect(result.current.totalResult()).toBe(158);
    });

    it('should handle reroll at index 0', () => {
      // calculateWeaponDamageRoll returns [12, 7] where 7 is critical damage
      vi.mocked(OffenseModule.calculateWeaponDamageRoll).mockReturnValue([12, 7]);
      // Mock calculateCriticalDamage to return 7 (critical hit)
      vi.mocked(OffenseModule.calculateCriticalDamage).mockReturnValue(7);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[5, false]]);
      });

      act(() => {
        result.current.handleSpellOffenseReroll(0, mockPowerOffenses[0].spellOffense, result.current.setSpellOffenseRolls);
      });

      // calculateWeaponDamageRoll returns [12, 7], so critical > 0 = true
      expect(result.current.spellOffenseRolls[0]).toEqual([12, true]);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete roll and reroll workflow', () => {
      // handleWeaponDamageRolls returns rolls with boolean flags already set
      vi.mocked(OffenseModule.handleWeaponDamageRolls).mockReturnValue({
        total: 0,
        rolls: [[9, true], [6, false]],
      });

      vi.mocked(OffenseModule.handleDamageOffenseRolls).mockReturnValue({
        total: 0,
        rolls: [5],
      });

      vi.mocked(OffenseModule.calculateCriticalDamage).mockImplementation((offense, roll) => {
        return roll >= 9 ? 6 : 0;
      });

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      // Initial roll
      act(() => {
        result.current.handleRoll();
      });

      expect(result.current.spellOffenseRolls.length).toBe(2);
      expect(result.current.spellDamageRolls.length).toBe(1);

      // Reroll spell offense - calculateWeaponDamageRoll returns [11, 8] where 8 is critical damage
      vi.mocked(OffenseModule.calculateWeaponDamageRoll).mockReturnValue([11, 8]);

      act(() => {
        result.current.handleSpellOffenseReroll(1, result.current.currentSpellOffense, result.current.setSpellOffenseRolls);
      });

      expect(result.current.spellOffenseRolls[1][0]).toBe(11);

      // Reroll spell damage
      vi.mocked(OffenseModule.roll).mockReturnValue(7);

      act(() => {
        result.current.handleSpellDamageReroll(0, result.current.currentSpellDamage, result.current.setSpellDamageRolls);
      });

      expect(result.current.spellDamageRolls[0]).toBe(7);

      // Calculate total
      const total = result.current.totalResult();
      expect(total).toBeGreaterThan(0);
    });

    it('should handle offense switching workflow', () => {
      // Mock calculateCriticalDamage for the total calculation
      vi.mocked(OffenseModule.calculateCriticalDamage).mockReturnValue(5);

      const { result, rerender } = renderHook(
        ({ offenses, index }) => usePowerRolls(offenses, index),
        {
          initialProps: { offenses: mockPowerOffenses, index: 0 },
        }
      );

      // Make rolls on first offense
      act(() => {
        result.current.setSpellOffenseRolls([[9, true]]);
        result.current.setSpellDamageRolls([6]);
      });

      expect(result.current.totalResult()).toBeGreaterThan(0);

      // Switch to second offense
      rerender({ offenses: mockPowerOffenses, index: 1 });

      // Rolls should be cleared
      expect(result.current.spellOffenseRolls).toEqual([]);
      expect(result.current.spellDamageRolls).toEqual([]);
      expect(result.current.totalResult()).toBe(0);

      // Make rolls on second offense
      act(() => {
        result.current.setSpellOffenseRolls([[12, true]]);
        result.current.setSpellDamageRolls([8]);
      });

      expect(result.current.totalResult()).toBeGreaterThan(0);
    });

    it('should handle multiple state updates in sequence', () => {
      // Mock calculateCriticalDamage to return 0 (no criticals)
      vi.mocked(OffenseModule.calculateCriticalDamage).mockReturnValue(0);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setCurrentSpellOffense(createSpellOffense({ bonus: 10 }));
      });

      act(() => {
        result.current.setCurrentSpellDamage(createSpellDamage({ bonus: 5 }));
      });

      act(() => {
        result.current.setSpellOffenseRolls([[8, false], [9, false]]);
      });

      act(() => {
        result.current.setSpellDamageRolls([6, 7]);
      });

      // (8+10) + (9+10) + 6 + 7 + 5 = 55
      expect(result.current.totalResult()).toBe(55);
    });

    it('should maintain state consistency across multiple operations', () => {
      vi.mocked(OffenseModule.calculateWeaponDamageRoll).mockReturnValue([10, 5]);
      vi.mocked(OffenseModule.roll).mockReturnValue(8);
      vi.mocked(OffenseModule.calculateCriticalDamage).mockReturnValue(0);

      const { result } = renderHook(() => usePowerRolls(mockPowerOffenses, 0));

      act(() => {
        result.current.setSpellOffenseRolls([[7, false], [8, false]]);
        result.current.setSpellDamageRolls([5]);
        result.current.setCurrentSpellOffense(createSpellOffense({ bonus: 3 }));
        result.current.setCurrentSpellDamage(createSpellDamage({ bonus: 2 }));
      });

      const firstTotal = result.current.totalResult();

      act(() => {
        result.current.handleSpellOffenseReroll(0, result.current.currentSpellOffense, result.current.setSpellOffenseRolls);
      });

      const secondTotal = result.current.totalResult();
      expect(secondTotal).not.toBe(firstTotal);

      act(() => {
        result.current.handleSpellDamageReroll(0, result.current.currentSpellDamage, result.current.setSpellDamageRolls);
      });

      const thirdTotal = result.current.totalResult();
      expect(thirdTotal).not.toBe(secondTotal);
    });
  });
});
