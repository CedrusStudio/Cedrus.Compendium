'use server';

//Tip: mark your repository as server-only so it can't be imported in client components by mistake.
import 'server-only';
import prisma from '@/lib/prisma';
import { adminApiKeys } from '@/lib/env';
import { toCharacterCombatPersistenceModel, toCharacterDetailsPersistenceModel, toCharacterEquipmentPersistenceModel, toCharacterFromCopyPersistenceModel, toCharacterHeaderPersistenceModel } from '@/persistence/mappings/characterMapping';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { StatisticsDto } from '@/persistence/schemas/characters/statistics/statisticsSchema';
import { TalentsDto } from '@/persistence/schemas/characters/talentSchema';
import { EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import { CopyCreateCharacterDto } from '@/persistence/schemas/characters/copyCharacterSchema';
import { Character } from '@/domain/characters/Character';
import { toCharacter, toCharacterBuffsPersistenceModel } from '@/persistence/mappings/characterMapping';
import { includeAllRelations } from '@/infrastructure/searchQueries/characters/allCharacterRelations';
import { BuffsDto } from '@/persistence/schemas/characters/buffs/buffsSchema';
import { CharacterValidationError } from '@/persistence/characters/characterErrors';
import { characterVisibilityWhere } from '@/persistence/characterVisibility';
import { membershipSnapshot, type CharacterMembershipSnapshot } from '@/domain/characters/characterMembership';
import { rethrowMembershipConflict, withMembershipSnapshot, membershipSnapshotSelect, type GuardedCharacter } from './membershipSnapshot';
import { perkHasChanges, perkSaveSelect } from './unchangedPerks';
import type { Prisma } from '@prisma/client';
import type { RelationPayload } from '@/persistence/mappings/createUpsertPayload';
import { withCharacterAccess } from './withCharacterAccess';
import { changedRelations, type RelationOperationCounts } from './changedRelations';
import { toSpellPersistenceModel } from '@/persistence/mappings/spellMappings';
import { toCastablePersistenceModel } from '@/persistence/mappings/castableMapping';
import { fromSpellCostPersistence, toSpellCostPersistence } from '@/domain/characters/combat/SpellCost';

//Queries
/**
 * Loads full characters selected as AI references, but only when they are
 * visible to the caller's API key. The visibility rule stays in MongoDB so
 * hidden character data is never hydrated only to be discarded afterwards.
 */
export async function getCharactersVisibleToApiKeyByIds(ids: string[], apiKey: string)
  : Promise<Character[]>
{
  if (ids.length === 0) return [];

  const characters = await prisma.character.findMany
  ({
    where:
    {
      AND:
      [
        { id: { in: ids } },
        characterVisibilityWhere(apiKey),
      ],
    },
    include: includeAllRelations,
  });

  return characters.map(toCharacter);
}

//Commands
export async function addCharacter(characterHeader: HeaderDto)
  : Promise<string>
{
  const characterHeaderPersistenceModel = toCharacterHeaderPersistenceModel(characterHeader);
  const character = await prisma.character.create
  ({
    data: characterHeaderPersistenceModel
  });

  return character.id;
}

export async function copyCreateCharacter(copyCreateCharacterData: CopyCreateCharacterDto)
  : Promise<string>
{
  const characterHeaderPersistenceModel = toCharacterFromCopyPersistenceModel(copyCreateCharacterData);
  const character = await prisma.character.create
  ({
    data: characterHeaderPersistenceModel
  });

  return character.id;
}

export async function deleteCharacter(id: string, apiKey: string)
  : Promise<void>
{
  await withCharacterAccess(id, apiKey, async tx => {
    await tx.character.delete({ where: { id } });
  });
}

export async function updateCharacterStatistics(id: string, characterStatistics: StatisticsDto, apiKey: string)
  : Promise<boolean>
{
  return withCharacterAccess(id, apiKey, async tx => {
    await tx.character.update({ where: { id }, data: characterStatistics });
    return true;
  });
}

export async function updateCharacterTalents(id: string, characterTalents: TalentsDto, apiKey: string)
  : Promise<boolean>
{
  return withCharacterAccess(id, apiKey, async tx => {
    await tx.character.update({ where: { id }, data: characterTalents });
    return true;
  });
}

export async function updateCharacterEquipment(id: string, characterEquipment: EquipmentDto, apiKey: string)
  : Promise<boolean>
{
  return withCharacterAccess(id, apiKey, async tx => {
    const characterToUpdate = await tx.character.findUnique
    ({
      where: { id },
      select:
      {
        weaponsIds: true,
        armorsIds: true,
        shieldsIds: true,
        inventoryIds: true,
        mountsIds: true
      }
    });

    if (!characterToUpdate) return false;

    const existingWeaponIds = await fetchExistingEntityIds(tx.weapon, characterEquipment.weapons, characterToUpdate.weaponsIds);
    const existingArmorIds = await fetchExistingEntityIds(tx.armor, characterEquipment.armors, characterToUpdate.armorsIds);
    const existingShieldIds = await fetchExistingEntityIds(tx.shield, characterEquipment.shields, characterToUpdate.shieldsIds);
    const existingInventoryIds = await fetchExistingEntityIds(tx.inventoryItem, characterEquipment.inventory, characterToUpdate.inventoryIds);
    const existingMountIds = await fetchExistingEntityIds(tx.mount, characterEquipment.mounts, characterToUpdate.mountsIds);

    const characterEquipmentPersistenceModel = toCharacterEquipmentPersistenceModel
    (
      characterEquipment,
      characterToUpdate.weaponsIds,
      existingWeaponIds,
      characterToUpdate.armorsIds,
      existingArmorIds,
      characterToUpdate.shieldsIds,
      existingShieldIds,
      characterToUpdate.inventoryIds,
      existingInventoryIds,
      characterToUpdate.mountsIds,
      existingMountIds
    );

    const updatedCharacter = await tx.character.update
    ({
      where: { id },
      data: characterEquipmentPersistenceModel
    });

    return !!updatedCharacter;
  });
}

export async function updateCharacterDetails(id: string, characterDetails: DetailsDto, guard: { expectedMembership: Partial<CharacterMembershipSnapshot>; apiKey: string })
{
  const timing: DetailsSaveTiming = { startedAt: performance.now() };
  try {
    return await withMembershipSnapshot(id, guard.expectedMembership, guard.apiKey,
      (tx, character) => saveCharacterDetails(id, characterDetails, tx, timing, character));
  } finally {
    const elapsedMs = Math.round(performance.now() - timing.startedAt);
    if (elapsedMs >= 1_000) console.info('Character details save timing', {
      elapsedMs, writeMs: timing.writeStartedAt === undefined ? undefined : Math.round(performance.now() - timing.writeStartedAt),
      submittedPerks: characterDetails.perks.length, operations: timing.operations,
    });
  }
}

type DetailsSaveTiming = { startedAt: number; writeStartedAt?: number; operations?: Record<string, number> };

async function saveCharacterDetails(id: string, characterDetails: DetailsDto, db: Prisma.TransactionClient,
  timing: DetailsSaveTiming, guardedCharacter: Pick<GuardedCharacter, 'perksIds' | 'raceId'>)
{
  const existingOnCharacterPerkIdsResponse = guardedCharacter;

  // Character apiKeys must come from the same pool as the configured admin
  // API keys (NEXT_API_KEYS) — see features-to-implement/visible-only-to-api-keys.md.
  // Enforced here (server-only) rather than in the Zod schema, since that
  // schema also runs client-side and adminApiKeys is a server-only secret.
  if (characterDetails.apiKeys && characterDetails.apiKeys.length > 0) {
    const invalidApiKeys = characterDetails.apiKeys.filter(apiKey => !adminApiKeys.includes(apiKey));

    if (invalidApiKeys.length > 0) {
      throw new CharacterValidationError('Invalid API keys, not part of the configured admin keys.');
    }
  }

  // Validate raceId exists if provided
  if (characterDetails.raceId && characterDetails.raceId !== existingOnCharacterPerkIdsResponse.raceId) {
    const raceExists = await db.race.findUnique({
      where: { id: characterDetails.raceId },
      select: { id: true }
    });

    if (!raceExists) {
      throw new CharacterValidationError(`Race with id ${characterDetails.raceId} not found`);
    }
  }

  // One batch read avoids issuing nested updates for every unchanged perk on a
  // large sheet. Keep genuine edits, additions and removals transactional.
  const currentPerkIds = existingOnCharacterPerkIdsResponse.perksIds ?? [];
  const storedPerks = characterDetails.perks.length === 0 ? [] : await db.perk.findMany({
    where: { id: { in: [...new Set(characterDetails.perks.map(perk => perk.id))] } },
    select: perkSaveSelect,
  });
  const storedById = new Map(storedPerks.map(perk => [perk.id, perk]));
  const currentIds = new Set(currentPerkIds);
  const existingPerkIds = storedPerks.filter(perk => !currentIds.has(perk.id)).map(perk => perk.id);

  const characterDetailsPersistenceModel = toCharacterDetailsPersistenceModel
  (
    characterDetails, 
    currentPerkIds,
    existingPerkIds
  );

  const incomingById = new Map(characterDetails.perks.map(perk => [perk.id, perk]));
  const perks = characterDetailsPersistenceModel.perks as RelationPayload<DetailsDto['perks'][number]>;
  perks.update = perks.update.filter(update => {
    const stored = storedById.get(update.where.id);
    return !stored || perkHasChanges(incomingById.get(update.where.id)!, stored);
  });
  timing.operations = { create: perks.create.length, update: perks.update.length, connect: perks.connect.length, disconnect: perks.disconnect.length };
  if (Object.values(timing.operations).every(count => count === 0)) delete characterDetailsPersistenceModel.perks;
  if (characterDetails.raceId === existingOnCharacterPerkIdsResponse.raceId) delete characterDetailsPersistenceModel.race;

  try {
    timing.writeStartedAt = performance.now();
    const updatedCharacter = await db.character.update({
      where: { id },
      data: characterDetailsPersistenceModel,
      select: membershipSnapshotSelect,
    });
    return membershipSnapshot(updatedCharacter);
  } catch (error) { return rethrowMembershipConflict(error); }
}

export async function updateCharacterCombat(id: string, characterCombat: CombatDto, guard: { expectedMembership: Partial<CharacterMembershipSnapshot>; apiKey: string })
{
  const timing: CombatSaveTiming = { startedAt: performance.now() };
  try {
    return await withMembershipSnapshot(id, guard.expectedMembership, guard.apiKey,
      (tx, character) => saveCharacterCombat(id, characterCombat, tx, timing, character));
  } finally {
    const elapsedMs = Math.round(performance.now() - timing.startedAt);
    if (elapsedMs >= 1_000) console.info('Character combat save timing', {
      elapsedMs, writeMs: timing.writeStartedAt === undefined ? undefined : Math.round(performance.now() - timing.writeStartedAt),
      submittedManeuvers: characterCombat.maneuvers.length, operations: timing.operations,
    });
  }
}

type CombatSaveTiming = { startedAt: number; writeStartedAt?: number; operations?: Record<string, RelationOperationCounts> };

async function saveCharacterCombat(id: string, characterCombat: CombatDto, db: Prisma.TransactionClient,
  timing: CombatSaveTiming, guardedCharacter: CharacterMembershipSnapshot)
{
  const idsOnCharacter = guardedCharacter;

  const modesSelect = { ...perkSaveSelect, effects: true, simulatable: true, unsupportedReason: true } as const;
  const castableSelect = { ...perkSaveSelect, castTime: true, cooldown: true } as const;
  const idsWhere = (items: { id: string }[]) => ({ id: { in: [...new Set(items.map(item => item.id))] } });
  const storedManeuvers = characterCombat.maneuvers.length === 0 ? [] : await db.maneuver.findMany({
    where: idsWhere(characterCombat.maneuvers), select: { ...modesSelect, castTime: true, cooldown: true },
  });
  const storedStances = characterCombat.stances.length === 0 ? [] : await db.stance.findMany({ where: idsWhere(characterCombat.stances), select: modesSelect });
  const storedStates = characterCombat.states.length === 0 ? [] : await db.state.findMany({ where: idsWhere(characterCombat.states), select: modesSelect });
  const spellEntities = characterCombat.powers.flatMap(power => power.spells).map(toSpellPersistenceModel);
  const storedSpells = spellEntities.length === 0 ? [] : await db.spell.findMany({
    where: idsWhere(spellEntities), select: { ...castableSelect, costBase: true, costScalingMode: true, costScalingValue: true, costRounding: true },
  });
  const plans = {
    maneuvers: changedRelations(idsOnCharacter.maneuversIds ?? [], characterCombat.maneuvers.map(toCastablePersistenceModel), storedManeuvers),
    stances: changedRelations(idsOnCharacter.stancesIds ?? [], characterCombat.stances, storedStances),
    states: changedRelations(idsOnCharacter.statesIds ?? [], characterCombat.states, storedStates),
    spells: changedRelations(idsOnCharacter.spellsIds ?? [], spellEntities,
      storedSpells.map(spell => ({ ...spell, ...toSpellCostPersistence(fromSpellCostPersistence(spell)) }))),
  };
  
  // Power specifications - just collect the IDs from powers
  const powerSpecificationIds = [...new Set(characterCombat.powers.map(power => power.powerSpecificationId))];

  const characterCombatPersistenceModel = toCharacterCombatPersistenceModel
  (
    characterCombat, 
    idsOnCharacter.stancesIds ?? [], [], idsOnCharacter.statesIds ?? [], [],
    idsOnCharacter.maneuversIds ?? [], [], idsOnCharacter.spellsIds ?? [], [],
    idsOnCharacter.powerSpecificationsIds ?? [], []
  );

  for (const kind of ['maneuvers', 'stances', 'states', 'spells'] as const) {
    if (plans[kind].payload) Object.assign(characterCombatPersistenceModel, { [kind]: plans[kind].payload });
    else delete characterCombatPersistenceModel[kind];
  }
  timing.operations = Object.fromEntries(Object.entries(plans).map(([kind, plan]) => [kind, plan.counts]));
  const existingSpecifications = new Set(idsOnCharacter.powerSpecificationsIds ?? []);
  const specificationsToConnect = powerSpecificationIds.filter(id => !existingSpecifications.has(id));
  if (specificationsToConnect.length > 0) characterCombatPersistenceModel.powerSpecifications = { connect: specificationsToConnect.map(id => ({ id })) };
  else delete characterCombatPersistenceModel.powerSpecifications;

  try {
    timing.writeStartedAt = performance.now();
    const updatedCharacter = await db.character.update({
      where: { id },
      data: characterCombatPersistenceModel,
      select: membershipSnapshotSelect,
    });
    return membershipSnapshot(updatedCharacter);
  } catch (error) { return rethrowMembershipConflict(error); }
}

export async function updateCharacterBuffs(id: string, characterBuffs: BuffsDto, apiKey: string)
  : Promise<boolean>
{
  return withCharacterAccess(id, apiKey, async tx => {
    await tx.character.update({ where: { id }, data: toCharacterBuffsPersistenceModel(characterBuffs) });
    return true;
  });
}

//Private functions

/**
 * Fetches existing entity IDs that are not already present in the existingIds array.
 * @param entities - Array of entities to check.
 * @param existingIds - Array of existing entity IDs.
 * @param prismaModel - Prisma model with a findMany method.
 * @returns Promise resolving to an array of existing entity IDs.
 */
async function fetchExistingEntityIds<T extends { id: string }>
(
  prismaModel: { findMany: (args: { where: { id: { in: string[] } }; select: { id: true } }) => Promise<{ id: string }[]> },
  entities: T[],
  existingIds: string[]
)
  : Promise<string[]>
{
  const idsToCheck = entities.map(entity => entity.id).filter(id => !existingIds.includes(id));
  
  if (idsToCheck.length === 0) return [];

  const existingEntitiesResponse = await prismaModel.findMany
  ({
    where: { id: { in: idsToCheck } },
    select: { id: true }
  });

  return existingEntitiesResponse.map((entity: { id: string }) => entity.id);
}
