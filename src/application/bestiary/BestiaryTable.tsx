"use client";

import { ColumnFiltersState, SortingState, VisibilityState, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { useState, useEffect, useCallback, useId } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { displayedText } from "@/common/translations";
import { columnKeys, columns } from "@/application/bestiary/columns";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import CharacterVisibilityFilter from "@/common/components/filters/CharacterVisibilityFilter";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/common/icons";
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/bestiarySlice";
import { toast } from "sonner";
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
import { AccessorKeyColumnDef } from "@tanstack/react-table"
import { useEntityTags } from "@/common/hooks/useEntityTags";
import TagFilterSwitcher from '@/common/components/filters/TagFilterSwitcher';
import type { TagFacetFilter } from '@/domain/tags/tagFacets';
import { Table } from "@/ui/table";
import DefaultTableHeader from "@/common/components/table/DefaultTableHeader";
import BestiaryTableRow from "@/application/bestiary/BestiaryTableRow";
import { Table as TableType } from "@tanstack/react-table";
import DefaultTableBody from "@/common/components/table/DefaultTableBody";
import PersonalizedQuickTags from '@/application/personalization/PersonalizedQuickTags';
import { usePersonalization } from '@/common/hooks/usePersonalization';
import { CharacterWithRelations, toCharacters } from '@/persistence/mappings/characterMapping';
import { useApiKey } from '@/common/hooks/useApiKey';
import { CharacterVisibilityMode } from '@/common/global/SearchPayloads';

const pageSize = 20;
const EMPTY_ARRAY: never[] = [];

export default function BestiaryTable()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [facetFilters, setFacetFilters] = useState<TagFacetFilter[]>(EMPTY_ARRAY);
  const [displayedCharacters, setDisplayedCharacters] = useState<Character[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  const [visibilityMode, setVisibilityMode] = useState<CharacterVisibilityMode>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();
  const activeFilterCount = searchTags.length + excludedTags.length + facetFilters.length + (visibilityMode === 'all' ? 0 : 1);
  const { profile } = usePersonalization();
  const { apiKey, hasApiKey } = useApiKey();

  // If the API key disappears (e.g. removed in another tab) while "mine
  // only" is selected, fall back to "all" instead of silently showing an
  // empty list forever.
  useEffect(() =>
  {
    if (!hasApiKey && visibilityMode === 'mineOnly') setVisibilityMode('all');
  }, [hasApiKey, visibilityMode]);

  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('characters');

  const queryKey = [...createSearchCharactersKey(debouncedSearchTerm || '', cursor, searchTags, pageSize, excludedTags, apiKey, visibilityMode), facetFilters];
  const { data: searchResults } = useQuery
  ({
    queryKey,
    queryFn: async () =>
    {
      const charactersQuery = createCharacterQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags, visibilityMode);
      if (facetFilters.length > 0) charactersQuery.tagFacetFilters = facetFilters;
      const rawCharacters = await client.search<CharacterWithRelations[]>(charactersQuery);
      return toCharacters(rawCharacters);
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

  const handleFacetFiltersChange = useCallback((filters: TagFacetFilter[]) =>

  {

    setFacetFilters(filters);

    clearResults();

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

  const handleVisibilityModeChange = useCallback((mode: CharacterVisibilityMode) =>
  {
    setVisibilityMode(mode);
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

    if (profile.bestiaryColumnVisibility)
    {
      setColumnVisibility({
        ...initialVisibility,
        ...profile.bestiaryColumnVisibility,
      });
      return;
    }

    setColumnVisibility(initialVisibility);
  }, [profile.bestiaryColumnVisibility]);

  const table = useReactTable<Character>
  ({
    data: displayedCharacters,
    columns: columns.filter(column => column.id !== columnKeys.initiative) as AccessorKeyColumnDef<Character>[],
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
      <div className="flex flex-wrap items-center py-4 gap-3 lg:sticky lg:top-0 bg-background z-10">

        <div className="min-w-0 w-full md:flex-1">
          <Input 
            name="search" 
            type="text" 
            placeholder={displayedText.searchByName}
            value={searchInput}
            onChange={handleSearchInputChange}
            className="max-w-md"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          className="md:hidden"
          aria-expanded={filtersOpen}
          aria-controls={filtersId}
          onClick={() => setFiltersOpen(open => !open)}
        >
          <SlidersHorizontal aria-hidden="true" />
          Filtry{activeFilterCount > 0 && ` (${activeFilterCount})`}
          <ChevronDown aria-hidden="true" className={filtersOpen ? 'rotate-180' : ''} />
        </Button>

        <Button variant="outline" aria-label="Dodaj zaznaczone do walki" disabled={table.getFilteredSelectedRowModel().rows.length === 0} onClick={() =>
        {
          const selectedCharacterIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
          dispatch(actions.addSelectedToBattle(selectedCharacterIds));
          toast.success(displayedText.addedToBattle);
        }}>
          {addIcon("scale-90")}
        </Button>

        <ColumnFilter table={table} />
      </div>

      <div id={filtersId} className={`${filtersOpen ? '' : 'hidden'} mb-4 space-y-3 md:block`}>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
          <TagFilterSwitcher
            entity="characters"
            includedTags={searchTags}
            onIncludedTagsChange={handleSearchTagsChange}
            availableTags={availableTags}
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
        </div>
        <PersonalizedQuickTags
          context="bestiary"
          selectedTags={searchTags}
          onSelectedTagsChange={handleSearchTagsChange}
        />
        <PersonalizedQuickTags
          context="bestiary"
          mode="exclude"
          selectedTags={excludedTags}
          onSelectedTagsChange={handleExcludedTagsChange}
        />
      </div>

      <InfiniteScroll
        dataLength={displayedCharacters.length}
        next={handleLoadMore}
        hasMore={hasMore}
        loader={<div className="flex justify-center py-4"><LoadingSpinner /></div>}
      >
        <BestiaryTableBody columns={columns} table={table} />
      </InfiniteScroll>

      <BestiaryTableFooter table={table} />
    </div>
  );
};

type BestiaryTableBodyProps<TData> = 
{
  table: TableType<TData>;
  columns: { accessorKey: string }[];
}

function BestiaryTableBody<TData>({ table, columns }: BestiaryTableBodyProps<TData>)
{
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <DefaultTableHeader table={table} addBorders className="text-center" />
        <DefaultTableBody table={table} columns={columns} tableRowFactory={row => <BestiaryTableRow key={row.id} row={row} />} />
      </Table>
    </div>
  );
};
