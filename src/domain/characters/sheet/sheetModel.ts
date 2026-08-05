import { Character } from '@/domain/characters/Character';
import { Statistic } from '@/domain/characters/statistics/Statistic';
import { calculateTotalHealthForCharacter } from '@/domain/characters/combat/Health';
import { calculateSelectedReduction, Defense } from '@/domain/characters/combat/Defense';
import { DamageOffense, Offense, toCriticalRangeString, toOffenseString, WeaponOffense } from '@/domain/characters/combat/Offense';
import { Power, Spell } from '@/domain/characters/combat/Power';
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { Mode } from '@/domain/characters/combat/Mode';
import { Perk } from '@/domain/characters/Perk';
import { Talent, allowedTalentCategories } from '@/domain/characters/Talent';
import { Weapon } from '@/domain/characters/equipment/Weapon';
import { Armor } from '@/domain/characters/equipment/Armor';
import { Shield } from '@/domain/characters/equipment/Shield';
import { Mount } from '@/domain/characters/equipment/Mount';
import { Item } from '@/domain/characters/equipment/Item';
import { BuffProfile, StatisticBuff } from '@/domain/characters/buffs/BuffProfile';
import {
  getActiveBuffProfiles,
  getActiveOtherModifierProfiles,
  getActiveStanceModifierProfiles,
  getActiveStateModifierProfiles,
} from '@/domain/characters/buffs/applyBuffProfile';
import { formatSpellCost } from '@/domain/characters/combat/SpellCost';
import { summarizeDescription } from '@/domain/characters/sheet/summarizeDescription';

/**
 * Presentation-ready view of a character for the printable sheet.
 *
 * Everything the sheet displays is computed here, once, as plain strings and
 * numbers: the section components do no arithmetic and no formatting. That keeps
 * the whole layer testable without React and lets the print components stay
 * server-rendered — see `features-to-implement/character-sheet-print-plan.md` §3.2.
 *
 * The model reports whatever character it is handed. `CharacterSheetView` hands
 * it `applyActiveBuffProfile(character)`, so the printed numbers match the app
 * for the same character — deactivate a profile and it leaves the sheet. The
 * `buffs` list then says which profiles are already baked into those numbers.
 */
export type SheetModel =
{
  header: SheetHeader;
  characteristics: SheetStatLine[];
  attributes: SheetStatLine[];
  vitals: SheetVitals;
  defenses: SheetDefenseLine[];
  offenses: SheetOffenseLine[];
  equipment: SheetEquipment;
  maneuvers: SheetActionLine[];
  stances: SheetActionLine[];
  states: SheetActionLine[];
  perks: SheetActionLine[];
  powers: SheetPowerBlock[];
  talents: SheetTalentGroup[];
  buffs: SheetBuffLine[];
  appendix: SheetAppendixGroup[];
};

export type SheetHeader =
{
  name: string;
  shortName: string;
  race?: string;
  tags: string[];
  description: string;
  /**
   * Long descriptions print in two columns. Player descriptions are usually a
   * stack of short one-liners (appearance notes, house-ruled perks) and printing
   * them full-width burns a third of the first page on whitespace.
   */
  descriptionIsLong: boolean;
  generatedOn: string;
};

/**
 * Every component of a statistic is reported separately — the sheet is a record
 * of the character, so a reader must be able to see where a number came from
 * (base value vs. permanent bonus vs. test bonus), not just the sum.
 */
export type SheetStatLine =
{
  key: string;
  label: string;
  abbr: string;
  /** e.g. `1k8`. */
  dice: string;
  value: number;
  bonus: number;
  testBonus: number;
  /** What is actually added to the roll: value + bonus + testBonus. */
  total: number;
};

export type SheetVitals =
{
  totalHealth: number;
  recoveryLevel: number;
  /** Everything else about health, in print order — includes the barrier. */
  rows: SheetLabelledValue[];
};

export type SheetLabelledValue = { label: string; value: string };

export type SheetDefenseLine =
{
  id: string;
  name: string;
  isDefault: boolean;
  immunity: number;
  resistance: number;
  protection: number;
  block: number;
  parry: number;
  dodge: number;
  bonus: number;
  fullReduction: number;
  blockReduction: number;
  directReduction: number;
};

export type SheetOffenseLine =
{
  id: string;
  name: string;
  isDefault: boolean;
  leading: string;
  leadingCritical: string;
  secondary?: string;
  secondaryCritical?: string;
  damage: string;
  additionalDamage?: string;
};

