import { Race } from '@/domain/Race';
import { Prisma } from '@prisma/client';
import { toEntity } from '@/persistence/mappings/entityMapping';

export type RaceModel = Prisma.RaceGetPayload<Record<string, never>>;

export function toRace(racePersistenceModel: RaceModel): Race
{
  return {
    ...toEntity(racePersistenceModel),
    description: racePersistenceModel.description,
    tags: racePersistenceModel.tags,
    strengthModifier: racePersistenceModel.strengthModifier,
    dexterityModifier: racePersistenceModel.dexterityModifier,
    constitutionModifier: racePersistenceModel.constitutionModifier,
    mindModifier: racePersistenceModel.mindModifier,
    charismaModifier: racePersistenceModel.charismaModifier,
    spellbornModifier: racePersistenceModel.spellbornModifier,
  };
}
