import { Prisma } from '@prisma/client';
import type { CharacterMembershipSnapshot } from '@/domain/characters/characterMembership';
import { CharacterMembershipConflictError, CharacterMembershipError } from './characterMembershipErrors';
import { isCharacterVisible } from '@/persistence/characterVisibility';
import prisma from '@/lib/prisma';

/** Mongo transaction snapshots also handle legacy records whose ID arrays are missing. */
export async function withMembershipSnapshot(
  id: string, expected: Partial<CharacterMembershipSnapshot>, apiKey: string,
  write: (tx: Prisma.TransactionClient) => Promise<CharacterMembershipSnapshot | false>,
) {
  try {
    return await prisma.$transaction(async tx => {
      const character = await tx.character.findUnique({
        where: { id },
        select: { apiKeys: true, perksIds: true, maneuversIds: true, stancesIds: true, statesIds: true, spellsIds: true, powerSpecificationsIds: true },
      });
      if (!character || !isCharacterVisible(character.apiKeys, apiKey)) throw new CharacterMembershipError(404, 'Character not found');
      for (const [field, ids] of Object.entries(expected)) {
        const current = character[field as keyof CharacterMembershipSnapshot] ?? [];
        if (JSON.stringify(current) !== JSON.stringify(ids)) throw new CharacterMembershipConflictError();
      }
      return write(tx);
    });
  } catch (error) { return rethrowMembershipConflict(error); }
}

export function rethrowMembershipConflict(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2025', 'P2034'].includes(error.code)) {
    throw new CharacterMembershipConflictError();
  }
  throw error;
}
