import { Castable } from '@/domain/characters/Castable';
import { ulid } from "ulid";
import { Entity } from "@/domain/Entity";
import { Perk } from "@/domain/characters/Perk";

export type Power = Entity & 
{
  type: PowerType;
  level: number;
  bonus: number;
  essence: number;
  spells: Spell[];
};

type PowerType = "arkana" | "wiara" | "moc" | "natura";
export const allowedPowerTypes: PowerType[] = ["arkana", "wiara", "moc", "natura"];

export const pathToPowerField = <K extends keyof Power>(index: number, field: K): `powers.${number}.${K}` => `powers.${index}.${field}`;

export type Spell = Perk & Castable &
{
  cost: number;
};

export const pathToSpellField = <K extends keyof Spell>(powerIndex: number, spellIndex: number, field: K): `powers.${number}.spells.${number}.${K}` => `powers.${powerIndex}.spells.${spellIndex}.${field}`;

export const defaultSpell: Omit<Spell, "id"> =
{ 
  name: 'Nowe Zaklęcie',
  description: 'Nowy opis zaklęcia.',
  grade: 1,
  castTime: 'Standardowa',
  cost: 20,
  price: 9,
  cooldown: 1,
  requirements: "wymagania zaklęcia"
};

export const CreateDefaultSpell = (): Spell => ({...defaultSpell, id: ulid()});

export const defaultPower: Omit<Power, "id"> =
{ 
  name: 'Kinetyka', 
  essence: 1,
  type: "moc",
  level: 1, 
  bonus: 0,
  spells: []
};

export const CreateDefaultPower = (): Power => ({...defaultPower, id: ulid()});