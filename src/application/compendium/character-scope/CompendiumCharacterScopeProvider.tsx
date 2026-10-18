"use client";

import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApiKey, getStoredApiKey } from '@/common/hooks/useApiKey';
import { useCharacterById } from '@/application/characters/hooks/useCharacterById';
import type { Character } from '@/domain/characters/Character';
import type { MembershipKind } from '@/domain/characters/characterMembership';
import charactersClient from '@/infrastructure/clients/charactersClient';
import { createCharacterByIdKey } from '@/persistence/cacheKeys';
import { displayedText as t } from '@/common/translations';
import type { CharacterWithRelations } from '@/persistence/mappings/characterMapping';
import { applyMembershipResult, type MembershipWriteResult } from '@/persistence/characters/characterMembershipResult';

type Selection = { id?: string; onlyOwned: boolean };
type CharacterScope = {
  character: Character | null;
  selectedCharacterId?: string;
  onlyOwned: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  apiKey: string | null;
  pendingCharacterId?: string;
  selectCharacter: (id?: string) => void;
  setOnlyOwned: (enabled: boolean) => void;
  retry: () => void;
  setMembership: (kind: MembershipKind, entityId: string, present: boolean, label: string) => Promise<void>;
};

const Context = createContext<CharacterScope | null>(null);
export const useOptionalCompendiumCharacterScope = () => useContext(Context);

