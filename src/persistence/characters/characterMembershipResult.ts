import type { MembershipKind, MembershipResult } from '@/domain/characters/characterMembership';
import type { CharacterWithRelations } from '@/persistence/mappings/characterMapping';

type MembershipField = MembershipKind | `${MembershipKind}Ids`;
export type MembershipPatch = Partial<Pick<CharacterWithRelations, MembershipField>>;
export type MembershipWriteResult = MembershipResult & { characterPatch?: MembershipPatch };

/** Only merge the confirmed category. Other sections retain their original snapshots. */
export function applyMembershipResult(character: CharacterWithRelations, result: MembershipWriteResult): CharacterWithRelations | undefined {
  if (character.id !== result.characterId) return undefined;
  const entries = result.characterPatch?.[result.kind];
  const ids = result.characterPatch?.[`${result.kind}Ids`];
  if (!entries || !ids) return undefined;
  return { ...character, [result.kind]: entries, [`${result.kind}Ids`]: ids };
}
