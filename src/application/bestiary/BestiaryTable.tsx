"use client";

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useState, useEffect, useCallback } from "react";
import { displayedText } from "@/presentation/translations";
import { columns } from "@/application/bestiary/columns";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import TagFilter from "@/common/components/filters/TagFilter";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/bestiarySlice";
import { toast } from "sonner";
import BestiaryTableBody from "@/application/bestiary/BestiaryTableBody";
import BestiaryTableFooter from "@/application/bestiary/BestiaryTableFooter";
import { Character } from "@/domain/characters/Character";
import { useQuery } from "@tanstack/react-query";
import { createSearchCharactersKey } from "@/persistence/cacheKeys";
import { createCharacterQuery } from "@/infrastructure/searchQueries/characters/createCharacterQuery";
import client from "@/infrastructure/clients/searchClient";
import { emptyUlid } from "@/common/global/pagination";
import { useDebounce } from "use-debounce";
import { Input } from "@/common/components/ui/input";
import InfiniteScroll from "react-infinite-scroll-component";
import LoadingSpinner from "@/common/components/LoadingSpinner";
import { useEntityTags } from "@/common/hooks/useEntityTags";

const pageSize = 20;
const EMPTY_ARRAY: never[] = [];

export default function BestiaryTable()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [displayedCharacters, setDisplayedCharacters] = useState<Character[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);

  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('characters');

  const queryKey = createSearchCharactersKey(debouncedSearchTerm || '', cursor, searchTags, pageSize);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const charactersQuery = createCharacterQuery(debouncedSearchTerm, cursor, searchTags, pageSize);
      return await client.search<Character[]>(charactersQuery);
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

    setDisplayedCharacters(prev =>  
    {
      if (searchResults.length === 0) return prev;
      return [...prev, ...searchResults]
    });
  }, [cursor, searchResults]);

  const clearResults = useCallback(() =>
  {
    setDisplayedCharacters(EMPTY_ARRAY);
    setCursor(emptyUlid);
  }, []);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
  {
    setSearchInput(e.target.value);
    clearResults();
  }, [clearResults]);

  const handleSearchTagsChange = useCallback((tags: string[]) => 
  {
    setSearchTags(tags);
    clearResults();
  }, [clearResults]);

  const handleLoadMore = useCallback(() => 
  {
    if (displayedCharacters.length > 0)
    {
      setCursor(displayedCharacters[displayedCharacters.length - 1].id);
    }
  }, [displayedCharacters]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const dispatch = useDispatch();

  useEffect(() => 
  {
    const initialVisibility: VisibilityState = columns.reduce<VisibilityState>((acc, column) => 
    {
      acc[column.accessorKey as string] = !(column.meta?.initiallyHidden);
      return acc;
    }, {});
    setColumnVisibility(initialVisibility);
  }, []);

  const table = useReactTable
  ({
    data: displayedCharacters,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: 
    {
      sorting,
      columnFilters,
      columnVisibility,
    },
    autoResetPageIndex: false,
  });

  return (
    <div className="mx-3">
      <div className="flex flex-wrap items-center justify-center py-4 gap-3">
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
          availableTags={availableTags}
          isLoading={tagsLoading}
        />

        <Button variant="outline" disabled={table.getFilteredSelectedRowModel().rows.length === 0} onClick={() => 
        { 
          const selectedCharacterIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
          dispatch(actions.addSelectedToBattle(selectedCharacterIds));
          toast.success(displayedText.addedToBattle);
        }}>
          {addIcon("scale-90")}
        </Button> 

        <ColumnFilter table={table} />
      </div>

      <InfiniteScroll
        dataLength={displayedCharacters.length}
        next={handleLoadMore}
        hasMore={hasMore}
        loader={<div className="flex justify-center py-4"><LoadingSpinner /></div>}
      >
        <BestiaryTableBody table={table} columns={columns} />
      </InfiniteScroll>

      <BestiaryTableFooter table={table} />
    </div>
  );
};
