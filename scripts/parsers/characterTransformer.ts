import { ulid } from 'ulid';
import { RawCharacterData } from './excelParser';
import { parseHealth } from './healthParser';
import { parseStats } from './statsParser';
import { parseSaves } from './savesParser';
import { parseReduction } from './reductionParser';
import { parseDefense } from './defenseParser';
import { parseCombatSkill } from './combatSkillParser';
import { parseDamage } from './damageParser';
import { parseManeuverReferences, parsePerkReferences, parseEquipmentReferences, extractCombatTypes, type ManeuverReference, type PerkReference, type EquipmentReferences } from './equipmentParser';

export type Statistic = {
  grade: number;
  value: number;
  bonus: number;
  testBonus: number;
};

export type Characteristics = {
  strength: Statistic;
  dexterity: Statistic;
  constitution: Statistic;
  mind: Statistic;
  charisma: Statistic;
  spellborn: Statistic;
};

export type Attributes = {
  initiative: Statistic;
  precision: Statistic;
  martialArt?: Statistic;
  fencing?: Statistic;
  artifice: Statistic;
  horsemanship: Statistic;
  willpower: Statistic;
  reflex: Statistic;
  fortitude: Statistic;
};

export type Health = {
  vitality: number;
  toughness: number;
  barrier: number;
  recoveryLevel: number;
  lethalHealth: number;
  lethalRounds: number;
  bonus: number;
};

export type Defense = {
  id: string;
  name: string;
  immunity: number;
  resistance: number;
  protection: number;
  block: number;
  parry: number;
  dodge: number;
  bonus: number;
};

export type DiceOffense = {
  amount: number;
  grade: number;
  bonus: number;
};

export type CriticalHit = {
  range: number;
  power: number;
};

export type WeaponOffense = {
  name: string;
  damageType: string;
  dice: DiceOffense;
  critical?: CriticalHit;
};

export type DamageOffense = {
  dice: DiceOffense;
};

export type Offense = {
  id: string;
  name: string;
  leadingWeapon: {
    amount: number;
    grade: number;
    bonus: number;
    critical?: CriticalHit;
  };
  damageBonus: {
    amount: number;
    grade: number;
    bonus: number;
  };
};

export type Character = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  tags: string[];
  characteristics: Characteristics;
  attributes: Attributes;
  health: Health;
  defenses: Defense[];
  offenses: Offense[];
  maneuvers: ManeuverReference[];
  maneuversIds: string[];
  perks: PerkReference[];
  perksIds: string[];
  equipment: EquipmentReferences;
  stances: Array<{ name: string; grade: number }>;
  stancesIds: string[];
  states: Array<{ name: string; grade: number }>;
  statesIds: string[];
};

/**
 * Generuje skróconą nazwę postaci
 */
function generateShortName(name: string): string {
  const words = name.split(' ');
  return words[0].length > 15 ? name.substring(0, 15) : words[0];
}

/**
 * Transformuje surowe dane Excel na obiekt Character
 */
export function transformToCharacter(rawData: RawCharacterData): Character {
  const health = parseHealth(rawData.healthRaw);
  const stats = parseStats(rawData.statsRaw);
  const saves = parseSaves(rawData.savesRaw);
  const reduction = parseReduction(rawData.reductionRaw);
  const defense = parseDefense(rawData.defenseRaw);
  const combatSkill = parseCombatSkill(rawData.combatSkillRaw);
  const damage = parseDamage(rawData.damageRaw);
  
  const maneuvers = parseManeuverReferences(rawData.maneuversRaw, rawData.abilities);
  const perks = parsePerkReferences(rawData.abilities);
  const equipment = parseEquipmentReferences(rawData.equipmentRaw);

  // Combine ability descriptions and add reduction context if present
  let description = rawData.abilities
    .map(a => `**${a.name}**: ${a.description}`)
    .join('\n\n');
  
  if (reduction.contextInfo) {
    description = `**Redukcja**: ${reduction.contextInfo}\n\n${description}`;
  }

  // Determine combat type (martialArt vs fencing)
  const isFencing = rawData.equipmentRaw.toLowerCase().includes('szermierka') || 
                    rawData.equipmentRaw.toLowerCase().includes('rapier') ||
                    rawData.equipmentRaw.toLowerCase().includes('szpada');

  const combatTypes = extractCombatTypes(rawData.maneuversRaw, rawData.abilities);
  
  return {
    id: ulid(),
    name: rawData.name,
    shortName: generateShortName(rawData.name),
    description,
    tags: [rawData.category, rawData.sheetName, ...combatTypes].filter(tag => tag && tag.trim().length > 0),
    characteristics: {
      strength: stats.strength,
      dexterity: stats.dexterity,
      constitution: stats.constitution,
      mind: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
      charisma: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
      spellborn: { grade: 3, value: 0, bonus: 0, testBonus: 0 }
    },
    attributes: {
      initiative: { grade: 3, value: rawData.initiativeRaw, bonus: 0, testBonus: 0 },
      precision: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
      ...(isFencing 
        ? { fencing: { grade: 3, value: combatSkill.primary, bonus: 0, testBonus: combatSkill.primaryTestBonus } } 
        : { martialArt: { grade: 3, value: combatSkill.primary, bonus: 0, testBonus: combatSkill.primaryTestBonus } }
      ),
      artifice: { grade: 3, value: combatSkill.secondary, bonus: 0, testBonus: combatSkill.secondaryTestBonus },
      horsemanship: { grade: 3, value: 0, bonus: 0, testBonus: 0 },
      willpower: saves.willpower,
      reflex: saves.reflex,
      fortitude: saves.fortitude
    },
    health: {
      vitality: health.vitality,
      toughness: 1 + Math.floor(stats.strength.value / 2),
      barrier: 0,
      recoveryLevel: health.recoveryLevel,
      lethalHealth: health.lethalHealth,
      lethalRounds: Math.floor(health.lethalHealth / 2),
      bonus: 0
    },
    defenses: [{
      id: ulid(),
      name: 'Podstawowa',
      immunity: rawData.immunityRaw,
      resistance: rawData.resistanceRaw,
      protection: reduction.protection,
      block: reduction.block,
      parry: defense.parry,
      dodge: defense.dodge,
      bonus: Math.max(0, reduction.total - reduction.protection - reduction.block - defense.parry - defense.dodge)
    }],
    offenses: [{
      id: ulid(),
      name: 'Podstawowa',
      leadingWeapon: {
        amount: damage.leading.amount,
        grade: damage.leading.grade,
        bonus: damage.leading.bonus,
        critical: damage.critical
      },
      damageBonus: {
        amount: damage.bonus.amount,
        grade: damage.bonus.grade,
        bonus: damage.bonus.bonus
      }
    }],
    maneuvers,
    maneuversIds: [],
    perks,
    perksIds: [],
    equipment,
    stances: [],
    stancesIds: [],
    states: [],
    statesIds: []
  };
}
