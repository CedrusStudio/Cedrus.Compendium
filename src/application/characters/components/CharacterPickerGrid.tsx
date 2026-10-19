"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { displayedText } from '@/common/translations';
import { useSearchCharactersSummary } from '@/application/characters/hooks/useSearchCharactersSummary';
import { CharacterSummary } from '@/infrastructure/searchQueries/characters/createCharacterSummaryQuery';
import TagsView from '@/common/components/tags/TagsView';
import { DEFAULT_PAGE_SIZE, emptyUlid } from '@/common/global/pagination';
import { useDebounce } from 'use-debounce';
import { useEntityTags } from '@/common/hooks/useEntityTags';
import ListHeader from '@/common/components/lists/ListHeader';
import { Button } from '@/ui/button';

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

type CharacterPickerGridProps =
{
  onSelectCharacter: (characterId: string) => void;
  /** Optional richer selection callback for pickers that need the displayed label as well as the id. */
  onSelectCharacterSummary?: (summary: CharacterSummary) => void;
  selectedCharacterId?: string;
  selectedCharacterName?: string;
  selectedCharacterShortName?: string;
  selectedCharacterTags?: string[];
  /** Excludes a character (typically the one currently being edited) from the results. */
  excludeCharacterId?: string;
};

/**
 * Shared "search + tag-filter + card grid" character picker, used both by
 * `SelectBaseCharacterDialog` (create character from template) and by
 * `ImportFromCharacterSheet` (import elements from another character).
 */
export default function CharacterPickerGrid
(
  {
    onSelectCharacter,
    onSelectCharacterSummary,
    selectedCharacterId,
    selectedCharacterName,
    selectedCharacterShortName,
    selectedCharacterTags,
    excludeCharacterId,
  }: CharacterPickerGridProps
)
{
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('characters');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);

  const [pageNumber, setPageNumber] = useState(1);
  const [pages, setPages] = useState<CharacterSummary[]>([]);
  const { characters: page, isPending, isFetching, isError, refetch, accessKey } = useSearchCharactersSummary(debouncedSearchTerm, emptyUlid, searchTags, pageSize, excludedTags, pageNumber);
  const searchKey = JSON.stringify([debouncedSearchTerm, searchTags, excludedTags, accessKey]);
  const [previousSearchKey, setPreviousSearchKey] = useState(searchKey);
  if (previousSearchKey !== searchKey) {
    setPreviousSearchKey(searchKey);
    setPageNumber(1);
    setPages([]);
  }
  useEffect(() => {
    if (isPending || isError) return;
    setPages(previous => pageNumber === 1 ? page : Array.from(new Map([...previous, ...page].map(item => [item.id, item])).values()));
  }, [page, pageNumber, isPending, isError, searchKey]);
  const searchedCharacters = pageNumber === 1 ? page : pages;
  const characters = excludeCharacterId
    ? searchedCharacters.filter(character => character.id !== excludeCharacterId)
    : searchedCharacters;

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId) ?? (
    selectedCharacterId && selectedCharacterName
      ? {
          id: selectedCharacterId,
          name: selectedCharacterName,
          shortName: selectedCharacterShortName ?? '',
          tags: selectedCharacterTags ?? [],
        }
      : undefined
  );

  const displayedCharacters =
    selectedCharacter && !characters.some(character => character.id === selectedCharacter.id)
      ? [selectedCharacter, ...characters]
      : characters;

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
  {
    setSearchTerm(e.target.value);
  }, []);

  const handleSearchTagsChange = useCallback((tags: string[]) =>
  {
    setSearchTags(tags);
  }, []);

  const handleExcludedTagsChange = useCallback((tags: string[]) =>
  {
    setExcludedTags(tags);
  }, []);

  return (
    <div className="space-y-4">
      <ListHeader
        availableTags={availableTags}
        searchTags={searchTags}
        searchInput={searchTerm}
        tagsLoading={tagsLoading}
        handleSearchTagsChange={handleSearchTagsChange}
        handleSearchInputChange={handleSearchInputChange}
        excludedTags={excludedTags}
        handleExcludedTagsChange={handleExcludedTagsChange}
      />

      {isPending && <p role="status">{displayedText.compendium_loading}</p>}
      {isError && <div role="alert">{displayedText.compendium_picker_failed} <Button variant="outline" onClick={() => void refetch()}>{displayedText.compendium_retry}</Button></div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {
        displayedCharacters.length === 0 && !isPending && !isError
          ? <NotFoundMessage />
          : (
              displayedCharacters.map(summary =>
              (
                <CharacterSelectCard
                    key={summary.id}
                    summary={summary}
                    onSelect={(id, selectedSummary) => {
                      onSelectCharacter(id);
                      onSelectCharacterSummary?.(selectedSummary);
                    }}
                    isSelected={summary.id === selectedCharacterId}
                />
              ))
          )
      }
      </div>
      {!isError && page.length === pageSize && <Button variant="outline" disabled={isFetching} onClick={() => setPageNumber(previous => previous + 1)}>{displayedText.compendium_load_more}</Button>}
    </div>
  );
}

function NotFoundMessage()
{
  return (
    <div className="col-span-2 text-center text-muted-foreground py-8">
      {displayedText.no_characters_found}
    </div>
  );
}

type CharacterSelectCardProps =
{
  summary: CharacterSummary;
  onSelect: (id: string, summary: CharacterSummary) => void;
  isSelected: boolean;
};

function CharacterSelectCard({ summary, onSelect, isSelected }: CharacterSelectCardProps)
{
  return (
    <Card
      className={`transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'bg-muted hover:bg-muted/80'}`}
    >
      <button type="button" className="w-full cursor-pointer rounded-xl text-left focus-visible:outline-2 focus-visible:outline-primary" aria-pressed={isSelected} onClick={() => onSelect(summary.id, summary)}>
      <CardHeader>
        <CardTitle className='flex min-w-0 flex-col justify-between gap-2 sm:flex-row'>
          <h1 className='min-w-0 break-words text-xl'>{summary.name}</h1>
          <TagsView tags={summary.tags} variant="outline" />
        </CardTitle>
        <CardDescription>{summary.shortName}</CardDescription>
      </CardHeader>
      </button>
    </Card>
  );
}
