import { describe, expect, it } from 'vitest';
import { executeRoll, formatRollPreset, offensePreset, rerollDie, statisticPreset, validateRollPreset, type RollPreset } from '@/domain/diceRoller';
import type { Offense } from '@/domain/characters/combat/Offense';

describe('dice roller', () => {
  it('rolls 2k6 plus one pool modifier and can reroll one die', () => {
    const preset: RollPreset = { label: '', modifier: 3, pools: [{ label: '', amount: 2, grade: 3, bonus: 0, bonusScope: 'pool' }] };
    const sequence = [0, 0.999];
    const first = executeRoll(preset, () => sequence.shift()!);
    expect(first.dice[0].map(die => die.value)).toEqual([1, 6]);
    expect(first.total).toBe(10);
    const second = rerollDie(first, 0, 0, () => 0.5);
    expect(second.dice[0].map(die => die.value)).toEqual([4, 6]);
    expect(second.total).toBe(13);
    expect(first.total).toBe(10);
  });

  it('combines two groups with a per-die bonus and a modifier for the whole roll', () => {
    const preset: RollPreset = { label: '', modifier: 3, pools: [
      { label: '', amount: 4, grade: 3, bonus: 1, bonusScope: 'die' },
      { label: '', amount: 2, grade: 2, bonus: 2, bonusScope: 'die' },
    ] };
    expect(formatRollPreset(preset)).toBe('4(k6+1) + 2(k4+2) + 3');
    const result = executeRoll(preset, () => 0);
    expect(result.dice.map(group => group.map(die => die.value))).toEqual([[1, 1, 1, 1], [1, 1]]);
    expect(result.total).toBe(17);
    expect(rerollDie(result, 1, 0, () => 0.999).total).toBe(20);
  });

  it('uses existing offense rules: bonus per weapon die, pool bonus once, critical per die', () => {
    const offense: Offense = {
      id: 'test', name: 'Sword', leadingWeapon: { amount: 2, grade: 3, bonus: 2, isPhantom: false, critical: { range: 1, power: 4 } },
      damageBonus: { amount: 1, grade: 2, bonus: 3, isPhantom: false },
    };
    const sequence = [0, 0.999, 0.5];
    const result = executeRoll(offensePreset(offense), () => sequence.shift()!);
    expect(result.dice.map(group => group.map(die => die.value))).toEqual([[1, 6], [3]]);
    expect(result.dice[0][1].critical).toBe(true);
    expect(result.total).toBe(21); // (1+2) + (6+2+4) + (3+3)
  });

  it('retains a flat bonus when its pool has zero dice', () => {
    const preset: RollPreset = { label: '', modifier: 0, pools: [{ label: '', amount: 0, grade: 3, bonus: 5, bonusScope: 'pool' }] };
    expect(executeRoll(preset, () => 0).total).toBe(5);
  });

  it('makes a statistic preset using grade and all modifiers', () => {
    const preset = statisticPreset('Reflex', { grade: 3, value: 4, bonus: 1, testBonus: 2 }, -1);
    expect(executeRoll(preset, () => 0).total).toBe(7);
  });

  it('rejects invalid amounts and ranks before generating a roll', () => {
    const preset: RollPreset = { label: '', modifier: 0, pools: [{ label: '', amount: 16, grade: 3, bonus: 0, bonusScope: 'pool' }] };
    expect(validateRollPreset(preset)).toBe(false);
    expect(() => executeRoll(preset, () => 0)).toThrow();
  });
});
