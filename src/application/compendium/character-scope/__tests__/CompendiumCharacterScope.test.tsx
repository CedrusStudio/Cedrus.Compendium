import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
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
const profiles = vi.hoisted(() => ({ mainByKey: {} as Record<string, string | undefined>, loaded: true }));
vi.mock('@/common/hooks/usePersonalization', () => ({
  usePersonalization: () => ({
    profile: { mainCharacterId: profiles.mainByKey[localStorage.getItem(API_KEY_STORAGE_KEY) ?? 'public'] },
    isLoaded: profiles.loaded,
  }),
}));
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
    <output data-testid="selected-id">{scope.selectedCharacterId ?? 'none'}</output>
    <output data-testid="filter">{owned.filter ? JSON.stringify(owned.filter.values) : 'all'}</output>
    <output data-testid="error">{String(scope.isError)}</output>
    <CharacterOwnedFilter kind="maneuvers" />
    <CharacterMembershipAction kind="maneuvers" entityId="maneuver" label="Młyniec 2" />
    <RequirementsView useCompendiumCharacter entityWithRequirements={{ structuredRequirements: [{ kind: 'ranked', group: 'characteristics', targetKey: 'strength', value: 2 }] }} />
  </>;
}
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  const tree = () => <StrictMode><QueryClientProvider client={client}><CompendiumCharacterScopeProvider><Harness /></CompendiumCharacterScopeProvider></QueryClientProvider></StrictMode>;
  const result = render(tree());
  return { client, ...result, refresh: () => result.rerender(tree()) };
}
const defer = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; };

