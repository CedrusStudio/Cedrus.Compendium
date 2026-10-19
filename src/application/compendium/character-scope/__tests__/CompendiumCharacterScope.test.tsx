import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_KEY_STORAGE_KEY, API_KEY_CHANGED_EVENT } from '@/lib/apiKeyStorage';
import { toCharacterHeaderPersistenceModel } from '@/persistence/mappings/characterMapping';
import { membershipSnapshot } from '@/domain/characters/characterMembership';
import { CompendiumCharacterScopeProvider, characterScopeStorageKey, useOptionalCompendiumCharacterScope } from '../CompendiumCharacterScopeProvider';
import { CharacterMembershipAction } from '../CharacterMembershipAction';
import { CharacterOwnedFilter, useCharacterOwnedFilter } from '../CharacterOwnedFilter';
import RequirementsView from '@/application/common/RequirementsView';
import { useMainCharacter } from '@/application/common/requirements/useMainCharacter';

vi.mock('@/application/common/requirements/useMainCharacter', () => ({
  useMainCharacter: vi.fn((enabled = true) => enabled ? { name: 'Main', characteristics: { strength: { value: 10, bonus: 0, testBonus: 0 } } } : undefined),
}));

const transport = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/infrastructure/clients/searchClient', () => ({ default: { searchById: transport.get } }));
vi.mock('@/infrastructure/clients/charactersClient', () => ({ default: { setMembership: transport.save } }));
vi.mock('sonner', () => ({ toast: { success: transport.success, error: transport.error } }));

function fixture(id: string, ids: string[] = []) {
  return {
    ...toCharacterHeaderPersistenceModel({ name: id, shortName: id, description: 'Test', tags: [] }),
    ...membershipSnapshot({}), id, apiKeys: [], race: null,
    maneuversIds: ids, maneuvers: ids.map(id => ({ id, name: 'Młyniec', grade: 2, price: 1, tags: [], description: 'Test', castTime: 'Standardowa', cooldown: 0 })),
    stances: [], states: [], perks: [], spells: [], powerSpecifications: [],
    weapons: [], armors: [], shields: [], inventory: [], mounts: [],
  };
}
function Harness() {
  const scope = useOptionalCompendiumCharacterScope()!;
  const owned = useCharacterOwnedFilter('maneuvers');
  return <>
    <button onClick={() => scope.selectCharacter('Aldara')}>Select A</button>
    <button onClick={() => scope.selectCharacter('Borin')}>Select B</button>
    <button onClick={() => scope.selectCharacter()}>Clear</button>
    <button onClick={scope.retry}>Retry</button>
    <output data-testid="character">{scope.character?.name ?? 'none'}</output>
    <output data-testid="filter">{owned.filter ? JSON.stringify(owned.filter.values) : 'all'}</output>
    <output data-testid="error">{String(scope.isError)}</output>
    <CharacterOwnedFilter kind="maneuvers" />
    <CharacterMembershipAction kind="maneuvers" entityId="maneuver" label="Młyniec 2" />
    <RequirementsView useCompendiumCharacter entityWithRequirements={{ structuredRequirements: [{ kind: 'ranked', group: 'characteristics', targetKey: 'strength', value: 2 }] }} />
  </>;
}
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  return { client, ...render(<StrictMode><QueryClientProvider client={client}><CompendiumCharacterScopeProvider><Harness /></CompendiumCharacterScopeProvider></QueryClientProvider></StrictMode>) };
}
const defer = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; };

