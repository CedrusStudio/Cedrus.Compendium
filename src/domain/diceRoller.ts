import { calculateCriticalDamage, roll, type Critical, type DamageOffense, type Offense, type WeaponOffense } from '@/domain/characters/combat/Offense';
import type { PowerOffense } from '@/domain/characters/combat/Power';
import type { RandomSource } from '@/domain/combat-lab/rng/Rng';
import type { Statistic } from '@/domain/characters/statistics/Statistic';

export type DicePool = {
  label: string;
  amount: number;
  grade: number;
  bonus: number;
  bonusScope: 'die' | 'pool';
  critical?: Critical;
  isPhantom?: boolean;
};
export type RollPreset = { label: string; pools: DicePool[]; modifier: number };
export type DicePoolNames = { leading: string; secondary: string; damage: string; additional: string; powerAttack: string; powerDamage: string };
const defaultPoolNames: DicePoolNames = { leading: 'Broń główna', secondary: 'Broń dodatkowa', damage: 'Obrażenia', additional: 'Dodatkowe obrażenia', powerAttack: 'Atak mocy', powerDamage: 'Obrażenia mocy' };
export type DieResult = { value: number; critical: boolean };
export type RollRecord = {
  id: string;
  timestamp: number;
  preset: RollPreset;
  dice: DieResult[][];
  total: number;
  rerolled?: boolean;
};

export const defaultRollPreset = (): RollPreset => ({ label: '', pools: [{ label: '', amount: 1, grade: 3, bonus: 0, bonusScope: 'pool' }], modifier: 0 });

export function validateRollPreset(preset: RollPreset): boolean {
  return Number.isSafeInteger(preset.modifier) && Math.abs(preset.modifier) <= 10000 &&
    preset.pools.length >= 1 && preset.pools.length <= 4 &&
    preset.pools.every(pool => Number.isSafeInteger(pool.amount) && pool.amount >= 0 && pool.amount <= 15 &&
      Number.isSafeInteger(pool.grade) && (pool.grade >= 1 || (pool.grade === 0 && pool.amount === 0)) && pool.grade <= 15 &&
      Number.isSafeInteger(pool.bonus) && Math.abs(pool.bonus) <= 10000);
}

export function calculateRollTotal(preset: RollPreset, dice: DieResult[][]): number {
  return preset.modifier + preset.pools.reduce((sum, pool, poolIndex) => {
    const results = dice[poolIndex] ?? [];
    return sum + results.reduce((diceSum, die) => diceSum + die.value + (pool.bonusScope === 'die' ? pool.bonus : 0) +
      (pool.critical ? calculateCriticalDamage(pool as WeaponOffense, die.value) : 0), 0) + (pool.bonusScope === 'pool' ? pool.bonus : 0);
  }, 0);
}

export function makeRollRecord(preset: RollPreset, dice: DieResult[][], timestamp = Date.now()): RollRecord {
  const snapshot = structuredClone(preset);
  return { id: crypto.randomUUID(), timestamp, preset: snapshot, dice: dice.map(group => group.map(die => ({ ...die }))), total: calculateRollTotal(snapshot, dice) };
}

export function executeRoll(preset: RollPreset, random: RandomSource = Math.random): RollRecord {
  if (!validateRollPreset(preset)) throw new Error('Invalid dice roll');
  const dice = preset.pools.map(pool => Array.from({ length: pool.amount }, () => {
    const value = roll(pool.grade, random);
    return { value, critical: pool.critical ? calculateCriticalDamage(pool as WeaponOffense, value) > 0 : false };
  }));
  return makeRollRecord(preset, dice);
}

export function rerollDie(record: RollRecord, poolIndex: number, dieIndex: number, random: RandomSource = Math.random): RollRecord {
  const pool = record.preset.pools[poolIndex];
  if (!pool || !record.dice[poolIndex]?.[dieIndex]) return record;
  const dice = record.dice.map(group => group.map(die => ({ ...die })));
  const value = roll(pool.grade, random);
  dice[poolIndex][dieIndex] = { value, critical: pool.critical ? calculateCriticalDamage(pool as WeaponOffense, value) > 0 : false };
  return { ...makeRollRecord(record.preset, dice), rerolled: true };
}

export function statisticPreset(label: string, statistic: Statistic, extraBonus = 0): RollPreset {
  return { label, pools: [{ label, amount: 1, grade: statistic.grade, bonus: 0, bonusScope: 'pool' }], modifier: statistic.value + statistic.bonus + statistic.testBonus + extraBonus };
}

function damagePool(label: string, damage: DamageOffense): DicePool {
  return { label, amount: damage.amount, grade: damage.grade, bonus: damage.bonus, bonusScope: 'pool', isPhantom: damage.isPhantom };
}
function weaponPool(label: string, weapon: WeaponOffense): DicePool {
  return { ...damagePool(label, weapon), bonusScope: 'die', critical: { ...weapon.critical } };
}
export function offensePreset(offense: Offense, names: DicePoolNames = defaultPoolNames): RollPreset {
  return { label: offense.name, modifier: 0, pools: [
    weaponPool(names.leading, offense.leadingWeapon),
    ...(offense.secondaryWeapon ? [weaponPool(names.secondary, offense.secondaryWeapon)] : []),
    damagePool(names.damage, offense.damageBonus),
    ...(offense.additionalDamageBonus ? [damagePool(names.additional, offense.additionalDamageBonus)] : []),
  ] };
}
export function powerPreset(label: string, offense: PowerOffense, names: DicePoolNames = defaultPoolNames): RollPreset {
  return { label, modifier: 0, pools: [weaponPool(names.powerAttack, offense.spellOffense), damagePool(names.powerDamage, offense.spellDamage)] };
}