describe('compendium shared character scope', () => {
  let characters: Record<string, ReturnType<typeof fixture>>;
  beforeEach(() => {
    vi.stubGlobal('crypto', webcrypto);
    profiles.mainByKey = {};
    profiles.loaded = true;
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
  afterEach(() => vi.unstubAllGlobals());

  it('defaults to the current API key main character without enabling owned filtering or writing membership', async () => {
    profiles.mainByKey.valid = 'Aldara';
    setup();
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Aldara'));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByTestId('filter')).toHaveTextContent('all');
    expect(transport.save).not.toHaveBeenCalled();
  });

  it('does not default to a profile main character without an API key', async () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    profiles.mainByKey.public = 'Aldara';
    setup();
    await waitFor(() => expect(sessionStorage.getItem('compendium-character-scope:public')).not.toBeNull());
    expect(screen.getByTestId('selected-id')).toHaveTextContent('none');
    expect(transport.get).not.toHaveBeenCalled();
  });

  it('waits for the profile and initializes even when an older empty session exists', async () => {
    profiles.mainByKey.valid = 'Aldara';
    profiles.loaded = false;
    const key = await characterScopeStorageKey('valid');
    sessionStorage.setItem(key, JSON.stringify({ onlyOwned: false }));
    const { refresh } = setup();
    expect(screen.getByTestId('selected-id')).toHaveTextContent('none');
    profiles.loaded = true;
    refresh();
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Aldara'));
  });

  it('restores a saved character and owned filter before considering the main character', async () => {
    profiles.mainByKey.valid = 'Aldara';
    sessionStorage.setItem(await characterScopeStorageKey('valid'), JSON.stringify({ id: 'Borin', onlyOwned: true }));
    setup();
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Borin'));
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(transport.get.mock.calls.map(([id]) => id)).not.toContain('Aldara');
  });

  it('keeps a manual replacement after remount and does not change the main character', async () => {
    profiles.mainByKey.valid = 'Aldara';
    const user = userEvent.setup();
    const { unmount } = setup();
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Aldara'));
    await user.click(screen.getByText('Select B'));
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Borin'));
    const key = await characterScopeStorageKey('valid');
    await waitFor(() => expect(JSON.parse(sessionStorage.getItem(key)!).id).toBe('Borin'));
    unmount();
    setup();
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Borin'));
    expect(profiles.mainByKey.valid).toBe('Aldara');
  });

  it('remembers explicitly clearing the default character after remount', async () => {
    profiles.mainByKey.valid = 'Aldara';
    const user = userEvent.setup();
    const { unmount } = setup();
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Aldara'));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByText('Clear'));
    const key = await characterScopeStorageKey('valid');
    await waitFor(() => expect(JSON.parse(sessionStorage.getItem(key)!)).toEqual({ onlyOwned: false, explicitlyCleared: true }));
    unmount();
    const reads = vi.spyOn(Storage.prototype, 'getItem');
    setup();
    await waitFor(() => expect(reads).toHaveBeenCalledWith(key));
    expect(screen.getByTestId('selected-id')).toHaveTextContent('none');
    expect(screen.getByTestId('filter')).toHaveTextContent('all');
  });

  it.each(['Select B', 'Clear'])('does not override %s when a delayed profile arrives', async action => {
    profiles.mainByKey.valid = 'Aldara';
    profiles.loaded = false;
    const user = userEvent.setup();
    const { refresh } = setup();
    await user.click(screen.getByText(action));
    profiles.loaded = true;
    refresh();
    expect(screen.getByTestId('selected-id')).toHaveTextContent(action === 'Clear' ? 'none' : 'Borin');
    expect(transport.get.mock.calls.map(([id]) => id)).not.toContain('Aldara');
  });

  it('initializes the new key main character and ignores an old character response', async () => {
    profiles.mainByKey = { valid: 'Aldara', different: 'Borin' };
    const pending = defer<ReturnType<typeof fixture>>();
    transport.get.mockImplementation(async (id: string) => id === 'Aldara' ? pending.promise : characters[id]);
    const user = userEvent.setup();
    setup();
    await waitFor(() => expect(transport.get.mock.calls.map(([id]) => id)).toContain('Aldara'));
    await act(async () => { localStorage.setItem(API_KEY_STORAGE_KEY, 'different'); window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT)); });
    expect(screen.getByTestId('selected-id')).not.toHaveTextContent('Aldara');
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Borin'));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    await act(async () => pending.resolve(characters.Aldara));
    expect(screen.getByTestId('character')).toHaveTextContent('Borin');
    await user.click(screen.getByRole('checkbox'));
    await act(async () => { localStorage.setItem(API_KEY_STORAGE_KEY, 'valid'); window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT)); });
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Aldara'));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('clears an unavailable default once, including after remount', async () => {
    profiles.mainByKey.valid = 'missing';
    const { unmount } = setup();
    await waitFor(() => expect(transport.error).toHaveBeenCalled());
    const key = await characterScopeStorageKey('valid');
    await waitFor(() => expect(JSON.parse(sessionStorage.getItem(key)!).explicitlyCleared).toBe(true));
    const calls = transport.get.mock.calls.length;
    unmount();
    const reads = vi.spyOn(Storage.prototype, 'getItem');
    setup();
    await waitFor(() => expect(reads).toHaveBeenCalledWith(key));
    expect(screen.getByTestId('selected-id')).toHaveTextContent('none');
    expect(transport.get).toHaveBeenCalledTimes(calls);
  });

  it('retains an errored default for retry instead of treating it as unavailable', async () => {
    profiles.mainByKey.valid = 'Aldara';
    transport.get.mockRejectedValue(new Error('Offline'));
    const user = userEvent.setup(); setup();
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('true'));
    expect(screen.getByTestId('selected-id')).toHaveTextContent('Aldara');
    transport.get.mockResolvedValue(characters.Aldara);
    await user.click(screen.getByText('Retry'));
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Aldara'));
  });

  it('still selects the main character if storage key hashing is unavailable', async () => {
    profiles.mainByKey.valid = 'Aldara';
    vi.spyOn(crypto.subtle, 'digest').mockRejectedValue(new Error('Unavailable'));
    setup();
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Aldara'));
  });

  it('does not restore a stored character over a manual choice made while hashing is pending', async () => {
    profiles.mainByKey.valid = 'Aldara';
    const key = await characterScopeStorageKey('valid');
    sessionStorage.setItem(key, JSON.stringify({ id: 'Aldara', onlyOwned: true }));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('valid'));
    const pending = defer<ArrayBuffer>();
    vi.spyOn(crypto.subtle, 'digest').mockReturnValue(pending.promise);
    const user = userEvent.setup(); setup();
    await user.click(screen.getByText('Select B'));
    await act(async () => pending.resolve(digest));
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Borin'));
    await waitFor(() => expect(JSON.parse(sessionStorage.getItem(key)!).id).toBe('Borin'));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
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
    const key = await characterScopeStorageKey('valid');
    expect(key).not.toContain('valid');
    sessionStorage.setItem(key, JSON.stringify({ id: 'Aldara', onlyOwned: true }));
    setup();
    await waitFor(() => expect(screen.getByTestId('character')).toHaveTextContent('Aldara'));
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});