export type SheetItemLine =
{
  id: string;
  name: string;
  summary: string;
};

/**
 * Gear is reported as columns, not as one pre-joined string.
 *
 * The joined form made the printed table unreadable: a long values blob forced
 * the name column wide, numbers did not line up between rows, and the
 * description was squeezed into whatever was left. Each category now gets the
 * columns it actually has.
 */
export type SheetWeaponLine = SheetItemLine &
{
  style: string;
  range: number;
  attack: string;
  critical: string;
  damage: string;
};

/** Restrictions shared by armour and shields. */
export type SheetDefensiveItemLine = SheetItemLine &
{
  resistance: number;
  strengthRequirement: number;
  dexterityRestriction: number;
  reflexRestriction: number;
  initiativeRestriction: number;
  attributePenalty: number;
};

export type SheetArmorLine = SheetDefensiveItemLine &
{
  protection: number;
  immunity: number;
};

export type SheetShieldLine = SheetDefensiveItemLine &
{
  block: number;
};

export type SheetMountLine = SheetItemLine &
{
  paceSpeed: number;
  canterSpeed: number;
  gallopSpeed: number;
  horsemanshipBonus: number;
};

export type SheetEquipment =
{
  weapons: SheetWeaponLine[];
  armors: SheetArmorLine[];
  shields: SheetShieldLine[];
  inventory: SheetItemLine[];
  mounts: SheetMountLine[];
};

export type SheetActionLine =
{
  id: string;
  name: string;
  grade: number;
  castTime?: string;
  cooldown?: number;
  summary: string;
};

export type SheetSpellLine =
{
  id: string;
  name: string;
  grade: number;
  castTime: string;
  cost: string;
  summary: string;
};

export type SheetPowerBlock =
{
  id: string;
  name: string;
  type: string;
  level: number;
  bonus: number;
  essence: number;
  summary: string;
  spells: SheetSpellLine[];
};

export type SheetTalentGroup =
{
  category: string;
  talents: SheetTalentLine[];
};

export type SheetTalentLine =
{
  id: string;
  name: string;
  characteristic: string;
  /** e.g. `1k8+3`. */
  display: string;
  penalty?: string;
};

export type SheetBuffLine =
{
  id: string;
  name: string;
  source: string;
  changes: string[];
};

export type SheetAppendixGroup =
{
  title: string;
  entries: SheetAppendixEntry[];
};

export type SheetAppendixEntry =
{
  id: string;
  name: string;
  grade: number;
  description: string;
};

export type BuildSheetModelOptions =
{
  /** Injected so the model stays a pure function and tests stay deterministic. */
  generatedOn?: Date;
  /** Character-line summaries are cut to this many characters. */
  summaryLength?: number;
};

/**
 * Polish labels and print abbreviations for the six characteristics and nine
 * attributes. Labels mirror `SKILLS` in `statistics/skills.ts`; the sheet needs
 * short forms on top of them because a printed table header has no room for
 * "czarokrwistość".
 */
const characteristicMeta: readonly [key: keyof Character['characteristics'], label: string, abbr: string][] =
[
  ['strength', 'siła', 'SIŁ'],
  ['dexterity', 'zręczność', 'ZRC'],
  ['constitution', 'budowa', 'BUD'],
  ['mind', 'umysł', 'UMY'],
  ['charisma', 'charyzma', 'CHA'],
  ['spellborn', 'czarokrwistość', 'CZK'],
];

const attributeMeta: readonly [key: keyof Character['attributes'], label: string, abbr: string][] =
[
  ['fencing', 'fechtunek', 'FECH'],
  ['artifice', 'fortel', 'FOR'],
  ['precision', 'precyzja', 'PRE'],
  ['initiative', 'inicjatywa', 'INI'],
  ['martialArt', 'walka wręcz', 'WWR'],
  ['horsemanship', 'jeździectwo', 'JEŹ'],
  ['fortitude', 'wytrwałość', 'WYT'],
  ['reflex', 'refleks', 'REF'],
  ['willpower', 'wola', 'WOL'],
];

const statisticLabels: Record<string, string> = Object.fromEntries(
  [...characteristicMeta, ...attributeMeta].map(([key, label]) => [key, label]),
);

