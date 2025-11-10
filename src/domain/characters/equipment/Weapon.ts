import { Item } from "@/domain/characters/equipment/Item";
import { Critical, DamageOffense, WeaponOffense } from "@/domain/characters/combat/Offense";
import { defaultDiceGrade } from "@/domain/diceDefaults";
import { ulid } from "ulid";

export type Weapon = Item & 
{
  style: Style;
  offense: WeaponOffense;
  damageBonus: DamageOffense;
  range: number;
};

export type Style = "None" | "Jednoręczny" | "Dwuręczny" | "Dystansowy" | "Rzucony" | "Półtoraręczny";
export const allowedStyles = ["None", "Jednoręczny", "Dwuręczny", "Dystansowy", "Rzucony", "Półtoraręczny"] as const satisfies readonly Style[];

export const pathToWeaponOffenseField = <K extends keyof WeaponOffense>(field: K): `offense.${K}` => `offense.${field}`;
export const pathToWeaponOffenseCriticalField = <K extends keyof Critical>(field: K): `offense.critical.${K}` => `offense.critical.${field}`;
export const pathToWeaponDamageOffenseField = <K extends keyof DamageOffense>(field: K): `damageBonus.${K}` => `damageBonus.${field}`;

export const defaultWeapon: Omit<Weapon, "id"> =
{
  name: "Nowa broń",
  description: "Opis broni",
  style: "Jednoręczny",
  range: 1,
  damageBonus: { amount: 1, grade: defaultDiceGrade, bonus: 0 },
  offense: { amount: 1, grade: defaultDiceGrade, bonus: 0, critical: { range: 0, power: 0 } },
  tags: []
};

export const CreateDefaultWeapon = (): Weapon => ({...defaultWeapon, id: ulid()});