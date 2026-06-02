"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/ui/sheet';
import { displayedText } from '@/common/translations';
import { importIcon } from '@/common/icons';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import searchClient from '@/infrastructure/clients/searchClient';
import { DEFAULT_PAGE_SIZE, emptyUlid } from '@/common/global/pagination';
import { EntityType, useEntityTags } from '@/common/hooks/useEntityTags';
import { WithScroll } from '@/common/components/WithScroll';
import { SearchEntityPayload } from '@/common/global/SearchPayloads';
import ListHeader from '@/common/components/lists/ListHeader';

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];
const scrollableTargetId = 'import-sheet-scrollable';

export type ImportItemState = 'available' | 'selected' | 'owned' | 'removed';

type ImportSheetSearchParams =
{
  searchQuery: string;
  cursor: string;
  includeTags: string[];
  pageSize: number;
  excludeTags: string[];
}

type ImportItemsSheetProps<TItem extends { id: string }> = 
{
  importTitle: string;
  importDescription: string;
  onImport: (items: TItem[]) => void;
  isPending: boolean;
  currentItemsIds: string[];
  removedItemsIds?: string[];
  onToggleCurrentItem?: (id: string) => void;
  onToggleRemovedItem?: (id: string) => void;
  renderItem: (item: TItem, isSelected: boolean, onToggle: (id: string) => void, itemState: ImportItemState) => React.ReactNode;
  entityType: EntityType;
  createKeysetSearchKey: (params: ImportSheetSearchParams) => readonly unknown[];
  createKeysetQuery: (params: ImportSheetSearchParams) => SearchEntityPayload;
  gradeFilter?: string;
  onGradeFilterChange?: (value: string) => void;
  renderHeaderContent?: (helpers: { clearResults: () => void }) => React.ReactNode;
};

