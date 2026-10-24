import { Character } from '@/domain/characters/Character';
import { CreateDefaultDefense, Defense } from '@/domain/characters/combat/Defense';
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { Mode } from '@/domain/characters/combat/Mode';
import { CreateDefaultOffense, Offense } from '@/domain/characters/combat/Offense';
import { normalizePowerType, Power, PowerSpecification } from '@/domain/characters/combat/Power';
import { Perk } from '@/domain/characters/Perk';
import { Talent, TalentPenalty } from '@/domain/characters/Talent';
import { Prisma } from '@prisma/client';
import { toEquipment } from '@/persistence/mappings/equipmentMapping';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { ulid } from 'ulid';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import { EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { createUpsertPayload } from '@/persistence/mappings/createUpsertPayload';
import { toEntity } from '@/persistence/mappings/entityMapping';
import { SpellModel, toSpell, toSpellPersistenceModel } from '@/persistence/mappings/spellMappings';
import { CharacterIncludeAllRelations } from '@/infrastructure/searchQueries/characters/allCharacterRelations';
import { toCastablePerk, toPerk } from '@/persistence/mappings/perkMapping';
import { toCastablePersistenceModel } from '@/persistence/mappings/castableMapping';
import { CopyCreateCharacterDto } from '@/persistence/schemas/characters/copyCharacterSchema';
import { toRace } from '@/persistence/mappings/raceMapping';
import { BuffsDto } from '@/persistence/schemas/characters/buffs/buffsSchema';
import { membershipSnapshot } from '@/domain/characters/characterMembership';

export type CharacterWithRelations = Prisma.CharacterGetPayload<{ include: CharacterIncludeAllRelations }>;
export type CharacterWithoutRelations = Prisma.CharacterGetPayload<null>;

export function toCharacter(characterPersistenceModel: CharacterWithRelations): Character
{
  return {
    ...toEntity(characterPersistenceModel),
    shortName: characterPersistenceModel.shortName,
    description: characterPersistenceModel.description,
    tags: characterPersistenceModel.tags,
    apiKeys: characterPersistenceModel.apiKeys,
    membershipSnapshot: membershipSnapshot(characterPersistenceModel),
    race: characterPersistenceModel.race ? toRace(characterPersistenceModel.race) : undefined,

    characteristics: characterPersistenceModel.characteristics,
    attributes: characterPersistenceModel.attributes,
    talents: characterPersistenceModel.talents.map(toTalents),

    health: characterPersistenceModel.health,
    defenses: characterPersistenceModel.defenses.map(toDefense),
    defaultDefenseId: characterPersistenceModel.defaultDefenseId ?? undefined,
    offenses: characterPersistenceModel.offenses.map(toOffense),
    defaultOffenseId: characterPersistenceModel.defaultOffenseId ?? undefined,

    equipment: toEquipment
    (
      characterPersistenceModel.weapons,
      characterPersistenceModel.armors,
      characterPersistenceModel.shields,
      characterPersistenceModel.inventory,
      characterPersistenceModel.mounts
    ),

    stances: characterPersistenceModel.stances.map(toPerk<Mode>),
    states: characterPersistenceModel.states.map(toPerk<Mode>),
    maneuvers: characterPersistenceModel.maneuvers.map(toCastablePerk<Maneuver>),
    powers: characterPersistenceModel.powers.map(power => toPower(power, characterPersistenceModel.spells, characterPersistenceModel.powerSpecifications)),
    perks: characterPersistenceModel.perks.map(toPerk<Perk>),
    buffProfiles: normalizeModifierProfiles(characterPersistenceModel.buffProfiles),
    activeBuffProfileIds: characterPersistenceModel.activeBuffProfileIds,
    stanceModifierProfiles: normalizeModifierProfiles(characterPersistenceModel.stanceModifierProfiles),
    activeStanceModifierProfileIds: characterPersistenceModel.activeStanceModifierProfileIds,
    stateModifierProfiles: normalizeModifierProfiles(characterPersistenceModel.stateModifierProfiles),
    activeStateModifierProfileIds: characterPersistenceModel.activeStateModifierProfileIds,
    otherModifierProfiles: normalizeModifierProfiles(characterPersistenceModel.otherModifierProfiles),
    activeOtherModifierProfileIds: characterPersistenceModel.activeOtherModifierProfileIds,
  };
}

export function toCharacters(characterPersistenceModels: CharacterWithRelations[]): Character[]
{
  return characterPersistenceModels.map(toCharacter);
}

export function toCharacterFromCopyPersistenceModel(copyCreateCharacter: CopyCreateCharacterDto)
  : Prisma.CharacterCreateInput
{
  return {
    id: ulid(),
    name: copyCreateCharacter.name,
    shortName: copyCreateCharacter.shortName,
    description: copyCreateCharacter.description,
    tags: copyCreateCharacter.tags,

    ...(copyCreateCharacter.raceId && {
      race: {
        connect: { id: copyCreateCharacter.raceId }
      }
    }),

    characteristics: copyCreateCharacter.characteristics,
    attributes: copyCreateCharacter.attributes,
    talents: copyCreateCharacter.talents,
    health: copyCreateCharacter.health,
    defenses: copyCreateCharacter.defenses,
    defaultDefenseId: copyCreateCharacter.defaultDefenseId,
    offenses: copyCreateCharacter.offenses,
    defaultOffenseId: copyCreateCharacter.defaultOffenseId,
    buffProfiles: copyCreateCharacter.buffProfiles,
    activeBuffProfileIds: copyCreateCharacter.activeBuffProfileIds,
    stanceModifierProfiles: copyCreateCharacter.stanceModifierProfiles,
    activeStanceModifierProfileIds: copyCreateCharacter.activeStanceModifierProfileIds,
    stateModifierProfiles: copyCreateCharacter.stateModifierProfiles,
    activeStateModifierProfileIds: copyCreateCharacter.activeStateModifierProfileIds,
    otherModifierProfiles: copyCreateCharacter.otherModifierProfiles,
    activeOtherModifierProfileIds: copyCreateCharacter.activeOtherModifierProfileIds,

    weapons : {
      connect: copyCreateCharacter.weaponsIds.map(id => ({ id }))
    },

    armors : {
      connect: copyCreateCharacter.armorsIds.map(id => ({ id }))
    },

    shields : {
      connect: copyCreateCharacter.shieldsIds.map(id => ({ id }))
    },

    inventory : {
      connect: copyCreateCharacter.inventoryIds.map(id => ({ id }))
    },

    mounts : {
      connect: copyCreateCharacter.mountsIds.map(id => ({ id }))
    },

    powers: copyCreateCharacter.powers.map(power => ({
      ...power,
      spells: undefined,
      spellsIds: power.spells.map(spell => spell.id)
    })),

    maneuvers: {
      connect: copyCreateCharacter.maneuversIds.map(id => ({ id }))
    },

    powerSpecifications: {
      connect: copyCreateCharacter.powerSpecificationsIds.map(id => ({ id }))
    },

    states: {
      connect: copyCreateCharacter.statesIds.map(id => ({ id }))
    },

    stances: {
      connect: copyCreateCharacter.stancesIds.map(id => ({ id }))
    },

    perks: {
      connect: copyCreateCharacter.perksIds.map(id => ({ id }))
    },

    spells: {
      connect: copyCreateCharacter.spellsIds.map(id => ({ id }))
    },
  };
}

const defaultDiceGrade = 3;

export function toCharacterHeaderPersistenceModel(header: HeaderDto)
  : Prisma.CharacterCreateInput
{
  const defaultDefense = CreateDefaultDefense();
  const defaultOffense = CreateDefaultOffense();
  
  return {
    id: ulid(),
    name: header.name,
    shortName: header.shortName,
    description: header.description,
    tags: header.tags,

    ...(header.raceId && {
      race: {
        connect: { id: header.raceId }
      }
    }),

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

    defenses: [ defaultDefense ],
    defaultDefenseId: defaultDefense.id,
    offenses: [ defaultOffense ],
    defaultOffenseId: defaultOffense.id,
  buffProfiles: [],
    activeBuffProfileIds: [],
    stanceModifierProfiles: [],
    activeStanceModifierProfileIds: [],
    stateModifierProfiles: [],
    activeStateModifierProfileIds: [],
    otherModifierProfiles: [],
    activeOtherModifierProfileIds: [],
    talents: [],

    // equipment relations start as empty arrays
    powers: [],
  };
}

export function toCharacterDetailsPersistenceModel
(
  details: DetailsDto, 
  existingOnCharacterPerkIds: string[],
  idsToConnect: string[] = []
)
  : Prisma.CharacterUpdateInput
{
  return {
    name: details.name,
    shortName: details.shortName,
    description: details.description,
    tags: details.tags,
    ...(details.raceId !== undefined && {
      race: details.raceId
        ? { connect: { id: details.raceId } }
        : { disconnect: true }
    }),
    ...(details.apiKeys !== undefined && { apiKeys: details.apiKeys }),
    perks: createUpsertPayload(existingOnCharacterPerkIds, details.perks, idsToConnect)
  };
}

export function toCharacterCombatPersistenceModel
(
  combat: CombatDto,
  existingStancesIds: string[],
  stancesIdsToConnect: string[] = [],
  existingStatesIds: string[],
  statesIdsToConnect: string[] = [],
  existingManeuversIds: string[],
  maneuversIdsToConnect: string[] = [],
  existingSpellsIds: string[],
  spellsIdsToConnect: string[] = [],
  existingPowerSpecificationsIds: string[],
  powerSpecificationsIdsToConnect: string[] = []
)
  : Prisma.CharacterUpdateInput
{
  const uniquePowerSpecIds = [...new Set(combat.powers.map(power => power.powerSpecificationId))];
  
  return {
    health: combat.health,
    defenses: combat.defenses,
    defaultDefenseId: combat.defaultDefenseId,
    stances: createUpsertPayload(existingStancesIds, combat.stances, stancesIdsToConnect),
    states: createUpsertPayload(existingStatesIds, combat.states, statesIdsToConnect),
    // Cast: the payload's `effects` is a domain `Effect[]`; Prisma stores it as
    // Json. The runtime shape is JSON-serializable, so the cast is safe.
    maneuvers: createUpsertPayload(existingManeuversIds, combat.maneuvers.map(toCastablePersistenceModel), maneuversIdsToConnect) as Prisma.CharacterUpdateInput["maneuvers"],
    powerSpecifications: {
      connect: [...powerSpecificationsIdsToConnect, ...uniquePowerSpecIds.filter(id => !existingPowerSpecificationsIds.includes(id))].map(id => ({ id }))
    },
    offenses: combat.offenses,
    defaultOffenseId: combat.defaultOffenseId,
    powers: combat.powers.map(power => ({
      ...power,
      type: normalizePowerType(power.type),
      spells: undefined,
      spellsIds: power.spells.map(spell => spell.id),
    })),
    spells: createUpsertPayload(existingSpellsIds, combat.powers.flatMap(power => power.spells).map(toSpellPersistenceModel), spellsIdsToConnect),
  };
}

export function toCharacterEquipmentPersistenceModel
(
  equipment: EquipmentDto,
  existingWeaponsIds: string[],
  weaponsIdsToConnect: string[] = [],
  existingArmorsIds: string[],
  armorsIdsToConnect: string[] = [],
  existingShieldsIds: string[],
  shieldsIdsToConnect: string[] = [],
  existingInventoryIds: string[],
  inventoryIdsToConnect: string[] = [],
  existingMountsIds: string[],
  mountsIdsToConnect: string[] = []
)
  : Prisma.CharacterUpdateInput
{
  return {
    weapons: createUpsertPayload(existingWeaponsIds, equipment.weapons, weaponsIdsToConnect),
    armors: createUpsertPayload(existingArmorsIds, equipment.armors, armorsIdsToConnect),
    shields: createUpsertPayload(existingShieldsIds, equipment.shields, shieldsIdsToConnect),
    inventory: createUpsertPayload(existingInventoryIds, equipment.inventory, inventoryIdsToConnect),
    mounts: createUpsertPayload(existingMountsIds, equipment.mounts, mountsIdsToConnect),
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
    additionalDamageBonus: offensePersistenceModel.additionalDamageBonus ?? undefined
  };
}

type PowerModel = Prisma.CharacterGetPayload<{select: { powers: true }}>['powers'][number];
export type PowerSpecificationModel = Prisma.CharacterGetPayload<{select: { powerSpecifications: true }}>['powerSpecifications'][number];

function toPower(powerPersistenceModel: PowerModel, spellPersistenceModels: SpellModel[], powerSpecificationPersistenceModels: PowerSpecificationModel[]) : Power
{
  const relatedSpell = spellPersistenceModels
    .filter(spell => powerPersistenceModel.spellsIds.includes(spell.id));

  return {
    ...toEntity(powerPersistenceModel),
    bonus: powerPersistenceModel.bonus,
    description: powerPersistenceModel.description ?? '',
    level: powerPersistenceModel.level,
    essence: powerPersistenceModel.essence,
    type: normalizePowerType(powerPersistenceModel.type),
    spells: relatedSpell.map(toSpell),
    powerSpecificationId: powerPersistenceModel.powerSpecificationId
  };
}

function toPowerSpecification(powerSpecificationPersistenceModel: PowerSpecificationModel) : PowerSpecification
{
  return {
    ...toEntity(powerSpecificationPersistenceModel),
    description: powerSpecificationPersistenceModel.description,
    tags: powerSpecificationPersistenceModel.tags,
    offenses: powerSpecificationPersistenceModel.offenses
  };
}

export function toCharacterBuffsPersistenceModel(buffs: BuffsDto): Prisma.CharacterUpdateInput
{
  return {
    buffProfiles: buffs.buffProfiles,
    activeBuffProfileIds: buffs.activeBuffProfileIds,
    stanceModifierProfiles: buffs.stanceModifierProfiles,
    activeStanceModifierProfileIds: buffs.activeStanceModifierProfileIds,
    stateModifierProfiles: buffs.stateModifierProfiles,
    activeStateModifierProfileIds: buffs.activeStateModifierProfileIds,
    otherModifierProfiles: buffs.otherModifierProfiles,
    activeOtherModifierProfileIds: buffs.activeOtherModifierProfileIds,
  };
}

function normalizeModifierProfiles(buffProfiles: CharacterWithRelations['buffProfiles']): Character['buffProfiles']
{
  return buffProfiles.map(buffProfile => ({
    ...buffProfile,
    description: buffProfile.description ?? undefined,
    linkedEntityId: buffProfile.linkedEntityId ?? undefined,
  }));
}
