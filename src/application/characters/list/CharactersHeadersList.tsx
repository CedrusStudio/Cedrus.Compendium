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
import PersonalizedQuickTags from '@/application/personalization/PersonalizedQuickTags';

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

export default function CharactersHeadersList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const [searchTags, setSearchTags] = useState<string[]>([CharacterTag]);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('characters');
  const availableTagsOnlyForCharacters = availableTags.filter(isCharacterOrSessionTag);

  const [displayedCharacters, setDisplayedCharacters] = useState<CharacterSummary[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const tagsEnrichedByCharacter = searchTags.includes(CharacterTag) ? searchTags : [ ...searchTags, CharacterTag ];
  const queryKey = createSearchCharactersKey(debouncedSearchTerm || '', cursor, tagsEnrichedByCharacter, pageSize, excludedTags);
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
    setSearchTags(tags);
    clearResults();
  }, [clearResults]);

  const handleExcludedTagsChange = useCallback((tags: string[]) => 
  {
    setExcludedTags(tags);
    setCursor(emptyUlid);
    clearResults();
  }, [clearResults]);

  return (
    <div className='flex flex-col items-center justify-end'>

      <div className='flex flex-row gap-4 justify-center mt-4 w-full max-w-7xl px-4'>

        <Input 
          name="search" 
          type="text" 
          placeholder={displayedText.searchByName}
          value={searchInput}
          onChange={handleSearchInputChange}
          className="w-md"
        />

        <TagFilter 
          includedTags={searchTags} 
          onIncludedTagsChange={handleSearchTagsChange}
          availableTags={availableTagsOnlyForCharacters}
          isLoading={tagsLoading}
          excludedTags={excludedTags}
          onExcludedTagsChange={handleExcludedTagsChange}
        />
      </div>

      <div className='mt-3 w-full max-w-7xl px-4'>
        <PersonalizedQuickTags
          context="characters"
          selectedTags={searchTags}
          onSelectedTagsChange={handleSearchTagsChange}
        />
      </div>

      <WithScroll<CharacterSummary>
        parentClassName='flex flex-col gap-2 mt-6 mx-auto w-full max-w-7xl px-4'
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
    <div className='relative'>
      <div className='absolute right-4 top-5 z-10'>
        <FavoriteCharacterButton characterId={summary.id} />
      </div>

      <Link 
        href={`/characters/${summary.id}`}
        onClick={() => dispatch(actions.clearCharacterNavbarSearch())}
        className='block group'
      >
        <Card className='relative overflow-hidden bg-gradient-to-r from-slate-900/90 to-slate-800/90 hover:from-slate-800 hover:to-slate-700 border border-slate-700/50 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20 lg:min-w-250'>
          <div className='absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
          <div className='relative flex flex-row items-center gap-4 px-6 pr-18'>
            <div className='flex items-center gap-2.5 min-w-[200px]'>
              <div className='h-1.5 w-1.5 rounded-full bg-primary animate-pulse' />
              <h3 className='text-base font-bold text-slate-100 group-hover:text-primary transition-colors duration-200'>
                {summary.name}
              </h3>
            </div>
            
            <div className='flex-1'>
              <TagsView tags={summary.tags} variant="outline" />
            </div>
            
          </div>
        </Card>
      </Link>
    </div>
  );
}