export default function ImportItemsSheet<TItem extends { id: string }>
(
  {
    importTitle,
    importDescription,
    onImport,
    isPending,
    currentItemsIds,
    removedItemsIds = EMPTY_ARRAY,
    onToggleCurrentItem,
    onToggleRemovedItem,
    renderItem,
    entityType,
    createKeysetSearchKey,
    createKeysetQuery,
    gradeFilter,
    onGradeFilterChange,
    renderHeaderContent,
  }
    : ImportItemsSheetProps<TItem>
) 
{
  const [open, setOpen] = useState(false);
  const [selectedItemsIds, setSelectedItemsIds] = useState<Set<string>>(new Set());
  const itemsCache = useRef<Map<string, TItem>>(new Map());
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [displayedItems, setDisplayedItems] = useState<TItem[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags(entityType);
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);

  const getItemState = useCallback((itemId: string): ImportItemState =>
  {
    if (removedItemsIds.includes(itemId))
    {
      return 'removed';
    }

    if (currentItemsIds.includes(itemId))
    {
      return 'owned';
    }

    if (selectedItemsIds.has(itemId))
    {
      return 'selected';
    }

    return 'available';
  }, [currentItemsIds, removedItemsIds, selectedItemsIds]);

  const searchParams: ImportSheetSearchParams =
  {
    searchQuery: debouncedSearchTerm,
    cursor,
    includeTags: searchTags,
    pageSize,
    excludeTags: excludedTags,
  };

  const queryKey = createKeysetSearchKey(searchParams);
  const { data: itemSearchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const query = createKeysetQuery(searchParams);
      return await searchClient.search<TItem[]>(query);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!itemSearchResults) return;
    
    setHasMore(itemSearchResults.length === pageSize);

    if (cursor === emptyUlid)
    {
      setDisplayedItems(itemSearchResults);
      return;
    }

    setDisplayedItems(prev =>  
    {
      if (itemSearchResults.length === 0) return prev;
      return [...prev, ...itemSearchResults]
    });
  }, [cursor, itemSearchResults]);

  const clearResults = useCallback(() =>
  {
    setDisplayedItems(EMPTY_ARRAY);
    setCursor(emptyUlid);
  }, []);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
  {
    clearResults();
    setSearchTerm(e.target.value);
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
  }, []);

  const handleGradeFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
  {
    if (!onGradeFilterChange)
    {
      return;
    }

    clearResults();
    onGradeFilterChange(e.target.value);
  }, [clearResults, onGradeFilterChange]);

  useEffect(() => 
  {
    itemSearchResults?.forEach(item => 
    {
      itemsCache.current.set(item.id, item);
    });
  }, [itemSearchResults]);

  const handleToggleItem = (itemId: string) => 
  {
    const itemState = getItemState(itemId);

    if (itemState === 'owned')
    {
      onToggleCurrentItem?.(itemId);
      return;
    }

    if (itemState === 'removed')
    {
      onToggleRemovedItem?.(itemId);
      return;
    }

    setSelectedItemsIds(prev => 
    {
      const newSet = new Set(prev);

      if (newSet.has(itemId)) 
      {
        newSet.delete(itemId);
        return newSet;
      } 
        
      newSet.add(itemId);
      return newSet;
    });
  };

  const availableItems = displayedItems.filter(item => getItemState(item.id) === 'available');

  const handleToggleAll = () => 
  {
    if (selectedItemsIds.size === availableItems.length) 
    {
      setSelectedItemsIds(new Set());
      return;
    } 

    setSelectedItemsIds(new Set(availableItems.map(p => p.id)));
  };

  const handleImport = () => 
  {
    const selectedItems = Array.from(selectedItemsIds)
      .map(id => itemsCache.current.get(id))
      .filter((item): item is TItem => item !== undefined);
    
    onImport(selectedItems);
    setSelectedItemsIds(new Set());
    setSearchTerm("");
    setOpen(false);
  };

  const selectedCount = selectedItemsIds.size;
  const allSelected = availableItems.length > 0 && availableItems.every(item => selectedItemsIds.has(item.id));
  const visibleSelectedCount = displayedItems.filter(item => selectedItemsIds.has(item.id)).length;
  const hiddenSelectedCount = selectedCount - visibleSelectedCount;
  const headerContent = renderHeaderContent?.({ clearResults });
  const actionButtons = (
    <div className="flex flex-col md:flex-row gap-2">
      {
        availableItems.length > 0 && (
          <Button variant="outline" type="button" onClick={handleToggleAll}>
            <span className='first-letter:capitalize'>{allSelected ? displayedText.deselect_all : displayedText.select_all}</span>
          </Button>
        )
      }
      <Button variant="default" type="button" onClick={handleImport} disabled={selectedCount === 0}>
        <span className='first-letter:capitalize'>{displayedText.import} ({selectedCount})</span>
      </Button>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>

      <SheetTrigger asChild>
        <Button variant="outline" type="button" size="icon" disabled={isPending}>
          {importIcon}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-full md:h-[90vh] overflow-y-auto" id={scrollableTargetId}>
        
        <SheetHeader>
          <SheetTitle className='first-letter:capitalize'>
            {importTitle}
          </SheetTitle>
          <SheetDescription className='first-letter:capitalize'>
            {importDescription}
          </SheetDescription>
        </SheetHeader>
    
          <ListHeader 
            availableTags={availableTags} 
            searchTags={searchTags}
            searchInput={searchTerm}
            tagsLoading={tagsLoading}
            handleSearchTagsChange={handleSearchTagsChange}
            handleSearchInputChange={handleSearchInputChange}
            excludedTags={excludedTags}
            handleExcludedTagsChange={handleExcludedTagsChange}
            gradeFilter={gradeFilter}
            handleGradeFilterChange={onGradeFilterChange ? handleGradeFilterChange : undefined}
          >
            {headerContent}
            {actionButtons}
          </ListHeader>

          <WithScroll<TItem>
            parentClassName="flex flex-col gap-2"
            items={displayedItems}
            triggerNext={() => 
            {
              if (displayedItems.length > 0) setCursor(displayedItems[displayedItems.length - 1].id);
            }}
            hasMore={hasMore}
            renderItem={item => renderItem(item, selectedItemsIds.has(item.id), handleToggleItem, getItemState(item.id))}
            scrollableTarget={scrollableTargetId}
          />

          {
            hiddenSelectedCount > 0 && (
              <div className="text-sm text-muted-foreground text-center p-2 bg-primary/10 rounded-md">
                {hiddenSelectedCount} {displayedText.selected_items_hidden_by_filter}
              </div>
            )
          }
      </SheetContent>
    </Sheet>
  );
}
