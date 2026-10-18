import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMembershipGuardedUpdate } from '../useMembershipGuardedUpdate';
import { membershipSnapshot } from '@/domain/characters/characterMembership';
import type { Character } from '@/domain/characters/Character';
import type { DetailsDto } from '@/persistence/schemas/characters/headerSchema';
vi.mock('@/infrastructure/clients/charactersClient', () => ({ default: { updateMembershipSection: vi.fn() } }));
import client from '@/infrastructure/clients/charactersClient';

describe('guarded editor snapshots', () => {
  it('keeps the original snapshot across background refetches and advances it only after a successful save', async () => {
    const original = { id: 'a', membershipSnapshot: membershipSnapshot({ perksIds: ['old'] }) } as Character;
    const updated = { ...original, membershipSnapshot: membershipSnapshot({ perksIds: ['external'] }) };
    const next = membershipSnapshot({ perksIds: ['saved'] });
    vi.mocked(client.updateMembershipSection).mockResolvedValue(next);
    const { result, rerender } = renderHook(({ character }) => useMembershipGuardedUpdate(character, 'details'), { initialProps: { character: original } });
    rerender({ character: updated });
    await act(async () => result.current('a', {} as DetailsDto));
    expect(client.updateMembershipSection).toHaveBeenLastCalledWith('a', 'details', {}, { perksIds: ['old'] });
    await act(async () => result.current('a', {} as DetailsDto));
    expect(client.updateMembershipSection).toHaveBeenLastCalledWith('a', 'details', {}, { perksIds: ['saved'] });
  });
  it('does not replace the snapshot after a conflict', async () => {
    const character = { id: 'a', membershipSnapshot: membershipSnapshot({ perksIds: ['old'] }) } as Character;
    vi.mocked(client.updateMembershipSection).mockRejectedValue(new Error('Conflict'));
    const { result } = renderHook(() => useMembershipGuardedUpdate(character, 'details'));
    await expect(result.current('a', {} as DetailsDto)).rejects.toThrow('Conflict');
    await expect(result.current('a', {} as DetailsDto)).rejects.toThrow('Conflict');
    expect(client.updateMembershipSection).toHaveBeenLastCalledWith('a', 'details', {}, { perksIds: ['old'] });
  });
});
