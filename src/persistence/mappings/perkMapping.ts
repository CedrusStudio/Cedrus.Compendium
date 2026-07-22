import { Castable } from '@/domain/characters/Castable';
import { Prisma } from '@prisma/client';
import { Perk } from '@/domain/characters/Perk';
import type { Effect } from '@/domain/combat-lab/effects/Effect';
import { toEntity } from '@/persistence/mappings/entityMapping';

type PerkPersistenceParams = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string[];
  price: number;
  tags: string[];
};

export function toPerk<TPerk extends Perk>(perkPersistenceModel: PerkPersistenceParams): TPerk
{
  return {
    ...toEntity(perkPersistenceModel),

    grade: perkPersistenceModel.grade,
    description: perkPersistenceModel.description,
    requirements: perkPersistenceModel.requirements ?? [],
    price: perkPersistenceModel.price,
    tags: perkPersistenceModel.tags
  } as TPerk;
}

// Minimal structural shape shared by every castable perk (maneuvers AND spells).
// NOT derived from the maneuver payload — that now carries maneuver-only fields
// (effects/simulatable/unsupportedReason) which spells lack. Combat Lab fields
// are read defensively via a cast inside `toCastablePerk`.
type CastablePerkModel = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string[];
  price: number;
  tags: string[];
  castTime: string;
  cooldown: number | null;
};

export function toCastablePerk<TCastablePerk extends (Perk & Castable)>(castablePersistenceModel: CastablePerkModel): TCastablePerk
{
  // Combat Lab fields are read defensively: the generated Prisma type may lag
  // behind the schema until `prisma generate` runs, and legacy rows omit them.
  const extra = castablePersistenceModel as unknown as
  {
    effects?: unknown;
    simulatable?: boolean | null;
    unsupportedReason?: string | null;
  };

  return {
    ...toPerk<TCastablePerk>(castablePersistenceModel),
    castTime: castablePersistenceModel.castTime,
    cooldown: castablePersistenceModel.cooldown,
    ...(Array.isArray(extra.effects) ? { effects: extra.effects as Effect[] } : {}),
    ...(extra.simulatable === null || extra.simulatable === undefined ? {} : { simulatable: extra.simulatable }),
    ...(extra.unsupportedReason ? { unsupportedReason: extra.unsupportedReason } : {}),
  };
}