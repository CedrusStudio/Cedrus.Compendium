"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/ui/card';
import { useDispatch } from 'react-redux';
import { actions } from '@/persistence/slices/characterSlice';
import { CharacterSummary } from "@/infrastructure/searchQueries/characters/createCharacterSummaryQuery";
import TagsView from '@/common/components/tags/TagsView';
import TagFilter from '@/common/components/filters/TagFilter';
import { WithScroll } from '@/common/components/WithScroll';
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { Input } from '@/common/components/ui/input';
import { displayedText } from '@/common/translations';
import { useQuery } from '@tanstack/react-query';
import client from '@/infrastructure/clients/searchClient';
import { createSearchCharactersKey } from '@/persistence/cacheKeys';
import { createCharacterSummaryQuery } from '@/infrastructure/searchQueries/characters/createCharacterSummaryQuery';
import { useEntityTags } from '@/common/hooks/useEntityTags';
import { CharacterTag, isCharacterOrSessionTag } from '@/domain/Tag';
import FavoriteCharacterButton from '@/application/personalization/FavoriteCharacterButton';
import MainCharacterButton from '@/application/personalization/MainCharacterButton';
import PersonalizedQuickTags from '@/application/personalization/PersonalizedQuickTags';
import { useApiKey } from '@/common/hooks/useApiKey';

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];
const sanitizeCharactersViewTags = (tags: string[]) => tags.filter(tag => tag !== CharacterTag);

export default function CharactersHeadersList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('characters');
  const availableTagsOnlyForCharacters = availableTags.filter(tag => isCharacterOrSessionTag(tag) && tag !== CharacterTag);

  const [displayedCharacters, setDisplayedCharacters] = useState<CharacterSummary[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  const { apiKey } = useApiKey();

  const tagsEnrichedByCharacter = searchTags.includes(CharacterTag) ? searchTags : [ ...searchTags, CharacterTag ];
  const queryKey = createSearchCharactersKey(debouncedSearchTerm || '', cursor, tagsEnrichedByCharacter, pageSize, excludedTags, apiKey);
  const { data: searchResults = EMPTY_ARRAY } = useQuery
  ({
    queryKey,
    queryFn: async () =>
    {
      const charactersQuery = createCharacterSummaryQuery(debouncedSearchTerm, cursor, tagsEnrichedByCharacter, pageSize, excludedTags);
      return await client.search<CharacterSummary[]>(charactersQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;
    
    setHasMore(searchResults.length === pageSize);

    if (cursor === emptyUlid)
    {
      setDisplayedCharacters(searchResults);
      return;
    }

    setDisplayedCharacters(prev => [...prev, ...searchResults]);
  }, [cursor, searchResults]);
  
  const clearResults = useCallback(() =>
  {
    setDisplayedCharacters(EMPTY_ARRAY);
    setCursor(emptyUlid);
  }, []);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
  {
    clearResults();
    setSearchInput(e.target.value);
  }, [clearResults]);
  
  const handleSearchTagsChange = useCallback((tags: string[]) => 
  {
    setSearchTags(sanitizeCharactersViewTags(tags));
    clearResults();
  }, [clearResults]);

  const handleExcludedTagsChange = useCallback((tags: string[]) => 
  {
    setExcludedTags(sanitizeCharactersViewTags(tags));
    setCursor(emptyUlid);
    clearResults();
  }, [clearResults]);

  return (
    <div className='flex flex-col items-center'>

      <div className='mt-4 w-full px-4'>
        <div className='mx-auto flex w-full max-w-5xl flex-col items-center gap-3'>

          <div className='flex w-full flex-col items-stretch gap-3 md:flex-row md:items-start md:justify-center'>
            <Input 
              name="search" 
              type="text" 
              placeholder={displayedText.searchByName}
              value={searchInput}
              onChange={handleSearchInputChange}
              className="w-full md:max-w-sm"
            />

            <div className='flex w-full justify-center md:w-auto'>
              <TagFilter 
                includedTags={searchTags} 
                onIncludedTagsChange={handleSearchTagsChange}
                availableTags={availableTagsOnlyForCharacters}
                isLoading={tagsLoading}
                excludedTags={excludedTags}
                onExcludedTagsChange={handleExcludedTagsChange}
              />
            </div>
          </div>

          <div className='flex max-w-full flex-col items-center gap-2'>
            <PersonalizedQuickTags
              context="characters"
              selectedTags={searchTags}
              onSelectedTagsChange={handleSearchTagsChange}
            />
            <PersonalizedQuickTags
              context="characters"
              mode="exclude"
              selectedTags={excludedTags}
              onSelectedTagsChange={handleExcludedTagsChange}
            />
          </div>
        </div>
      </div>

      <WithScroll<CharacterSummary>
        parentClassName='mt-6 mx-auto flex w-full max-w-[88rem] flex-col gap-3 px-4'
        items={displayedCharacters}
        triggerNext={() => 
        {
          if (displayedCharacters.length > 0) setCursor(displayedCharacters[displayedCharacters.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={summary => <CharactersListCard key={summary.id} summary={summary} />}
      />

    </div>
  );
};

function CharactersListCard({ summary }: { summary: CharacterSummary })
{
  const dispatch = useDispatch();

  return (
    <div className='relative w-full'>
      <div className='absolute inset-y-0 right-6 z-10 flex items-center gap-3'>
        <FavoriteCharacterButton characterId={summary.id} />
        <MainCharacterButton characterId={summary.id} />
      </div>

      <Link 
        href={`/characters/${summary.id}`}
        onClick={() => dispatch(actions.clearCharacterNavbarSearch())}
        className='block w-full'
      >
        <Card className='w-full gap-0 border-border/60 py-6 transition-colors hover:bg-accent/40'>
          <div className='flex flex-col gap-4 px-7 pr-32 sm:flex-row sm:items-center sm:gap-6 sm:pr-36 lg:pr-40'>
            <div className='min-w-0 space-y-1 sm:min-w-[16rem] lg:min-w-[20rem]'>
              <h3 className='truncate text-xl font-semibold'>
                {summary.name}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {summary.shortName}
              </p>
            </div>
            
            <div className='min-w-0 flex-1'>
              <TagsView tags={summary.tags} variant="outline" className='w-full justify-start' />
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}