import { PathsFrom } from "@/common/global/pathTypes";

export type Offense = 
{
  readonly id: string;
  name: string;
  description?: string;
  leadingWeapon: WeaponOffense;
  secondaryWeapon?: WeaponOffense;
  damageBonus: DamageOffense;
};

export type DamageOffense =
{
  amount: number;
  grade: number;
  bonus: number;
};

export type WeaponOffense = DamageOffense &
{
  critical: Critical;
}

export const pathToOffenseField = <K extends keyof Offense>(index: number, field: K): `offenses.${number}.${K}` => `offenses.${index}.${field}`;
export const leadingOffenseField = (index: number) => pathToOffenseField(index, "leadingWeapon");
export const secondaryOffenseField = (index: number) => pathToOffenseField(index, "secondaryWeapon");
export const damageOffenseField = (index: number) => pathToOffenseField(index, "damageBonus");

export type WeaponOffensePath =`offenses.${number}.${PathsFrom<Offense, WeaponOffense | undefined>}`;
export type DamageOffensePath = Exclude<`offenses.${number}.${PathsFrom<Offense, DamageOffense>}`, WeaponOffensePath>;

export type Critical =
{
  power: number;
  range: number;
}

export function toOffenseString(offense: { amount: number; grade: number; bonus: number }): string
{
  return `${offense.amount}(k${offense.grade * 2}+${offense.bonus})`;
}

export function toCriticalRangeString(weaponOffense: WeaponOffense): string
{
  return `${Math.max(weaponOffense.grade * 2 - weaponOffense.critical.range, 0)}-${weaponOffense.grade * 2}`;
}

export function rollDamage(offense: Offense, targetImmunity: number = 0): number
{
  if (targetImmunity < 0 || targetImmunity > 2) throw new Error("Invalid target immunity");

  const currentDamageOffenseAmount = offense.damageBonus.amount;
  const damageOffenseAmountAfterImmunity = Math.max(currentDamageOffenseAmount - targetImmunity, 0);
  const immunityAfterDecreasingTheDamageOffense = Math.max(0, targetImmunity - currentDamageOffenseAmount);

  const damageOffenseAfterImmunity: DamageOffense = 
  {
    ...offense.damageBonus,
    amount: damageOffenseAmountAfterImmunity,
  };

  const takeOneFromSecondary = offense.secondaryWeapon && immunityAfterDecreasingTheDamageOffense > 0 && offense.secondaryWeapon.amount >= offense.leadingWeapon.amount;
  const immunityAfterDecreasingSecondaryByOne = Math.max(immunityAfterDecreasingTheDamageOffense - (takeOneFromSecondary ? 1 : 0), 0);

  const leadingOffenseAfterImmunity = 
  {
    ...offense.leadingWeapon,
    amount: takeOneFromSecondary ? offense.leadingWeapon.amount : Math.max(offense.leadingWeapon.amount - immunityAfterDecreasingSecondaryByOne, 0),
  };

  const rollForDamageBonus = handleDamageBonusRolls(damageOffenseAfterImmunity);
  const rollForLeadingWeapon = handleWeaponDamageRolls(leadingOffenseAfterImmunity);

  const rollForSecondaryWeapon = !offense.secondaryWeapon 
    ? 0 
    : handleWeaponDamageRolls
    ({
      ...offense.secondaryWeapon,
      amount: takeOneFromSecondary ? Math.max(offense.secondaryWeapon.amount - 1, 0) : offense.secondaryWeapon.amount,
    }).total;

  return rollForLeadingWeapon.total + rollForSecondaryWeapon + rollForDamageBonus.total;
}

export function handleWeaponDamageRolls(offense: WeaponOffense) : { total: number, rolls: [number, boolean][] }
{
  let totalOffenseDamage = 0;
  const rolls: [number, boolean][] = [];

  for (let i = 0; i < offense.amount; i++) 
  {
    const [damageWithoutCritical, criticalDamage] = handleWeaponDamageRoll(offense);
    const weaponDiceDamageWithoutCritical = damageWithoutCritical + offense.bonus;
    rolls.push([damageWithoutCritical, criticalDamage > 0]);
    totalOffenseDamage += (weaponDiceDamageWithoutCritical + criticalDamage);
  }

  return { total: totalOffenseDamage, rolls };
};

export function handleWeaponDamageRoll(offense: WeaponOffense) : [damage: number, critical: number]
{
  const weaponDamageRoll = handleWeaponOffenseRoll(offense);
  const criticalDamage = handleCriticalDamage(offense, weaponDamageRoll);
  return [ weaponDamageRoll, criticalDamage ];
}

export function handleDamageBonusRolls(damageOffense: DamageOffense)
{
  let totalDamageBonus = 0;
  const rolls: number[] = [];

  for (let i = 0; i < damageOffense.amount; i++) 
  {
    const damageBonusRoll = handleDamageOffenseRoll(damageOffense);
    rolls.push(damageBonusRoll);
    totalDamageBonus += damageBonusRoll;
  }

  return { total: totalDamageBonus + damageOffense.bonus, rolls };
}

function handleWeaponOffenseRoll(offense: WeaponOffense): number
{
  return Math.floor(Math.random() * offense.grade * 2) + 1;
}

export function handleDamageOffenseRoll(damageOffense: DamageOffense): number
{
  return Math.floor(Math.random() * damageOffense.grade * 2) + 1;
}

export function handleCriticalDamage(offense: WeaponOffense, roll: number): number
{
  return roll >= (offense.grade * 2 - offense.critical.range) ? offense.critical.power : 0;
}

export const allowedDiceGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const satisfies readonly number[];

export const allowedDiceBonuses = [-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25] as const satisfies readonly number[];

export const allowedDiceAmounts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const satisfies readonly number[];

export const allowedCriticalRanges = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] as const satisfies readonly number[];

export const allowedCriticalPowers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] as const satisfies readonly number[];