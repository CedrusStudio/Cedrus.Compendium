"use client";

import { useId, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/ui/card';
import { useDispatch } from 'react-redux';
import { actions } from '@/persistence/slices/characterSlice';
import { CharacterSummary } from "@/infrastructure/searchQueries/characters/createCharacterSummaryQuery";
import TagsView from '@/common/components/tags/TagsView';
import CharacterVisibilityFilter from '@/common/components/filters/CharacterVisibilityFilter';
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
import TagFilterSwitcher from '@/common/components/filters/TagFilterSwitcher';
import type { TagFacetFilter } from '@/domain/tags/tagFacets';
import { CharacterTag, isCharacterOrSessionTag } from '@/domain/Tag';
import FavoriteCharacterButton from '@/application/personalization/FavoriteCharacterButton';
import MainCharacterButton from '@/application/personalization/MainCharacterButton';
import CharacterTitleTransition from '@/application/characters/CharacterTitleTransition';
import { QuickTagsPanel, QuickTagsToggle } from '@/application/personalization/QuickTagsSection';
import { useApiKey } from '@/common/hooks/useApiKey';
import { CharacterVisibilityMode } from '@/common/global/SearchPayloads';

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];
const sanitizeCharactersViewTags = (tags: string[]) => tags.filter(tag => tag !== CharacterTag);

export default function CharactersHeadersList()
{
  const [tagsOpen, setTagsOpen] = useState(true);
  const tagsId = useId();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [facetFilters, setFacetFilters] = useState<TagFacetFilter[]>(EMPTY_ARRAY);
  
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('characters');
  const availableTagsOnlyForCharacters = availableTags.filter(tag => isCharacterOrSessionTag(tag) && tag !== CharacterTag);

  const [displayedCharacters, setDisplayedCharacters] = useState<CharacterSummary[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  const [visibilityMode, setVisibilityMode] = useState<CharacterVisibilityMode>('all');
  const { apiKey, hasApiKey } = useApiKey();

  // If the API key disappears (e.g. removed in another tab) while "mine
  // only" is selected, fall back to "all" instead of silently showing an
  // empty list forever.
  if (!hasApiKey && visibilityMode === 'mineOnly') setVisibilityMode('all');

  const tagsEnrichedByCharacter = searchTags.includes(CharacterTag) ? searchTags : [ ...searchTags, CharacterTag ];
  const queryKey = [...createSearchCharactersKey(debouncedSearchTerm || '', cursor, tagsEnrichedByCharacter, pageSize, excludedTags, apiKey, visibilityMode), facetFilters];
  const { data: searchResults = EMPTY_ARRAY } = useQuery
  ({
    queryKey,
    queryFn: async () =>
    {
      const charactersQuery = createCharacterSummaryQuery(debouncedSearchTerm, cursor, tagsEnrichedByCharacter, pageSize, excludedTags, visibilityMode);
      if (facetFilters.length > 0) charactersQuery.tagFacetFilters = facetFilters;
      return await client.search<CharacterSummary[]>(charactersQuery);
    },
    staleTime: 5_000
  });

  const [previousPage, setPreviousPage] = useState<{ cursor: typeof cursor; searchResults: typeof searchResults } | null>(null);
  if (searchResults && (!previousPage || previousPage.cursor !== cursor || previousPage.searchResults !== searchResults))
  {
    setPreviousPage({ cursor, searchResults });
    setHasMore(searchResults.length === pageSize);
    if (cursor === emptyUlid)
    {
      setDisplayedCharacters(searchResults);
    }
    else
    {
      setDisplayedCharacters(prev => [...prev, ...searchResults]);
    }
  }
  
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
  
  const handleFacetFiltersChange = useCallback((filters: TagFacetFilter[]) =>
  
  {
  
    setFacetFilters(filters);
  
    clearResults();
  
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

  const handleVisibilityModeChange = useCallback((mode: CharacterVisibilityMode) =>
  {
    setVisibilityMode(mode);
    clearResults();
  }, [clearResults]);

  return (
    <div className='flex flex-col items-center'>

      <div className='mt-4 w-full px-4'>
        <div className='mx-auto flex w-full max-w-5xl flex-col items-center gap-3'>

          <div className='flex w-full flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-start md:justify-center'>
            <Input 
              name="search" 
              type="text" 
              placeholder={displayedText.searchByName}
              value={searchInput}
              onChange={handleSearchInputChange}
              className="w-full md:w-96"
            />

            <div className='flex w-full min-w-0 max-w-full flex-wrap items-center justify-center gap-3 md:w-auto'>
              <TagFilterSwitcher
                entity="characters"
                includedTags={searchTags}
                onIncludedTagsChange={handleSearchTagsChange}
                availableTags={availableTagsOnlyForCharacters}
                isLoading={tagsLoading}
                excludedTags={excludedTags}
                onExcludedTagsChange={handleExcludedTagsChange}
                facetFilters={facetFilters}
                onFacetFiltersChange={handleFacetFiltersChange}
              />
              <CharacterVisibilityFilter
                value={visibilityMode}
                onValueChange={handleVisibilityModeChange}
                mineOnlyDisabled={!hasApiKey}
              />
              <QuickTagsToggle open={tagsOpen} controlsId={tagsId} onOpenChange={setTagsOpen} />
            </div>
          </div>

          <QuickTagsPanel id={tagsId} open={tagsOpen} context="characters"
            includedTags={searchTags} excludedTags={excludedTags}
            onIncludedTagsChange={handleSearchTagsChange} onExcludedTagsChange={handleExcludedTagsChange} />
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
  "use memo";
  const dispatch = useDispatch();
  const [prefetchOnIntent, setPrefetchOnIntent] = useState(false);

  return (
    <div className='relative w-full'>
      <div className='absolute top-3 right-3 z-10 flex items-center gap-2 sm:inset-y-0 sm:right-6 sm:gap-3'>
        <FavoriteCharacterButton characterId={summary.id} />
        <MainCharacterButton characterId={summary.id} />
      </div>

      <Link 
        href={`/characters/${summary.id}`}
        prefetch={prefetchOnIntent ? null : false}
        onMouseEnter={() => setPrefetchOnIntent(true)}
        onFocus={() => setPrefetchOnIntent(true)}
        onClick={() => dispatch(actions.clearCharacterNavbarSearch())}
        className='block w-full'
      >
        <Card className='w-full gap-0 border-border/60 py-6 transition-colors hover:bg-accent/40'>
          <div className='flex min-w-0 flex-col gap-4 px-4 pt-11 sm:pt-0 sm:px-7 sm:flex-row sm:items-center sm:gap-6 sm:pr-36 lg:pr-40'>
            <div className='min-w-0 space-y-1 sm:min-w-[16rem] lg:min-w-[20rem]'>
              <CharacterTitleTransition id={summary.id}>
                <h3 className='break-words text-xl font-semibold'>{summary.name}</h3>
              </CharacterTitleTransition>
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
