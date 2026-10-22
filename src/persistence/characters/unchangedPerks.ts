import { isDeepStrictEqual } from 'node:util';
import type { PerkDto } from '@/persistence/schemas/characters/perkSchema';
import type { Prisma } from '@prisma/client';

export const perkSaveSelect = {
  id: true, name: true, grade: true, description: true, price: true,
  tags: true, structuredRequirements: true, replaces: true,
} as const;
type StoredPerk = Prisma.PerkGetPayload<{ select: typeof perkSaveSelect }>;

/** Undefined optional DTO fields are not writes; legacy null/missing lists are empty. */
export function perkHasChanges(incoming: PerkDto, stored: StoredPerk): boolean {
  return incoming.name !== stored.name || incoming.grade !== stored.grade
    || incoming.description !== stored.description || incoming.price !== stored.price
    || !isDeepStrictEqual(incoming.tags, stored.tags ?? [])
    || (incoming.structuredRequirements !== undefined
      && !isDeepStrictEqual(incoming.structuredRequirements, stored.structuredRequirements ?? []))
    || (incoming.replaces !== undefined && !isDeepStrictEqual(incoming.replaces, stored.replaces ?? []));
}
