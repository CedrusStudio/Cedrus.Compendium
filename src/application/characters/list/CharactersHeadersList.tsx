"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/ui/card';
import { useDispatch } from 'react-redux';
import { actions } from '@/persistence/slices/characterSlice';
import { FaMagnifyingGlass } from "react-icons/fa6";
import { CharacterSummary } from "@/infrastructure/searchQueries/characters/createCharacterSummaryQuery";
import TagsView from '@/common/components/tags/TagsView';
import TagFilter from '@/common/components/filters/TagFilter';
import { WithScroll } from '@/common/components/WithScroll';
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { Input } from '@/common/components/ui/input';
import { displayedText } from '@/presentation/translations';
import { useQuery } from '@tanstack/react-query';
import client from '@/infrastructure/clients/searchClient';
import { createSearchCharactersKey } from '@/persistence/cacheKeys';
import { createCharacterSummaryQuery } from '@/infrastructure/searchQueries/characters/createCharacterSummaryQuery';
import { useEntityTags } from '@/common/hooks/useEntityTags';
import { CharacterTag, isCharacterOrSessionTag } from '@/domain/Tag';

const pageSize = DEFAULT_PAGE_SIZE;

export default function CharactersHeadersList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('characters');
  const availableTagsOnlyForCharacters = availableTags.filter(isCharacterOrSessionTag);

  const [displayedCharacters, setDisplayedCharacters] = useState<CharacterSummary[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const tagsEnrichedByCharacter = searchTags.includes(CharacterTag) ? searchTags : [ ...searchTags, CharacterTag ];
  const queryKey = createSearchCharactersKey(debouncedSearchTerm || '', cursor, tagsEnrichedByCharacter, pageSize);
  const { data: searchResults = [] } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const charactersQuery = createCharacterSummaryQuery(debouncedSearchTerm, cursor, tagsEnrichedByCharacter, pageSize);
      return await client.search<CharacterSummary[]>(charactersQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    setHasMore(searchResults.length === pageSize);

    if (!debouncedSearchTerm && searchTags.length === 0 && cursor === emptyUlid)
    {
      setDisplayedCharacters(searchResults);
      return;
    }

    setDisplayedCharacters(prev =>  
    {
      if (searchResults.length === 0) return prev;
      return [...prev, ...searchResults]
    });
  }, [cursor, debouncedSearchTerm, searchTags, searchResults]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => 
  {
    setSearchInput(e.target.value);
    clearResults();
  };

  const handleSearchTagsChange = (tags: string[]) => 
  {
    setSearchTags(tags);
    clearResults();
  };

  const clearResults = () =>
  {
    setDisplayedCharacters([]);
    setCursor(emptyUlid);
  }

  return (
    <div className='flex flex-col items-center justify-end'>

      <div className='flex flex-row gap-4 justify-center mt-4 w-full max-w-7xl px-4'>
        <Input 
          name="search" 
          type="text" 
          placeholder={displayedText.searchByName}
          value={searchInput}
          onChange={handleSearchInputChange}
          className="flex-1 max-w-md"
        />
        <TagFilter 
          includedTags={searchTags} 
          onTagsChange={handleSearchTagsChange}
          availableTags={availableTagsOnlyForCharacters}
          isLoading={tagsLoading}
          excludedTags={[CharacterTag]}
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
    <Link 
      href={`/characters/${summary.id}`}
      onClick={() => dispatch(actions.clearCharacterNavbarSearch())}
      className='block'
    >
      <Card className='bg-muted hover:bg-muted/80 transition-colors border-l-4 border-l-primary/30 hover:border-l-primary lg:min-w-250'>
        <div className='flex flex-row items-center gap-4 px-8'>
          <h3 className='text-lg font-bold text-primary min-w-[200px]'>
            {summary.name}
          </h3>
          
          <div className='flex-1'>
            <TagsView tags={summary.tags} variant="outline" />
          </div>
          
          <FaMagnifyingGlass className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </Card>
    </Link>
  );
}