"use client";

import { useCallback, useState } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { displayedText } from '@/common/translations';
import { useSearchCharactersSummary } from '@/application/characters/hooks/useSearchCharactersSummary';
import { CharacterSummary } from '@/infrastructure/searchQueries/characters/createCharacterSummaryQuery';
import TagsView from '@/common/components/tags/TagsView';
import { DEFAULT_PAGE_SIZE, emptyUlid } from '@/common/global/pagination';
import { useDebounce } from 'use-debounce';
import { useEntityTags } from '@/common/hooks/useEntityTags';
import ListHeader from '@/common/components/lists/ListHeader';

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

type CharacterPickerGridProps =
{
  onSelectCharacter: (characterId: string) => void;
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

  const { characters: searchedCharacters } = useSearchCharactersSummary(debouncedSearchTerm, emptyUlid, searchTags, pageSize, excludedTags);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {
        displayedCharacters.length === 0
          ? <NotFoundMessage />
          : (
              displayedCharacters.map(summary =>
              (
                <CharacterSelectCard
                    key={summary.id}
                    summary={summary}
                    onSelect={onSelectCharacter}
                    isSelected={summary.id === selectedCharacterId}
                />
              ))
          )
      }
      </div>
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
  onSelect: (id: string) => void;
  isSelected: boolean;
};

function CharacterSelectCard({ summary, onSelect, isSelected }: CharacterSelectCardProps)
{
  return (
    <Card
      className={`cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'bg-muted hover:bg-muted/80'}`}
      onClick={() => onSelect(summary.id)}
    >
      <CardHeader>
        <CardTitle className='flex flex-row justify-between gap-2'>
          <h1 className='text-xl'>{summary.name}</h1>
          <TagsView tags={summary.tags} variant="outline" />
        </CardTitle>
        <CardDescription>{summary.shortName}</CardDescription>
      </CardHeader>
    </Card>
  );
}
