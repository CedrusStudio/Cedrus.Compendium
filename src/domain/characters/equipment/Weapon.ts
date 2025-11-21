import { Item } from "@/domain/characters/equipment/Item";
import { Critical, DamageOffense, PhantomDamageOffense as PossiblePhantomDamageOffense, WeaponOffense } from "@/domain/characters/combat/Offense";
import { defaultDiceGrade } from "@/domain/diceDefaults";
import { ulid } from "ulid";

export type Weapon = Item & 
{
  style: Style;
  offense: WeaponOffense;
  damageBonus: PossiblePhantomDamageOffense;
  range: number;
};

export type Style = "Jednoręczny" | "Dwuręczny" | "Półtoraręczny";
export const allowedStyles = ["Jednoręczny", "Dwuręczny", "Półtoraręczny"] as const satisfies readonly Style[];

export const pathToWeaponOffenseField = <K extends keyof WeaponOffense>(field: K): `offense.${K}` => `offense.${field}`;
export const pathToWeaponOffenseCriticalField = <K extends keyof Critical>(field: K): `offense.critical.${K}` => `offense.critical.${field}`;
export const pathToWeaponDamageOffenseField = <K extends keyof DamageOffense>(field: K): `damageBonus.${K}` => `damageBonus.${field}`;
export const pathToPossiblePhantomWeaponDamageOffenseField = <K extends keyof PossiblePhantomDamageOffense>(field: K): `damageBonus.${K}` => `damageBonus.${field}`;

export const defaultWeapon: Omit<Weapon, "id"> =
{
  name: "Nowa broń",
  description: "Opis broni",
  style: "Jednoręczny",
  range: 1,
  damageBonus: { amount: 1, grade: defaultDiceGrade, bonus: 0, isPhantom: false },
  offense: { amount: 1, grade: defaultDiceGrade, bonus: 0, critical: { range: 0, power: 0 } },
  tags: []
};

export const CreateDefaultWeapon = (): Weapon => ({...defaultWeapon, id: ulid()});