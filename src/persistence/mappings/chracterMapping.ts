import { Castable } from '@/domain/characters/Castable';
import { Character, CharacterCategory } from '@/domain/characters/Character';
import { Defense } from '@/domain/characters/combat/Defense';
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { Mode } from '@/domain/characters/combat/Mode';
import { Offense } from '@/domain/characters/combat/Offense';
import { Power, PowerType, Spell } from '@/domain/characters/combat/Power';
import { Perk } from '@/domain/characters/Perk';
import { Talent, TalentPenalty } from '@/domain/characters/Talent';
import { Entity } from '@/domain/Entity';
import {  Prisma } from '@/generated/prisma/client';
import { toEquipment } from '@/persistence/mappings/equipmentMapping';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { ulid } from 'ulid';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';

type CharacterWithRelations = Prisma.CharacterGetPayload<{
  include: {
    stances: true;
    states: true;
    maneuvers: true;
    spells: true;
    perks: true;
  }
}>;

export function toCharacter(characterPersistenceModel: CharacterWithRelations): Character
{
  return {
    ...toEntity(characterPersistenceModel),
    shortName: characterPersistenceModel.shortName,
    description: characterPersistenceModel.description,
    category: characterPersistenceModel.category as CharacterCategory,

    characteristics: characterPersistenceModel.characteristics,
    attributes: characterPersistenceModel.attributes,
    talents: characterPersistenceModel.talents.map(toTalents),

    health: characterPersistenceModel.health,
    defenses: characterPersistenceModel.defenses.map(toDefense),
    offenses: characterPersistenceModel.offenses.map(toOffense),
    equipment: toEquipment(characterPersistenceModel.equipment),

    stances: characterPersistenceModel.stances.map(toPerk<Mode>),
    states: characterPersistenceModel.states.map(toPerk<Mode>),
    maneuvers: characterPersistenceModel.maneuvers.map(toCastablePerk<Maneuver>),
    powers: characterPersistenceModel.powers.map(power => toPower(power, characterPersistenceModel.spells)),
    perks: characterPersistenceModel.perks.map(toPerk<Perk>),
  };
}

const defaultDiceGrade = 3;

export function toCharacterHeaderPersistenceModel(header: HeaderDto)
  : Prisma.CharacterCreateInput
{
  return {
    id: ulid(),
    name: header.name,
    shortName: header.shortName,
    description: header.description,
    category: header.category,

    characteristics: 
    {
      strength: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
      dexterity: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
      constitution: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 }, 
      mind: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
      charisma: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
      spellborn: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 } 
    },
    
    attributes: 
    {
      fencing: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
      artifice: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
      precision: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
      initiative: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
      martialArt: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
      horsemanship: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
      fortitude: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
      reflex: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
      willpower: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 }
    },

    health: 
    {
      barrier: 0,
      vitality: 10,
      toughness: 0,
      recoveryLevel: 1,
      lethalHealth: 0,
      lethalRounds: 0,
      bonus: 0
    },

    defenses: [],
    offenses: [],
    talents: [],

    equipment: 
    {
      weapons: [],
      armors: [],
      shields: [],
      inventory: [],
      mounts: []
    },
    powers: [],
  };
}

export function toCharacterDetailsPersistenceModel(details: DetailsDto)
  : Prisma.CharacterUpdateInput
{
  return {
    name: details.name,
    shortName: details.shortName,
    description: details.description,
    category: details.category,
    perks: {
      connect: details.perks.map(p => ({ id: p.id }))
    }
  };
}

export function toCharacterCombatPersistenceModel(combat: CombatDto)
  : Prisma.CharacterUpdateInput
{
  return {
    health: combat.health,
    defenses: combat.defenses,
    stances: {
      connect: combat.stances.map(s => ({ id: s.id }))
    },
    states: {
      connect: combat.states.map(s => ({ id: s.id }))
    },
    maneuvers: {
      connect: combat.maneuvers.map(m => ({ id: m.id }))
    },
    offenses: combat.offenses,
    powers: combat.powers,
    perks: {
      connect: combat.perks.map(p => ({ id: p.id }))
    }
  };
}

type EntityPersistenceParams = {
  id: string;
  name: string;
};

export function toEntity<TEntity extends Entity>(entityPersistenceModel: EntityPersistenceParams): TEntity
{
  return {
    id: entityPersistenceModel.id,
    name: entityPersistenceModel.name,
  } as TEntity;
}

function toTalents(talentPersistenceModel: Prisma.TalentModel): Talent
{
  return {
    ...toEntity(talentPersistenceModel),

    grade: talentPersistenceModel.grade,
    category: talentPersistenceModel.category,
    characteristics: talentPersistenceModel.characteristics,
    bonus: talentPersistenceModel.bonus,
    penalty: talentPersistenceModel.penalty as TalentPenalty,
  };
}

function toDefense(defensePersistenceModel: Prisma.DefenseModel): Defense
{
  return {
    ...toEntity(defensePersistenceModel),

    description: defensePersistenceModel.description ?? undefined,
    immunity: defensePersistenceModel.immunity,
    resistance: defensePersistenceModel.resistance,
    protection: defensePersistenceModel.protection,
    block: defensePersistenceModel.block,
    parry: defensePersistenceModel.parry,
    dodge: defensePersistenceModel.dodge,
    bonus: defensePersistenceModel.bonus,
  };
}

function toOffense(offensePersistenceModel: Prisma.OffenseModel): Offense
{
  return {
    ...toEntity(offensePersistenceModel),

    description: offensePersistenceModel.description ?? undefined,
    leadingWeapon: offensePersistenceModel.leadingWeapon,
    secondaryWeapon: offensePersistenceModel.secondaryWeapon ?? undefined,
    damageBonus: offensePersistenceModel.damageBonus,
  };
}


type PerkPersistenceParams = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string | null;
  price: number;
};

function toPerk<TPerk extends Perk>(perkPersistenceModel: PerkPersistenceParams): TPerk
{
  return {
    ...toEntity(perkPersistenceModel),

    grade: perkPersistenceModel.grade,
    description: perkPersistenceModel.description,
    requirements: perkPersistenceModel.requirements ?? undefined,
    price: perkPersistenceModel.price,
  } as TPerk;
}

function toCastablePerk<TCastablePerk extends (Perk & Castable)>(castablePersistenceModel: Prisma.ManeuverModel): TCastablePerk
{
  return {
    ...toPerk<TCastablePerk>(castablePersistenceModel),
    castTime: castablePersistenceModel.castTime,
    cooldown: castablePersistenceModel.cooldown
  };
}

function toPower(powerPersistenceModel: Prisma.PowerModel, spellPersistenceModels: Prisma.SpellModel[]) : Power
{
  const relatedSpell = spellPersistenceModels
    .filter(spell => powerPersistenceModel.spellsIds.includes(spell.id));

  return {
    ...toEntity(powerPersistenceModel),
    bonus: powerPersistenceModel.bonus,
    level: powerPersistenceModel.level,
    essence: powerPersistenceModel.essence,
    type: powerPersistenceModel.type as PowerType,
    spells: relatedSpell.map(toSpell),
  };
}

function toSpell(spellPersistenceModel: Prisma.SpellModel): Spell
{
  return {
    ...toCastablePerk<Spell>(spellPersistenceModel),
    cost: spellPersistenceModel.cost
  };
}