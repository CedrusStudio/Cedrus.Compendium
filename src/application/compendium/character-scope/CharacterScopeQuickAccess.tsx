"use client";

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Star } from 'lucide-react';
import { Button } from '@/ui/button';
import { mainCharacterIcon } from '@/common/icons';
import { displayedText as t } from '@/common/translations';
import type { RootState } from '@/persistence/slices/store';
import searchClient from '@/infrastructure/clients/searchClient';
import { SearchQueryBuilder } from '@/infrastructure/searchQueries/SearchQueryBuilder';
import type { CharacterSummary } from '@/infrastructure/searchQueries/characters/createCharacterSummaryQuery';

type Props = {
  apiKey: string | null;
  selectedCharacterId?: string;
  onSelect: (id: string) => void;
};

export function CharacterScopeQuickAccess({ apiKey, selectedCharacterId, onSelect }: Props) {
  const profile = useSelector((state: RootState) => apiKey ? state.personalization.profilesByApiKey[apiKey] : undefined);
  const mainId = profile?.mainCharacterId;
  const favoriteIds = [...new Set(profile?.favoriteCharacterIds ?? [])].filter(id => id !== mainId);
  const ids = [...new Set([...(mainId ? [mainId] : []), ...favoriteIds])].sort();
  const query = useQuery({
    queryKey: ['compendium-character-shortcuts', apiKey, ids],
    queryFn: () => searchClient.search<CharacterSummary[]>(SearchQueryBuilder.for('character')
      .searchInFilter('id', ids)
      .select({ id: true, name: true, shortName: true, tags: true })
      .offsetPagination(1, ids.length)
      .build()),
    enabled: !!apiKey && ids.length > 0,
    staleTime: 30_000,
  });

  if (!apiKey || ids.length === 0) return null;
  const byId = new Map((query.data ?? []).map(character => [character.id, character]));
  const favorites = favoriteIds.flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
  const renderCharacter = (character: CharacterSummary, main = false) => (
    <Button key={character.id} type="button" variant={selectedCharacterId === character.id ? 'default' : 'outline'}
      aria-pressed={selectedCharacterId === character.id} onClick={() => onSelect(character.id)}
      className="h-auto min-h-9 w-full justify-start whitespace-normal text-left sm:whitespace-normal">
      {main ? mainCharacterIcon('size-4 shrink-0') : <Star aria-hidden="true" className="size-4 shrink-0" />}
      <span className="min-w-0 [overflow-wrap:anywhere]">{character.name}</span>
    </Button>
  );

  return <section aria-label="Szybki wybór postaci" className="space-y-3 border-b pb-4">
    {query.isPending && <p role="status">{t.compendium_loading}</p>}
    {query.isError && <div role="alert" className="space-y-2 text-sm">
      <p>{t.compendium_picker_failed}</p>
      <Button type="button" variant="outline" onClick={() => void query.refetch()}>{t.compendium_retry}</Button>
    </div>}
    {query.isSuccess && <>
      {mainId && <section aria-label="Główna postać" className="space-y-2">
        <h3 className="text-sm font-semibold">Główna postać</h3>
        {byId.has(mainId) ? renderCharacter(byId.get(mainId)!, true) : <p className="text-sm text-muted-foreground">Postać główna jest niedostępna.</p>}
      </section>}
      {favoriteIds.length > 0 && <section aria-label="Ulubione postacie" className="space-y-2">
        <h3 className="text-sm font-semibold">Ulubione postacie</h3>
        {favorites.length > 0 ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{favorites.map(character => renderCharacter(character))}</div>
          : <p className="text-sm text-muted-foreground">Brak dostępnych ulubionych postaci.</p>}
      </section>}
    </>}
  </section>;
}
