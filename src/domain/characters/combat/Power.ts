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

export type PowerOffenseFormula =
{
  count: number;

  offenseAmountFormula: string;
  offenseGradeFormula: string;
  offenseBonusFormula: string;
  offenseIsPhantom: boolean;
  offenseCriticalPowerFormula: string;
  offenseCriticalRangeFormula: string;

  damageAmountFormula: string;
  damageGradeFormula: string;
  damageBonusFormula: string;
  damageIsPhantom: boolean;

  costFormula: string;

  descriptionPrefix: string;
};

export const defaultPowerOffenseFormula: PowerOffenseFormula =
{
  count: 5,

  offenseAmountFormula: '1',
  offenseGradeFormula: 'x + 2',
  offenseBonusFormula: '0',
  offenseIsPhantom: false,
  offenseCriticalPowerFormula: '5',
  offenseCriticalRangeFormula: '2',

  damageAmountFormula: '0',
  damageGradeFormula: '1',
  damageBonusFormula: 'x',
  damageIsPhantom: false,

  costFormula: 'x * 10',

  descriptionPrefix: 'Siła Zaklęcia [x]',
};

export const CreateDefaultPowerOffenseFormula = (): PowerOffenseFormula => ({ ...defaultPowerOffenseFormula });

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(Math.round(value), min), max);

// Allows digits, x/X, k (die notation), arithmetic operators and parentheses
const FORMULA_SAFE_PATTERN = /^[0-9xXk\s+\-*/().]+$/;

const normalizeFormula = (raw: string): string =>
  raw
    .replace(/(\d)k\(/g, '$1*(')   // 3k( → 3*(
    .replace(/k(\d+)/gi, '$1')     // k4 → 4, k6 → 6
    .replace(/(\d)\(/g, '$1*(')    // 2( → 2*(
    .replace(/\)\(/g, ')*(')       // )( → )*(
    .replace(/\)(\d)/g, ')*$1');   // )3 → )*3

const evaluateFormula = (formula: string, x: number): number =>
{
  if (!formula || !FORMULA_SAFE_PATTERN.test(formula)) return 0;
  try
  {
    const normalized = normalizeFormula(formula);
    // eslint-disable-next-line no-new-func
    const result = new Function('x', `"use strict"; return (${normalized})`)(x);
    return typeof result === 'number' && isFinite(result) ? result : 0;
  }
  catch
  {
    return 0;
  }
};

// Evaluates [formula] tokens inside a text template.
// e.g. "Precyzja [x/2], Siła Zaklęcia [x]" with x=4 → "Precyzja 2, Siła Zaklęcia 4"
const evaluateDescriptionTemplate = (template: string, x: number): string =>
  template.replace(/\[([^\]]+)\]/g, (_match, expr: string) =>
    String(Math.round(evaluateFormula(expr.trim(), x)))
  );

export const generateOffensesFromFormula = (formula: PowerOffenseFormula): PowerOffense[] =>
{
  const offenses: PowerOffense[] = [];

  for (let i = 1; i <= formula.count; i++)
  {
    offenses.push(
    {
      spellOffense:
      {
        amount: clamp(evaluateFormula(formula.offenseAmountFormula, i), 0, 10),
        grade: clamp(evaluateFormula(formula.offenseGradeFormula, i), 1, 50),
        bonus: clamp(evaluateFormula(formula.offenseBonusFormula, i), -10, 50),
        isPhantom: formula.offenseIsPhantom,
        critical:
        {
          power: clamp(evaluateFormula(formula.offenseCriticalPowerFormula, i), -5, 50),
          range: clamp(evaluateFormula(formula.offenseCriticalRangeFormula, i), -5, 50),
        },
      },
      spellDamage:
      {
        amount: clamp(evaluateFormula(formula.damageAmountFormula, i), 0, 10),
        grade: clamp(evaluateFormula(formula.damageGradeFormula, i), 1, 50),
        bonus: clamp(evaluateFormula(formula.damageBonusFormula, i), -10, 50),
        isPhantom: formula.damageIsPhantom,
      },
      description: formula.descriptionPrefix ? evaluateDescriptionTemplate(formula.descriptionPrefix, i) : '',
      cost: clamp(evaluateFormula(formula.costFormula, i), 0, 1000),
    });
  }

  return offenses;
};

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