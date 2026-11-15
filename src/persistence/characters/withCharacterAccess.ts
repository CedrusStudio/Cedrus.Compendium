import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { isCharacterVisible } from '@/persistence/characterVisibility';
import { CharacterMembershipError } from './characterMembershipErrors';
import { characterTransactionOptions } from './characterTransactionOptions';
import { rethrowMembershipConflict } from './membershipSnapshot';

/** Read access and mutate the same character in one MongoDB transaction. */
export async function withCharacterAccess<T>(
  id: string,
  apiKey: string,
  write: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  try {
    return await prisma.$transaction(async tx => {
      const character = await tx.character.findUnique({ where: { id }, select: { apiKeys: true } });
      if (!character || !isCharacterVisible(character.apiKeys, apiKey)) {
        throw new CharacterMembershipError(404, 'Character not found');
      }
      return write(tx);
    }, characterTransactionOptions);
  } catch (error) {
    return rethrowMembershipConflict(error);
  }
}
