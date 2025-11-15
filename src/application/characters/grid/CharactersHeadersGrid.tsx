"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Separator } from '@/ui/separator';
import { Button } from '@/ui/button';
import { useDispatch } from 'react-redux';
import { actions } from '@/persistence/slices/characterSlice';
import { FaMagnifyingGlass } from "react-icons/fa6";
import { LayoutGrid, List } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
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
        
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <WithScroll<CharacterSummary>
        parentClassName={viewMode === 'grid' ? 'grid lg:grid-cols-4 gap-4 mt-6 m-4' : 'flex flex-col gap-2 mt-6 mx-auto w-full max-w-6xl px-4'}
        items={displayedCharacters}
        triggerNext={() => 
        {
          if (displayedCharacters.length > 0) setCursor(displayedCharacters[displayedCharacters.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={summary => <CharactersSummaryCard key={summary.id} summary={summary} viewMode={viewMode} />}
      />

    </div>
  );
};

function CharactersListCard({ summary }: { summary: CharacterSummary })
{
  const dispatch = useDispatch();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className='bg-muted hover:bg-muted/80 transition-colors'>
      <div className='flex flex-row items-center gap-4 px-6 py-3'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-3 mb-2'>
            <h3 className='text-lg font-semibold text-primary truncate'>{summary.name}</h3>
            <TagsView tags={summary.tags} variant="outline" />
          </div>
          
          <p className={`text-sm text-muted-foreground ${!isExpanded ? 'line-clamp-1' : ''}`}>
            {summary.description}
          </p>
          
          {summary.description && summary.description.length > 80 && (
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-auto p-0 text-xs mt-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>
        
        <Button asChild size="icon" variant="ghost" onClick={() => dispatch(actions.clearCharacterNavbarSearch())}>
          <Link href={`/characters/${summary.id}`}><FaMagnifyingGlass className="h-4 w-4" /></Link>
        </Button>
      </div>
    </Card>
  );
}

function CharactersSummaryCard({ summary, viewMode }: { summary: CharacterSummary; viewMode: 'grid' | 'list' })
{
  const dispatch = useDispatch();
  const [isExpanded, setIsExpanded] = useState(false);

  if (viewMode === 'list') {
    return <CharactersListCard summary={summary} />;
  }

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