"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Separator } from '@/ui/separator';
import { Button } from '@/ui/button';
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

const pageSize = DEFAULT_PAGE_SIZE;

export default function CharactersHeadersGrid()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  
  const [displayedCharacters, setDisplayedCharacters] = useState<CharacterSummary[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createSearchCharactersKey(debouncedSearchTerm || '', cursor, searchTags, pageSize);
  const { data: searchResults = [] } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const charactersQuery = createCharacterSummaryQuery(debouncedSearchTerm, cursor, searchTags, pageSize);
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

      <div className='flex flex-row gap-4 justify-center mt-4'>
        <Input 
          name="search" 
          type="text" 
          placeholder={displayedText.searchByName}
          value={searchInput}
          onChange={handleSearchInputChange}
          className="max-w-max"
        />
        <TagFilter includedTags={searchTags} onTagsChange={handleSearchTagsChange} />
      </div>

      <WithScroll<CharacterSummary>
        parentClassName='grid lg:grid-cols-4 gap-4 mt-6 m-4'
        items={displayedCharacters}
        triggerNext={() => 
        {
          if (displayedCharacters.length > 0) setCursor(displayedCharacters[displayedCharacters.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={summary => <CharactersSummaryCard key={summary.id} summary={summary} />}
      />

    </div>
  );
};

function CharactersSummaryCard({ summary }: { summary: CharacterSummary })
{
  const dispatch = useDispatch();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className='bg-muted'>
      
      <CardHeader className='-my-1.5'>
        <CardTitle className='text-2xl flex justify-between items-center'>
          <span className='text-primary'>{summary.name}</span>

          <Button asChild size="icon" className='mt-0.5' onClick={() => dispatch(actions.clearCharacterNavbarSearch())}>
            <Link href={`/characters/${summary.id}`}><FaMagnifyingGlass /></Link>
          </Button>
        </CardTitle>
      </CardHeader>

      <Separator />
      <TagsView tags={summary.tags} variant="outline" />

      <CardContent className='-mt-1 space-y-2'>
        <CardDescription className={`text-justify ${!isExpanded ? 'line-clamp-3' : ''}`}>
          {summary.description}
        </CardDescription>
        {summary.description && summary.description.length > 150 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-xs"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        )}
      </CardContent>
      
    </Card>
  );
};