describe('compendium shared character scope', () => {
  let characters: Record<string, ReturnType<typeof fixture>>;
  beforeEach(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem(API_KEY_STORAGE_KEY, 'valid');
    characters = { Aldara: fixture('Aldara'), Borin: fixture('Borin') };
    transport.get.mockReset().mockImplementation(async (id: string) => characters[id] ?? null);
    transport.save.mockReset().mockImplementation(async (id: string, _kind: string, entityId: string, present: boolean) => {
      characters[id] = fixture(id, present ? [entityId] : []);
      return { characterId: id, changed: true };
    });
    transport.success.mockClear(); transport.error.mockClear();
  });

  it('starts unselected, selecting does not filter, and actions refresh authoritative status', async () => {
    const user = userEvent.setup(); setup();
    expect(screen.getByTestId('character')).toHaveTextContent('none');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    await user.click(screen.getByText('Select A'));
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Aldara'));
    expect(screen.getByRole('checkbox')).toBeEnabled();
    expect(screen.getByTestId('filter')).toHaveTextContent('all');
    await user.click(screen.getByRole('button', { name: /Dodaj do postaci/ }));
    await screen.findByText('Na postaci');
    expect(transport.save).toHaveBeenCalledWith('Aldara', 'maneuvers', 'maneuver', true);
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByTestId('filter')).toHaveTextContent('["maneuver"]');
    await user.click(screen.getByRole('button', { name: /Usuń z postaci/ }));
    await waitFor(() => expect(screen.queryByText('Na postaci')).not.toBeInTheDocument());
    expect(screen.getByText('Ta postać nie ma elementów w tej kategorii.')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toHaveFocus();
    await user.click(screen.getByText('Clear'));
    expect(screen.getByTestId('filter')).toHaveTextContent('all');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('locks repeated clicks and a completion for A cannot change selected B', async () => {
    const user = userEvent.setup(); setup();
    const pending = defer<unknown>();
    transport.save.mockReturnValue(pending.promise);
    await user.click(screen.getByText('Select A'));
    const add = await screen.findByRole('button', { name: /Dodaj do postaci/ });
    await user.dblClick(add);
    expect(transport.save).toHaveBeenCalledTimes(1);
    expect(add).toBeDisabled();
    await user.click(screen.getByText('Select B'));
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Borin'));
    characters.Aldara = fixture('Aldara', ['maneuver']);
    await act(async () => pending.resolve({ changed: true }));
    expect(screen.getByTestId('character')).toHaveTextContent('Borin');
    expect(screen.queryByText('Na postaci')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dodaj do postaci.*Borin/ })).toBeEnabled();
  });

  it('uses the confirmed category from the write response without fetching the full character again', async () => {
    const user = userEvent.setup(); setup();
    await user.click(screen.getByText('Select A'));
    await screen.findByRole('button', { name: /Dodaj do postaci/ });
    const readsBefore = transport.get.mock.calls.length;
    transport.save.mockImplementation(async (_id, _kind, entityId, present) => {
      const next = fixture('Aldara', present ? [entityId] : []);
      return { characterId: 'Aldara', kind: 'maneuvers', entityId, present, changed: true,
        characterPatch: { maneuvers: next.maneuvers, maneuversIds: next.maneuversIds } };
    });
    await user.click(screen.getByRole('button', { name: /Dodaj do postaci/ }));
    await screen.findByText('Na postaci');
    await waitFor(() => expect(screen.getByRole('button', { name: /Usuń z postaci/ })).toBeEnabled());
    expect(transport.get).toHaveBeenCalledTimes(readsBefore);
    await user.click(screen.getByRole('button', { name: /Usuń z postaci/ }));
    await waitFor(() => expect(screen.queryByText('Na postaci')).not.toBeInTheDocument());
    expect(transport.get).toHaveBeenCalledTimes(readsBefore);
  });

  it('does not wait for unrelated queries before showing a confirmed change and releasing the lock', async () => {
    const user = userEvent.setup(); const { client } = setup();
    await user.click(screen.getByText('Select A'));
    await screen.findByRole('button', { name: /Dodaj do postaci/ });
    const background = defer<void>();
    vi.spyOn(client, 'invalidateQueries').mockReturnValue(background.promise);
    const next = fixture('Aldara', ['maneuver']);
    transport.save.mockResolvedValue({ characterId: 'Aldara', kind: 'maneuvers', entityId: 'maneuver', present: true, changed: true,
      characterPatch: { maneuvers: next.maneuvers, maneuversIds: next.maneuversIds } });
    await user.click(screen.getByRole('button', { name: /Dodaj do postaci/ }));
    await screen.findByText('Na postaci');
    await waitFor(() => expect(screen.getByRole('button', { name: /Usuń z postaci/ })).toBeEnabled());
    expect(transport.success).toHaveBeenCalled();
    await act(async () => background.resolve());
  });

  it('evaluates requirements against the selected character and never gates adding an unmet entry', async () => {
    const user = userEvent.setup(); setup();
    expect(screen.getByTitle('Main: Spełnia wymaganie')).toBeInTheDocument();
    await user.click(screen.getByText('Select A'));
    await screen.findByTitle('Aldara: Nie spełnia wymagania');
    expect(useMainCharacter).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('button', { name: /Dodaj do postaci/ })).toBeEnabled();
    await user.click(screen.getByText('Clear'));
    expect(screen.getByTitle('Main: Spełnia wymaganie')).toBeInTheDocument();
  });

  it('clears an unavailable selection instead of showing an empty owned character', async () => {
    transport.get.mockResolvedValue(null);
    const user = userEvent.setup(); setup();
    await user.click(screen.getByText('Select A'));
    await waitFor(() => expect(transport.error).toHaveBeenCalledWith(expect.stringContaining('Wybór został wyczyszczony')));
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByTestId('filter')).toHaveTextContent('all');
  });

  it('clears selection on API key change and does not publish a stale mutation result', async () => {
    const user = userEvent.setup(); setup();
    const pending = defer<unknown>(); transport.save.mockReturnValue(pending.promise);
    await user.click(screen.getByText('Select A'));
    await user.click(await screen.findByRole('button', { name: /Dodaj do postaci/ }));
    await act(async () => { localStorage.setItem(API_KEY_STORAGE_KEY, 'different'); window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT)); });
    expect(screen.getByTestId('character')).toHaveTextContent('none');
    await act(async () => pending.resolve({ changed: true }));
    expect(screen.getByTestId('character')).toHaveTextContent('none');
    expect(transport.success).not.toHaveBeenCalled();
  });

  it('distinguishes a saved change with refresh failure and blocks changes until retry', async () => {
    const user = userEvent.setup(); setup();
    await user.click(screen.getByText('Select A'));
    await screen.findByRole('button', { name: /Dodaj do postaci/ });
    transport.save.mockImplementation(async () => { transport.get.mockRejectedValue(new Error('Offline')); return { changed: true }; });
    await user.click(screen.getByRole('button', { name: /Dodaj do postaci/ }));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('true'));
    expect(screen.getByRole('button', { name: /Dodaj do postaci/ })).toBeDisabled();
    expect(transport.error).toHaveBeenCalledWith(expect.stringContaining('Zmiana została zapisana'));
    transport.get.mockResolvedValue(fixture('Aldara', ['maneuver']));
    await user.click(screen.getByText('Retry'));
    await screen.findByText('Na postaci');
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('false'));
  });

  it('restores a session in StrictMode without storing the raw key', async () => {
    // WebCrypto is optional in jsdom; use the real Node implementation for the storage key.
    const { webcrypto } = await import('node:crypto');
    vi.stubGlobal('crypto', webcrypto);
    const key = await characterScopeStorageKey('valid');
    expect(key).not.toContain('valid');
    sessionStorage.setItem(key, JSON.stringify({ id: 'Aldara', onlyOwned: true }));
    setup();
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Aldara'));
    expect(screen.getByRole('checkbox')).toBeChecked();
    vi.unstubAllGlobals();
  });
});
