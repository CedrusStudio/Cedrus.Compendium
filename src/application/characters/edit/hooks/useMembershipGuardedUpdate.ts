import { useRef } from 'react';
import type { Character } from '@/domain/characters/Character';
import type { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';
import type { DetailsDto } from '@/persistence/schemas/characters/headerSchema';
import client from '@/infrastructure/clients/charactersClient';

/** Never replace the original snapshot on a background refetch of an open draft. */
export function useMembershipGuardedUpdate(character: Character, section: 'combat' | 'details') {
  const snapshot = useRef(character.membershipSnapshot);
  return async (id: string, data: CombatDto | DetailsDto) => {
    if (!snapshot.current) throw new Error('Odśwież postać przed zapisem.');
    const { perksIds, ...combatIds } = snapshot.current;
    const expected = section === 'details' ? { perksIds } : combatIds;
    snapshot.current = await client.updateMembershipSection(id, section, data, expected);
  };
}