const healthBuffLabels: Record<string, string> =
{
  barrier: 'bariera',
  vitality: 'żywotność',
  toughness: 'twardość',
  recoveryLevel: 'poziom leczenia',
  lethalHealth: 'przeżywalność',
  lethalRounds: 'determinacja',
  bonus: 'bonus zdrowia',
};

const defenseBuffLabels: Record<string, string> =
{
  immunity: 'niewrażliwość',
  resistance: 'odporność',
  protection: 'pancerz',
  block: 'blokowanie',
  parry: 'parowanie',
  dodge: 'unikanie',
  bonus: 'bonus obrony',
};

const offenseBuffLabels: Record<string, string> =
{
  leadingWeapon: 'broń wiodąca',
  secondaryWeapon: 'broń drugorzędna',
  damageBonus: 'obrażenia',
  additionalDamageBonus: 'obrażenia dodatkowe',
};

/**
 * Per-section summary budgets, in characters.
 *
 * Not one global number, because the columns differ in width: maneuvers and
 * spells get a full-page-wide cell, while perks and modes sit in half-width
 * blocks where anything over ~60 characters wraps to a second line and doubles
 * the block's height. These figures are what keeps the largest character in the
 * database inside the two-page budget — see the print plan §2.3.
 */
const summaryLengths =
{
  maneuver: 90,
  spell: 85,
  power: 90,
  mode: 70,
  perk: 58,
  item: 70,
} as const;

export function buildSheetModel(character: Character, options: BuildSheetModelOptions = {}): SheetModel
{
  const lengthFor = (section: keyof typeof summaryLengths) => options.summaryLength ?? summaryLengths[section];

  return {
    header: buildHeader(character, options.generatedOn ?? new Date()),
    characteristics: characteristicMeta.map(([key, label, abbr]) => toStatLine(key, label, abbr, character.characteristics[key])),
    attributes: attributeMeta.map(([key, label, abbr]) => toStatLine(key, label, abbr, character.attributes[key])),
    vitals: buildVitals(character),
    defenses: character.defenses.map(defense => toDefenseLine(defense, defense.id === character.defaultDefenseId)),
    offenses: character.offenses.map(offense => toOffenseLine(offense, offense.id === character.defaultOffenseId)),
    equipment: buildEquipment(character, lengthFor('item')),
    maneuvers: sortByCastTime(character.maneuvers).map(maneuver => toManeuverLine(maneuver, lengthFor('maneuver'))),
    stances: sortByName(character.stances).map(mode => toModeLine(mode, lengthFor('mode'))),
    states: sortByName(character.states).map(mode => toModeLine(mode, lengthFor('mode'))),
    perks: sortByName(character.perks).map(perk => toPerkLine(perk, lengthFor('perk'))),
    powers: character.powers.map(power => toPowerBlock(power, lengthFor('power'), lengthFor('spell'))),
    talents: buildTalentGroups(character.talents),
    buffs: buildBuffLines(character),
    appendix: buildAppendix(character),
  };
}

/** Above this many printed lines the description switches to two columns. */
const longDescriptionLines = 8;

function buildHeader(character: Character, generatedOn: Date): SheetHeader
{
  const description = character.description ?? '';

  return {
    name: character.name,
    shortName: character.shortName,
    race: character.race?.name,
    tags: [...character.tags],
    description,
    descriptionIsLong: countDescriptionLines(description) > longDescriptionLines,
    generatedOn: formatIsoDate(generatedOn),
  };
}

/** Authored newlines plus an allowance for lines that will wrap on their own. */
function countDescriptionLines(description: string): number
{
  const charactersPerPrintedLine = 150;

  return description
    .split(/\r?\n/)
    .reduce((lines, line) => lines + Math.max(1, Math.ceil(line.length / charactersPerPrintedLine)), 0);
}

function toStatLine(key: string, label: string, abbr: string, statistic: Statistic): SheetStatLine
{
  return {
    key,
    label,
    abbr,
    dice: `1k${statistic.grade * 2}`,
    value: statistic.value,
    bonus: statistic.bonus,
    testBonus: statistic.testBonus,
    total: statistic.value + statistic.bonus + statistic.testBonus,
  };
}

