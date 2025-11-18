"use client";

import { ColumnFiltersState, SortingState, VisibilityState, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { useState, useEffect, useCallback } from "react";
import { displayedText } from "@/presentation/translations";
import { columnKeys, columns } from "@/application/bestiary/columns";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import TagFilter from "@/common/components/filters/TagFilter";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
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
import { Table } from "@/ui/table";
import DefaultTableHeader from "@/common/components/table/DefaultTableHeader";
import BestiaryTableRow from "@/application/bestiary/BestiaryTableRow";
import { Table as TableType } from "@tanstack/react-table";
import DefaultTableBody from "@/common/components/table/DefaultTableBody";

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
