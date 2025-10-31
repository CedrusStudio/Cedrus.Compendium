import { Castable } from '@/domain/characters/Castable';
import { Prisma } from '@prisma/client';
import { Perk } from '@/domain/characters/Perk';
import { toEntity } from '@/persistence/mappings/entityMapping';

type PerkPersistenceParams = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string | null;
  price: number;
};

export function toPerk<TPerk extends Perk>(perkPersistenceModel: PerkPersistenceParams): TPerk
{
  return {
    ...toEntity(perkPersistenceModel),

    grade: perkPersistenceModel.grade,
    description: perkPersistenceModel.description,
    requirements: perkPersistenceModel.requirements ?? undefined,
    price: perkPersistenceModel.price,
  } as TPerk;
}

type CastablePerkModel = Prisma.CharacterGetPayload<{select: { maneuvers: true }}>['maneuvers'][number];

export function toCastablePerk<TCastablePerk extends (Perk & Castable)>(castablePersistenceModel: CastablePerkModel): TCastablePerk
{
  return {
    ...toPerk<TCastablePerk>(castablePersistenceModel),
    castTime: castablePersistenceModel.castTime,
    cooldown: castablePersistenceModel.cooldown
  };
}