function buildVitals(character: Character): SheetVitals
{
  const { health } = character;

  return {
    totalHealth: calculateTotalHealthForCharacter(character),
    recoveryLevel: health.recoveryLevel,
    rows:
    [
      { label: 'żywotność', value: String(health.vitality) },
      { label: 'twardość', value: String(health.toughness) },
      { label: 'przeżywalność', value: String(health.lethalHealth) },
      { label: 'determinacja', value: String(health.lethalRounds) },
      { label: 'bariera', value: String(health.barrier) },
      { label: 'bonus', value: String(health.bonus) },
    ],
  };
}

function toDefenseLine(defense: Defense, isDefault: boolean): SheetDefenseLine
{
  return {
    id: defense.id,
    name: defense.name,
    isDefault,
    immunity: defense.immunity,
    resistance: defense.resistance,
    protection: defense.protection,
    block: defense.block,
    parry: defense.parry,
    dodge: defense.dodge,
    bonus: defense.bonus,
    fullReduction: calculateSelectedReduction(defense, 'full'),
    blockReduction: calculateSelectedReduction(defense, 'block'),
    directReduction: calculateSelectedReduction(defense, 'direct'),
  };
}

function toOffenseLine(offense: Offense, isDefault: boolean): SheetOffenseLine
{
  return {
    id: offense.id,
    name: offense.name,
    isDefault,
    leading: toOffenseString(offense.leadingWeapon) || '—',
    leadingCritical: toCriticalString(offense.leadingWeapon),
    secondary: offense.secondaryWeapon ? toOffenseString(offense.secondaryWeapon) || '—' : undefined,
    secondaryCritical: offense.secondaryWeapon ? toCriticalString(offense.secondaryWeapon) : undefined,
    damage: toDamageString(offense.damageBonus),
    additionalDamage: offense.additionalDamageBonus ? toDamageString(offense.additionalDamageBonus) : undefined,
  };
}

/** `zakres/siła`, e.g. `7-8/2`. Power is omitted when the weapon does not modify it. */
function toCriticalString(weaponOffense: WeaponOffense): string
{
  const range = toCriticalRangeString(weaponOffense);
  const power = weaponOffense.critical.power;

  return power !== 0 ? `${range}/${formatSigned(power)}` : range;
}

function toDamageString(damageOffense: DamageOffense): string
{
  return toOffenseString(damageOffense) || '—';
}

function buildEquipment(character: Character, summaryLength?: number): SheetEquipment
{
  const { equipment } = character;

  return {
    weapons: equipment.weapons.map(weapon => toWeaponLine(weapon, summaryLength)),
    armors: equipment.armors.map(armor => toArmorLine(armor, summaryLength)),
    shields: equipment.shields.map(shield => toShieldLine(shield, summaryLength)),
    inventory: equipment.inventory.map(item => toItemLine(item, summaryLength)),
    mounts: equipment.mounts.map(mount => toMountLine(mount, summaryLength)),
  };
}

function toWeaponLine(weapon: Weapon, summaryLength?: number): SheetWeaponLine
{
  return {
    ...toItemLine(weapon, summaryLength),
    style: weapon.style,
    range: weapon.range,
    attack: toOffenseString(weapon.offense) || '—',
    critical: toCriticalString(weapon.offense),
    damage: toDamageString(weapon.damageBonus),
  };
}

function toArmorLine(armor: Armor, summaryLength?: number): SheetArmorLine
{
  return {
    ...toItemLine(armor, summaryLength),
    ...defensiveRestrictions(armor),
    protection: armor.protection,
    immunity: armor.immunity,
  };
}

function toShieldLine(shield: Shield, summaryLength?: number): SheetShieldLine
{
  return {
    ...toItemLine(shield, summaryLength),
    ...defensiveRestrictions(shield),
    block: shield.block,
  };
}

function defensiveRestrictions(item: Armor | Shield)
{
  return {
    resistance: item.resistance,
    strengthRequirement: item.strengthRequirement,
    dexterityRestriction: item.dexterityRestriction,
    reflexRestriction: item.reflexRestriction,
    initiativeRestriction: item.initiativeRestriction,
    attributePenalty: item.attributePenalty,
  };
}

function toMountLine(mount: Mount, summaryLength?: number): SheetMountLine
{
  return {
    ...toItemLine(mount, summaryLength),
    paceSpeed: mount.paceSpeed,
    canterSpeed: mount.canterSpeed,
    gallopSpeed: mount.gallopSpeed,
    horsemanshipBonus: mount.horsemanshipBonus,
  };
}

function toItemLine(item: Item, summaryLength?: number): SheetItemLine
{
  return {
    id: item.id,
    name: item.name,
    summary: summarizeDescription(item.description, summaryLength),
  };
}

