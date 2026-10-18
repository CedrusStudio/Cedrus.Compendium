import 'server-only';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { membershipLimits, type MembershipKind } from '@/domain/characters/characterMembership';
import type { MembershipWriteResult, MembershipPatch } from './characterMembershipResult';
import { isCharacterVisible } from '@/persistence/characterVisibility';
import { CharacterMembershipError, CharacterMembershipConflictError } from './characterMembershipErrors';

function findEntity(tx: Prisma.TransactionClient, kind: MembershipKind, id: string) {
  const args = { where: { id }, select: { id: true } } as const;
  switch (kind) {
    case 'maneuvers': return tx.maneuver.findUnique(args);
    case 'perks': return tx.perk.findUnique(args);
    case 'stances': return tx.stance.findUnique(args);
    case 'states': return tx.state.findUnique(args);
  }
}

/** Snapshot reads and nested writes share a transaction, including visibility and limits. */
export async function setCharacterMembership(characterId: string, kind: MembershipKind, entityId: string, present: boolean, apiKey: string): Promise<MembershipWriteResult> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async tx => {
        const character = await tx.character.findUnique({
          where: { id: characterId },
          select: { id: true, apiKeys: true, maneuversIds: true, perksIds: true, stancesIds: true, statesIds: true },
        });
        if (!character || !isCharacterVisible(character.apiKeys, apiKey)) throw new CharacterMembershipError(404, 'Postać jest niedostępna.');
        const ids = character[`${kind}Ids`] ?? [];
        const current = ids.includes(entityId);
        // Validate additions even for an existing link, so a dangling link is not a success.
        const entity = present || current ? await findEntity(tx, kind, entityId) : null;
        if (present && !entity) throw new CharacterMembershipError(404, 'Element jest niedostępny.');
        const result = { characterId, kind, entityId, present, changed: current !== present };
        if (current !== present && present && ids.length >= membershipLimits[kind]) {
          throw new CharacterMembershipError(422, 'Osiągnięto limit elementów tej kategorii na postaci.');
        }
        // Prisma disconnect ignores missing target rows. An orphan has no reverse
        // record to maintain, so repair only that scalar ID array in the same transaction.
        const data = !present && !entity
          ? { [`${kind}Ids`]: { set: ids.filter(id => id !== entityId) } } as Prisma.CharacterUncheckedUpdateInput
          : { [kind]: { [present ? 'connect' : 'disconnect']: { id: entityId } } } as Prisma.CharacterUpdateInput;
        // Hydrate only the changed category as part of the authoritative write,
        // avoiding a second HTTP request for all twelve relations afterwards.
        const select = {
          maneuversIds: true, perksIds: true, stancesIds: true, statesIds: true,
          maneuvers: kind === 'maneuvers', perks: kind === 'perks',
          stances: kind === 'stances', states: kind === 'states',
        } as const;
        const saved = current === present
          ? await tx.character.findUniqueOrThrow({ where: { id: characterId }, select })
          : await tx.character.update({ where: { id: characterId }, data, select });
        const characterPatch: MembershipPatch = {
          [kind]: saved[kind], [`${kind}Ids`]: saved[`${kind}Ids`],
        };
        return { ...result, characterPatch };
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034') throw error;
      if (attempt === 2) throw new CharacterMembershipConflictError();
    }
  }
  throw new CharacterMembershipConflictError();
}
