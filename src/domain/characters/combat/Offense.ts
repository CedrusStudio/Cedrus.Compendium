import { PathsFrom } from "@/common/global/pathTypes";
import { defaultDiceGrade } from "@/domain/diceDefaults";
import { ulid } from "ulid";
import { Entity } from "@/domain/Entity";

export type Offense = Entity &
{
  description?: string;
  leadingWeapon: WeaponOffense;
  secondaryWeapon?: WeaponOffense;
  damageBonus: DamageOffense;
  additionalDamageBonus?: DamageOffense;
};

export type DamageOffense =
{
  amount: number;
  grade: number;
  bonus: number;
  isPhantom: boolean;
};

export type WeaponOffense = DamageOffense &
{
  critical: Critical;
}

export const pathToOffenseField = <K extends keyof Offense>(index: number, field: K): `offenses.${number}.${K}` => `offenses.${index}.${field}`;
export const leadingOffenseField = (index: number) => pathToOffenseField(index, "leadingWeapon");
export const secondaryOffenseField = (index: number) => pathToOffenseField(index, "secondaryWeapon");
export const damageOffenseField = (index: number) => pathToOffenseField(index, "damageBonus");
export const additionalDamageOffenseField = (index: number) => pathToOffenseField(index, "additionalDamageBonus");

export type WeaponOffensePath =`offenses.${number}.${PathsFrom<Offense, WeaponOffense | undefined>}`;
export type DamageOffensePath = Exclude<`offenses.${number}.${PathsFrom<Offense, DamageOffense>}`, WeaponOffensePath>;
export type AdditionalDamageOffensePath = Exclude<`offenses.${number}.${PathsFrom<Offense, DamageOffense | undefined>}`, WeaponOffensePath | DamageOffensePath>;

export type Critical =
{
  power: number;
  range: number;
}

export function toOffenseString(offense: { amount: number; grade: number; bonus: number, isPhantom?: boolean }, usePlusSignWhenDiceIsPresent?: boolean): string
{
  const bonusValueWithSign = offense.bonus !== 0 ? `${offense.bonus >=0 ? "+" : ""}${offense.bonus}` : "";

  if (offense.grade <= 0 || offense.amount <= 0) 
  {
    return bonusValueWithSign;
  }

  return `${usePlusSignWhenDiceIsPresent ? "+" : ""}${offense.amount}k${offense.grade * 2}${offense.isPhantom ? "w" : ""}${bonusValueWithSign}`
}

export function toCriticalRangeString(weaponOffense: WeaponOffense): string
{
  return `${Math.max(weaponOffense.grade * 2 - weaponOffense.critical.range, 0)}-${weaponOffense.grade * 2}`;
}

export function handleWeaponDamageRolls(offense: WeaponOffense) : { total: number, rolls: [number, boolean][] }
{
  let totalOffenseDamage = 0;
  const rolls: [number, boolean][] = [];

  for (let i = 0; i < offense.amount; i++) 
  {
    const [damageWithoutCritical, criticalDamage] = calculateWeaponDamageRoll(offense);
    const weaponDiceDamageWithoutCritical = damageWithoutCritical + offense.bonus;
    rolls.push([damageWithoutCritical, criticalDamage > 0]);
    totalOffenseDamage += (weaponDiceDamageWithoutCritical + criticalDamage);
  }

  return { total: totalOffenseDamage, rolls };
};

export function handleDamageOffenseRolls(offense: DamageOffense | undefined) : { total: number, rolls: number[] }
{
  if (!offense)
  {
    return { total: 0, rolls: [] };
  }
  
  let totalDamageBonus = 0;
  const rolls: number[] = [];

  for (let i = 0; i < offense.amount; i++) 
  {
    const damageBonusRoll = roll(offense.grade);
    rolls.push(damageBonusRoll);
    totalDamageBonus += damageBonusRoll;
  }

  return { total: totalDamageBonus + offense.bonus, rolls };
}

export function roll(grade: number): number
{
  return Math.floor(Math.random() * grade * 2) + 1;
}

export function calculateWeaponDamageRoll(offense: WeaponOffense) : [damage: number, critical: number]
{
  const weaponDamageRoll = roll(offense.grade);
  const criticalDamage = calculateCriticalDamage(offense, weaponDamageRoll);
  return [ weaponDamageRoll, criticalDamage ];
}

export function calculateCriticalDamage(offense: WeaponOffense, roll: number): number
{
  return roll >= (offense.grade * 2 - offense.critical.range) ? offense.critical.power : 0;
}

export const allowedDiceGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const satisfies readonly number[];

export const allowedDiceBonuses = [-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25] as const satisfies readonly number[];

export const allowedDiceAmounts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const satisfies readonly number[];

export const allowedCriticalRanges = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] as const satisfies readonly number[];

export const allowedCriticalPowers = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] as const satisfies readonly number[];

export const defaultWeaponOffense: WeaponOffense = 
{
  amount: 1,
  grade: defaultDiceGrade,
  bonus: 0,
  isPhantom: false,
  critical: { power: 0, range: 0 }
} as const;

export const CreateWeaponOffense = (): WeaponOffense => 
({
  amount: 1,
  grade: defaultDiceGrade,
  bonus: 0,
  isPhantom: false,
  critical: { power: 0, range: 0 }
});

export const CreateDamageOffense = (): DamageOffense => 
({
  amount: 1,
  grade: defaultDiceGrade,
  bonus: 0,
  isPhantom: false
});

const defaultOffense: Omit<Offense, "id"> =
{
  name: "Nowa Ofensywa",
  description: "Opis ofensywy",
  leadingWeapon: defaultWeaponOffense,
  secondaryWeapon: undefined,
  damageBonus: { amount: 1, grade: defaultDiceGrade, bonus: 0, isPhantom: false }
};

export const CreateDefaultOffense = (): Offense => ({...defaultOffense, id: ulid()});