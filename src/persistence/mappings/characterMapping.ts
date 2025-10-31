import { Character, CharacterCategory } from '@/domain/characters/Character';
import { CreateDefaultDefense, Defense } from '@/domain/characters/combat/Defense';
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { Mode } from '@/domain/characters/combat/Mode';
import { CreateDefaultOffense, Offense } from '@/domain/characters/combat/Offense';
import { Power, PowerType } from '@/domain/characters/combat/Power';
import { Perk } from '@/domain/characters/Perk';
import { Talent, TalentPenalty } from '@/domain/characters/Talent';
import { Prisma } from '@prisma/client';
import { toEquipment } from '@/persistence/mappings/equipmentMapping';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { ulid } from 'ulid';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import { createUpsertPayload } from '@/persistence/mappings/createUpsertPayload';
import { toEntity } from '@/persistence/mappings/entityMapping';
import { SpellModel, toSpell } from '@/persistence/mappings/spellMappings';
import { CharacterIncludeAllRelations } from '@/infrastructure/searchQueries/characters/allCharacterRelations';
import { toCastablePerk, toPerk } from '@/persistence/mappings/perkMapping';

export type CharacterWithRelations = Prisma.CharacterGetPayload<{ include: CharacterIncludeAllRelations }>;

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

    defenses: [ CreateDefaultDefense() ],
    offenses: [ CreateDefaultOffense() ],
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

export function toCharacterDetailsPersistenceModel(details: DetailsDto, existingPerkIds: string[])
  : Prisma.CharacterUpdateInput
{
  return {
    name: details.name,
    shortName: details.shortName,
    description: details.description,
    category: details.category,
    perks: createUpsertPayload(existingPerkIds, details.perks)
  };
}

export function toCharacterCombatPersistenceModel
(
  combat: CombatDto,
  existingStancesIds: string[],
  existingStatesIds: string[],
  existingManeuversIds: string[],
  existingSpellsIds: string[]
)
  : Prisma.CharacterUpdateInput
{
  return {
    health: combat.health,
    defenses: combat.defenses,
    stances: createUpsertPayload(existingStancesIds, combat.stances),
    states: createUpsertPayload(existingStatesIds, combat.states),
    maneuvers: createUpsertPayload(existingManeuversIds, combat.maneuvers),
    offenses: combat.offenses,
    powers: combat.powers.map(power => ({
      ...power,
      spells: undefined,
      spellsIds: power.spells.map(spell => spell.id)
    })),
    spells: createUpsertPayload(existingSpellsIds, combat.powers.flatMap(power => power.spells)),
  };
}


type TalentModel = Prisma.CharacterGetPayload<{select: { talents: true }}>['talents'][number];

function toTalents(talentPersistenceModel: TalentModel): Talent
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

type DefenseModel = Prisma.CharacterGetPayload<{select: { defenses: true }}>['defenses'][number];

function toDefense(defensePersistenceModel: DefenseModel): Defense
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

type OffenseModel = Prisma.CharacterGetPayload<{select: { offenses: true }}>['offenses'][number];

function toOffense(offensePersistenceModel: OffenseModel): Offense
{
  return {
    ...toEntity(offensePersistenceModel),

    description: offensePersistenceModel.description ?? undefined,
    leadingWeapon: offensePersistenceModel.leadingWeapon,
    secondaryWeapon: offensePersistenceModel.secondaryWeapon ?? undefined,
    damageBonus: offensePersistenceModel.damageBonus,
  };
}

type PowerModel = Prisma.CharacterGetPayload<{select: { powers: true }}>['powers'][number];

function toPower(powerPersistenceModel: PowerModel, spellPersistenceModels: SpellModel[]) : Power
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