function toManeuverLine(maneuver: Maneuver, summaryLength?: number): SheetActionLine
{
  return {
    id: maneuver.id,
    name: maneuver.name,
    grade: maneuver.grade,
    castTime: maneuver.castTime,
    cooldown: maneuver.cooldown,
    summary: summarizeDescription(maneuver.description, summaryLength),
  };
}

function toModeLine(mode: Mode, summaryLength?: number): SheetActionLine
{
  return {
    id: mode.id,
    name: mode.name,
    grade: mode.grade,
    summary: summarizeDescription(mode.description, summaryLength),
  };
}

function toPerkLine(perk: Perk, summaryLength?: number): SheetActionLine
{
  return {
    id: perk.id,
    name: perk.name,
    grade: perk.grade,
    summary: summarizeDescription(perk.description, summaryLength),
  };
}

function toPowerBlock(power: Power, summaryLength: number, spellSummaryLength: number): SheetPowerBlock
{
  return {
    id: power.id,
    name: power.name,
    type: power.type,
    level: power.level,
    bonus: power.bonus,
    essence: power.essence,
    summary: summarizeDescription(power.description, summaryLength),
    spells: sortByCastTime(power.spells ?? []).map(spell => toSpellLine(spell, spellSummaryLength)),
  };
}

function toSpellLine(spell: Spell, summaryLength?: number): SheetSpellLine
{
  return {
    id: spell.id,
    name: spell.name,
    grade: spell.grade,
    castTime: spell.castTime,
    cost: formatSpellCost(spell.cost),
    summary: summarizeDescription(spell.description, summaryLength),
  };
}

/**
 * Talents grouped by their authored category, in rulebook order. Categories
 * outside `allowedTalentCategories` are kept (the data predates the enum) and
 * sorted alphabetically after the known ones.
 */
function buildTalentGroups(talents: Talent[]): SheetTalentGroup[]
{
  const byCategory = new Map<string, SheetTalentLine[]>();

  for (const talent of sortByName(talents))
  {
    const category = talent.category?.trim() || 'pozostałe';
    const group = byCategory.get(category) ?? [];
    group.push(toTalentLine(talent));
    byCategory.set(category, group);
  }

  return [...byCategory.entries()]
    .map(([category, talentLines]) => ({ category, talents: talentLines }))
    .sort((left, right) => compareTalentCategories(left.category, right.category));
}

function toTalentLine(talent: Talent): SheetTalentLine
{
  return {
    id: talent.id,
    name: talent.name,
    characteristic: talent.characteristics,
    display: `1k${talent.grade * 2}${formatSigned(talent.bonus)}`,
    penalty: talent.penalty && talent.penalty !== '0' ? talent.penalty : undefined,
  };
}

function compareTalentCategories(left: string, right: string): number
{
  const knownCategories = allowedTalentCategories as readonly string[];
  const leftIndex = knownCategories.indexOf(left);
  const rightIndex = knownCategories.indexOf(right);

  if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex;
  if (leftIndex >= 0) return -1;
  if (rightIndex >= 0) return 1;

  return left.localeCompare(right, 'pl');
}

/**
 * Active modifier profiles, flattened into readable deltas. Only non-zero fields
 * are reported — a profile carries the full statistic tree, almost all of it zero.
 */
function buildBuffLines(character: Character): SheetBuffLine[]
{
  const sources: [profiles: BuffProfile[], source: string][] =
  [
    [getActiveBuffProfiles(character), 'wzmocnienie'],
    [getActiveStanceModifierProfiles(character), 'postawa'],
    [getActiveStateModifierProfiles(character), 'stan'],
    [getActiveOtherModifierProfiles(character), 'inne'],
  ];

  const lines: SheetBuffLine[] = [];
  const seenIds = new Set<string>();

  for (const [profiles, source] of sources)
  {
    for (const profile of profiles)
    {
      if (seenIds.has(profile.id)) continue;
      seenIds.add(profile.id);

      const changes = describeBuffProfile(profile);
      if (changes.length === 0) continue;

      lines.push({ id: profile.id, name: profile.name, source, changes });
    }
  }

  return lines;
}

