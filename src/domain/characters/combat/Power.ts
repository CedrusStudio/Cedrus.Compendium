import { Castable } from '@/domain/characters/Castable';
import { ulid } from "ulid";
import { Entity } from "@/domain/Entity";
import { Perk } from "@/domain/characters/Perk";
import { CreateDamageOffense, CreateWeaponOffense, DamageOffense, WeaponOffense } from '@/domain/characters/combat/Offense';
import { Tag } from '@/domain/Tag';

export type Power = Entity & 
{
  type: PowerType;
  level: number;
  bonus: number;
  essence: number;
  powerSpecificationId: string;
  spells: Spell[];
};

export type PowerSpecification = Entity &
{
  description: string;
  tags: Tag[];
  offenses: PowerOffense[]
};

export type PowerOffense =
{
  spellOffense: SpellOffense;
  spellDamage: SpellDamage;
  description: string;
  cost: number;
};

export type SpellDamage = DamageOffense;
export type SpellOffense = WeaponOffense;

export type PowerType = "arkana" | "wiara" | "moc" | "natura";
export const allowedPowerTypes: PowerType[] = ["arkana", "wiara", "moc", "natura"];

export const pathToPowerField = <K extends keyof Power>(index: number, field: K): `powers.${number}.${K}` => `powers.${index}.${field}`;

export type Spell = Perk & Castable &
{
  cost: number;
};

export const pathToSpell = (powerIndex: number, spellIndex: number): `powers.${number}.spells.${number}` => `powers.${powerIndex}.spells.${spellIndex}`;
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
  requirements: [],
  tags: []
};

export const CreateDefaultSpell = (): Spell => ({...defaultSpell, id: ulid()});

export const defaultPower: Omit<Power, "id"> =
{ 
  name: 'Kinetyka', 
  essence: 1,
  type: "moc",
  level: 1, 
  bonus: 0,
  powerSpecificationId: '',
  spells: []
};

export const defaultPowerOffense: PowerOffense =
{
  spellOffense: CreateWeaponOffense(),
  spellDamage: CreateDamageOffense(),
  description: 'Nowy opis ofensywy mocy.',
  cost: 20
};

export const CreateDefaultPowerOffense = (): PowerOffense => 
({
  spellOffense: CreateWeaponOffense(),
  spellDamage: { ...CreateDamageOffense(), amount: 0, grade: 1, bonus: 1 },
  description: 'Nowy opis ofensywy mocy.',
  cost: 20
});

export const defaultPowerSpecification: Omit<PowerSpecification, "id"> =
{
  name: 'Specyfikacja Mocy',
  description: '',
  tags: [],
  offenses: []
};

export const CreateDefaultPowerSpecification = (): PowerSpecification => ({...defaultPowerSpecification, id: ulid()});
export const CreateDefaultPower = (): Power => ({...defaultPower, id: ulid()});

const powerFieldOrderArray: (keyof Power)[] = [
  'name',
  'type',
  'level',
  'bonus',
  'essence',
  'powerSpecificationId',
  'spells'
];

export const powerFieldOrder = (a: keyof Power, b: keyof Power) => 
{
  const indexA = powerFieldOrderArray.indexOf(a);
  const indexB = powerFieldOrderArray.indexOf(b);
  if (indexA === -1 && indexB === -1) return String(a).localeCompare(String(b));
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  return indexA - indexB;
}