export async function characterScopeStorageKey(apiKey: string | null) {
  if (!apiKey) return 'compendium-character-scope:public';
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey));
  return `compendium-character-scope:${Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function CompendiumCharacterScopeProvider({ children }: PropsWithChildren) {
  const { apiKey, isLoaded } = useApiKey();
  const access = isLoaded ? apiKey ?? 'public' : undefined;
  const [previousAccess, setPreviousAccess] = useState<string>();
  const [restore, setRestore] = useState(true);
  if (access !== undefined && previousAccess !== access) {
    if (previousAccess !== undefined) setRestore(false);
    setPreviousAccess(access);
  }
  // Remount synchronously on key changes: no render can expose the previous user's selection.
  return <ScopeSession key={isLoaded ? apiKey ?? 'public' : 'loading'} apiKey={apiKey} restore={restore} loaded={isLoaded}>{children}</ScopeSession>;
}

function ScopeSession({ apiKey, restore, loaded, children }: PropsWithChildren<{ apiKey: string | null; restore: boolean; loaded: boolean }>) {
  const [selection, setSelection] = useState<Selection>({ onlyOwned: false });
  const [storageKey, setStorageKey] = useState<string>();
  const restoreOnMount = useRef(restore);
  const touched = useRef(false);
  const active = useRef(true);
  const locks = useRef(new Set<string>());
  const [pendingIds, setPendingIds] = useState(new Set<string>());
  const [refreshFailures, setRefreshFailures] = useState(new Set<string>());
  const refreshFailed = !!selection.id && refreshFailures.has(selection.id);
  const queryClient = useQueryClient();
  const query = useCharacterById(selection.id);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    let disposed = false;
    characterScopeStorageKey(apiKey).then(key => {
      if (disposed) return;
      try {
        if (restoreOnMount.current && !touched.current) {
          const stored: unknown = JSON.parse(sessionStorage.getItem(key) ?? 'null');
          if (stored && typeof stored === 'object' && 'id' in stored && typeof stored.id === 'string' && stored.id.length > 0) {
            setSelection({ id: stored.id, onlyOwned: 'onlyOwned' in stored && stored.onlyOwned === true });
          }
        } else sessionStorage.removeItem(key);
      } catch { /* A corrupt or unavailable session store must not break browsing. */ }
      setStorageKey(key);
    }).catch(() => { /* Storage is optional in restricted browser contexts. */ });
    return () => { disposed = true; };
  }, [apiKey, loaded]);

  useEffect(() => {
    if (storageKey) {
      try { sessionStorage.setItem(storageKey, JSON.stringify(selection)); } catch { /* Optional persistence. */ }
    }
  }, [selection, storageKey]);

  useEffect(() => {
    if (selection.id && query.isSuccess && !query.isFetching && !query.character) {
      setSelection({ onlyOwned: false });
      toast.error(t.compendium_character_unavailable);
    }
  }, [selection.id, query.isSuccess, query.isFetching, query.character]);

  const selectCharacter = (id?: string) => {
    touched.current = true;
    setSelection(previous => ({ id, onlyOwned: id ? previous.onlyOwned : false }));
  };

  const setMembership: CharacterScope['setMembership'] = async (kind, entityId, present, label) => {
    const character = query.character;
    if (!character || !apiKey || locks.current.has(character.id) || refreshFailed || query.isError || query.isFetching) return;
    const id = character.id;
    locks.current.add(id);
    setPendingIds(previous => new Set(previous).add(id));
    let saved = false;
    let result: MembershipWriteResult | undefined;
    try {
      result = await charactersClient.setMembership(id, kind, entityId, present);
      saved = true;
    } catch (error) {
      if (active.current && getStoredApiKey() === apiKey) toast.error(error instanceof Error ? error.message : t.compendium_save_failed);
    }
    try {
      // Never write an old response into a new user's cache. Even a failed request
      // may have committed on the server, so always reload authoritative data.
      if (getStoredApiKey() !== apiKey) return;
      const characterKey = createCharacterByIdKey(id, apiKey);
      let patched = false;
      if (result?.characterPatch) {
        await queryClient.cancelQueries({ queryKey: characterKey, exact: true });
        queryClient.setQueryData<CharacterWithRelations | null>(characterKey, current => {
          const updated = current ? applyMembershipResult(current, result!) : undefined;
          patched = !!updated;
          return updated ?? current;
        });
      }
      // Old servers and ambiguous network failures still require a full read.
      if (!patched) await queryClient.refetchQueries({ queryKey: characterKey, exact: true, type: 'all' }, { throwOnError: true });
      // These consumers must become fresh too, but cannot hold the write lock or
      // delay the status on this card. Summaries are unaffected by membership.
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['characters', id], predicate: cached => cached.queryKey[2] !== apiKey, refetchType: 'none' }),
        queryClient.invalidateQueries({ queryKey: ['combat-lab-characters-by-ids'], predicate: cached => Array.isArray(cached.queryKey[1]) && cached.queryKey[1].includes(id) }),
        queryClient.invalidateQueries({ queryKey: ['owning-characters', kind, entityId] }),
      ]).catch(() => {});
      if (active.current && saved) toast.success(`${present ? t.compendium_added : t.compendium_removed}: ${label} → ${character.name}`);
    } catch {
      if (active.current) {
        setRefreshFailures(previous => new Set(previous).add(id));
        toast.error(saved ? t.compendium_saved_refresh_failed : t.compendium_refresh_failed);
      }
    } finally {
      locks.current.delete(id);
      if (active.current) setPendingIds(previous => { const next = new Set(previous); next.delete(id); return next; });
    }
  };

  const value: CharacterScope = {
    character: query.character,
    selectedCharacterId: selection.id,
    onlyOwned: selection.onlyOwned,
    isLoading: !!selection.id && query.isPending,
    isFetching: query.isFetching,
    isError: query.isError || refreshFailed,
    apiKey,
    pendingCharacterId: selection.id && pendingIds.has(selection.id) ? selection.id : undefined,
    selectCharacter,
    setOnlyOwned: enabled => setSelection(previous => ({ ...previous, onlyOwned: !!previous.id && enabled })),
    retry: () => { const id = selection.id; void query.refetch().then(result => { if (!result.isError && id) setRefreshFailures(previous => { const next = new Set(previous); next.delete(id); return next; }); }); },
    setMembership,
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