function describeBuffProfile(profile: BuffProfile): string[]
{
  return [
    ...describeStatisticBuffs(profile.characteristics as Record<string, StatisticBuff>),
    ...describeStatisticBuffs(profile.attributes as Record<string, StatisticBuff>),
    ...describeNumericBuffs(profile.health as unknown as Record<string, number>, healthBuffLabels),
    ...describeNumericBuffs(profile.defense as unknown as Record<string, number>, defenseBuffLabels),
    ...describeOffenseBuffs(profile.offense as unknown as Record<string, Record<string, number>>),
  ];
}

function describeStatisticBuffs(buffs: Record<string, StatisticBuff>): string[]
{
  const changes: string[] = [];

  for (const [key, buff] of Object.entries(buffs))
  {
    const label = statisticLabels[key] ?? key;

    if (buff.value !== 0) changes.push(`${label} ${formatSigned(buff.value)}`);
    if (buff.grade !== 0) changes.push(`${label} kość ${formatSigned(buff.grade)}`);
    if (buff.bonus !== 0) changes.push(`${label} bonus ${formatSigned(buff.bonus)}`);
    if (buff.testBonus !== 0) changes.push(`${label} test ${formatSigned(buff.testBonus)}`);
  }

  return changes;
}

function describeNumericBuffs(buffs: Record<string, number>, labels: Record<string, string>): string[]
{
  return Object.entries(buffs)
    .filter(([, value]) => typeof value === 'number' && value !== 0)
    .map(([key, value]) => `${labels[key] ?? key} ${formatSigned(value)}`);
}

function describeOffenseBuffs(offense: Record<string, Record<string, number>>): string[]
{
  const changes: string[] = [];

  for (const [slot, buff] of Object.entries(offense))
  {
    if (!buff) continue;

    const label = offenseBuffLabels[slot] ?? slot;

    if (buff.amount !== 0) changes.push(`${label} kości ${formatSigned(buff.amount)}`);
    if (buff.grade !== 0) changes.push(`${label} szczebel ${formatSigned(buff.grade)}`);
    if (buff.bonus !== 0) changes.push(`${label} bonus ${formatSigned(buff.bonus)}`);
    if (buff.criticalPower !== undefined && buff.criticalPower !== 0) changes.push(`${label} siła kryt. ${formatSigned(buff.criticalPower)}`);
    if (buff.criticalRange !== undefined && buff.criticalRange !== 0) changes.push(`${label} zakres kryt. ${formatSigned(buff.criticalRange)}`);
  }

  return changes;
}

function buildAppendix(character: Character): SheetAppendixGroup[]
{
  const groups: SheetAppendixGroup[] =
  [
    { title: 'manewry', entries: sortByName(character.maneuvers).map(toAppendixEntry) },
    { title: 'postawy', entries: sortByName(character.stances).map(toAppendixEntry) },
    { title: 'stany', entries: sortByName(character.states).map(toAppendixEntry) },
    { title: 'atuty', entries: sortByName(character.perks).map(toAppendixEntry) },
    ...character.powers.map(power => ({
      title: `zaklęcia — ${power.name}`,
      entries: sortByName(power.spells ?? []).map(toAppendixEntry),
    })),
  ];

  return groups.filter(group => group.entries.length > 0);
}

function toAppendixEntry(entity: { id: string; name: string; grade: number; description: string }): SheetAppendixEntry
{
  return {
    id: entity.id,
    name: entity.name,
    grade: entity.grade,
    description: (entity.description ?? '').trim(),
  };
}

/**
 * Fastest actions first — that is the order a player scans the list in during a
 * turn. Ties fall back to name so the sheet is stable between regenerations.
 */
const castTimeOrder: Record<string, number> =
{
  'Nadnatychmiastowa': 0,
  'Natychmiastowa': 1,
  'Standardowa': 2,
  'Pełnorundowa': 3,
};

function sortByCastTime<T extends { name: string; castTime: string }>(entities: readonly T[]): T[]
{
  return [...entities].sort((left, right) =>
  {
    const order = (castTimeOrder[left.castTime] ?? 99) - (castTimeOrder[right.castTime] ?? 99);
    return order !== 0 ? order : left.name.localeCompare(right.name, 'pl');
  });
}

function sortByName<T extends { name: string }>(entities: readonly T[]): T[]
{
  return [...entities].sort((left, right) => left.name.localeCompare(right.name, 'pl'));
}

export function formatSigned(value: number): string
{
  return value >= 0 ? `+${value}` : String(value);
}

function formatIsoDate(date: Date): string
{
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
