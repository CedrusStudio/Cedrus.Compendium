import { useState, useCallback } from 'react';
import { Card } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetTitle } from '@/ui/sheet';
import { importIcon } from '@/common/icons';
import ListHeader from '@/common/components/lists/ListHeader';
import { WithScroll } from '@/common/components/WithScroll';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import searchClient from '@/infrastructure/clients/searchClient';
import { DEFAULT_PAGE_SIZE, emptyUlid } from '@/common/global/pagination';
import { useEntityTags } from '@/common/hooks/useEntityTags';
import { createKeysetSearchPowerSpecificationsKey } from '@/persistence/cacheKeys';
import { createPowerSpecificationKeysetQuery } from '@/infrastructure/searchQueries/powers/createPowerSpecificationKeysetQuery';
import type { PowerSpecification } from '@/domain/characters/combat/Power';
import { Check } from 'lucide-react';

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];
const scrollableTargetId = 'select-power-specification-scrollable';

interface SelectPowerSpecificationSheetProps 
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (specification: PowerSpecification) => void;
  currentSpecificationId?: string;
}

export function SelectPowerSpecificationSheet
({
  open,
  onOpenChange,
  onSelect,
  currentSpecificationId,
}
  : SelectPowerSpecificationSheetProps) 
{
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const [selectedTags, setSelectedTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [selectedSpecId, setSelectedSpecId] = useState<string | undefined>(currentSpecificationId);
  
  const [displayedSpecs, setDisplayedSpecs] = useState<PowerSpecification[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('powerSpecifications');

  const queryKey = createKeysetSearchPowerSpecificationsKey(debouncedSearchTerm, cursor, selectedTags, pageSize, excludedTags);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const query = createPowerSpecificationKeysetQuery(debouncedSearchTerm, cursor, selectedTags, pageSize, excludedTags);
      return await searchClient.search<PowerSpecification[]>(query);
    },
    staleTime: 5_000
  });

  const [previousSelection, setPreviousSelection] = useState({ currentSpecificationId, open });
  if (previousSelection.currentSpecificationId !== currentSpecificationId || previousSelection.open !== open)
  {
    setPreviousSelection({ currentSpecificationId, open });
    setSelectedSpecId(currentSpecificationId);
  }

  const [previousPage, setPreviousPage] = useState<{ cursor: typeof cursor; searchResults: typeof searchResults } | null>(null);
  if (searchResults && (!previousPage || previousPage.cursor !== cursor || previousPage.searchResults !== searchResults))
  {
    setPreviousPage({ cursor, searchResults });
    setHasMore(searchResults.length === pageSize);
    if (cursor === emptyUlid)
    {
      setDisplayedSpecs(searchResults);
    }
    else
    {
      setDisplayedSpecs(prev => {
        if (searchResults.length === 0) return prev;
        return [...prev, ...searchResults];
      });
    }
  }

  const clearResults = useCallback(() => 
  {
    setDisplayedSpecs(EMPTY_ARRAY);
    setCursor(emptyUlid);
  }, []);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
  {
    clearResults();
    setSearchInput(e.target.value);
  }, [clearResults]);

  const handleSearchTagsChange = useCallback((tags: string[]) => 
  {
    setSelectedTags(tags);
    clearResults();
  }, [clearResults]);

  const handleExcludedTagsChange = useCallback((tags: string[]) => 
  {
    setExcludedTags(tags);
    clearResults();
  }, [clearResults]);

  const loadMore = useCallback(() => 
  {
    if (!hasMore || !searchResults || searchResults.length === 0) return;
    const lastItem = searchResults[searchResults.length - 1];
    setCursor(lastItem.id);
  }, [hasMore, searchResults]);

  const handleSelectSpec = (spec: PowerSpecification) => 
  {
    setSelectedSpecId(spec.id);
    onSelect(spec);
    onOpenChange(false);
  };

  const handleConfirm = () => 
  {
    const selectedSpec = displayedSpecs.find((spec: PowerSpecification) => spec.id === selectedSpecId);

    if (selectedSpec) 
    {
      onSelect(selectedSpec);
      onOpenChange(false);
    }
  };

  const isCurrentSpec = (specId: string) => specId === currentSpecificationId;
  const isSelected = (specId: string) => specId === selectedSpecId;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-4xl overflow-y-auto" id={scrollableTargetId}>
        <div className="flex flex-col h-full gap-4 py-4">
          
          <div className="flex items-center gap-2">
            {importIcon}
            <SheetTitle className="text-lg">Wybierz Moc</SheetTitle>
          </div>
          <SheetDescription>
            Wyszukaj i wybierz specyfikację mocy do użycia w karcie postaci.
          </SheetDescription>

          <ListHeader
            searchInput={searchInput}
            handleSearchInputChange={handleSearchInputChange}
            searchTags={selectedTags}
            handleSearchTagsChange={handleSearchTagsChange}
            excludedTags={excludedTags}
            handleExcludedTagsChange={handleExcludedTagsChange}
            availableTags={availableTags}
            tagsLoading={tagsLoading}
          />

          <WithScroll
            items={displayedSpecs}
            triggerNext={loadMore}
            hasMore={hasMore}
            parentClassName="flex-1 overflow-y-auto space-y-2 px-1"
            scrollableTarget={scrollableTargetId}
            renderItem={(spec: PowerSpecification) => (
              <Card
                key={spec.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-accent ${isSelected(spec.id) ? 'border-primary border-2' : ''}`}
                onClick={() => handleSelectSpec(spec)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      
                      <h3 className="font-semibold text-lg">{spec.name}</h3>
                      {
                        isCurrentSpec(spec.id) && (
                          <Badge variant="default" className="bg-green-400">
                            <Check className="w-3 h-3 mr-1" />
                            Posiadane
                          </Badge>
                        )
                      }
                    </div>

                    {
                      spec.description && <p className="text-sm text-muted-foreground">{spec.description}</p>
                    }

                    <div className="flex flex-wrap gap-1">
                    {
                      spec.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    }
                    </div>
                  </div>
                </div>
              </Card>
            )}
          />

          <SheetFooter>
            <Button onClick={handleConfirm} disabled={!selectedSpecId} className="w-full">
              Wybierz Specyfikację
            </Button>
          </SheetFooter>

        </div>
      </SheetContent>
    </Sheet>
  );
}
