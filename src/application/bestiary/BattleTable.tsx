"use client";

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useState, useEffect, useMemo } from "react";
import { displayedText } from "@/presentation/translations";
import { useSearchCharacters } from '@/application/characters/hooks/useSearchCharacters';
import { columnKeys, columns } from "@/application/bestiary/columns";
import NameInputSearch from "@/common/components/table/NameInputSearch";
import CategorySelectFilter from "@/common/components/table/CategorySelectFilter";
import PaginationButtons from "@/common/components/table/PaginationButtons";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import { allowedCharacterCategories } from "@/domain/characters/Character";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { Button } from "@/common/components/ui/button";
import { actions } from "@/persistence/slices/bestiarySlice";
import { toast } from "sonner";
import { removeIcon } from "@/presentation/icons";
import BestiaryTableBody from "@/application/bestiary/BestiaryTableBody";
import BestiaryTableFooter from "@/application/bestiary/BestiaryTableFooter";

export default function BattleTable()
{
  const { characters } = useSearchCharacters();
  const charactersInBattle = useSelector((state: RootState) => state.bestiary.addedToBattle);
  const dispatch = useDispatch();

  // Memoize filtered data to prevent recalculation on every render
  const data = useMemo(() => 
  {
    const battleIdsSet = new Set(charactersInBattle);
    return characters.filter(character => battleIdsSet.has(character.id));
  }, [characters, charactersInBattle]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => 
  {
    const initialVisibility: VisibilityState = columns.reduce<VisibilityState>((acc, column) => 
    {
      acc[column.accessorKey as string] = !(column.meta?.initiallyHidden);
      return acc;
    }, {});
    setColumnVisibility(initialVisibility);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const handleOnSelectedValueChange = (value: string) => 
  {
    setSelectedCategory(value);
    table.getColumn(columnKeys.category)?.setFilterValue(value !== "all" ? value : "");
  };

  const table = useReactTable
  ({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
  })

  return (
    <div className="mx-3">
      <div className="flex items-center py-4 gap-3">
        <NameInputSearch table={table} defaultColumnKeys={columnKeys} />

        <CategorySelectFilter 
          categories={allowedCharacterCategories}
          selectedCategory={selectedCategory}
          handleOnSelectedValueChange={handleOnSelectedValueChange}
          defaultColumnKeys={columnKeys}
          allCategory={displayedText.all}
        />

        <Button variant="outline" disabled={table.getFilteredSelectedRowModel().rows.length === 0} onClick={() => 
        { 
          const selectedCharacterIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
          dispatch(actions.removeSelectedFromBattle(selectedCharacterIds));
          toast.success(displayedText.removedFromBattle);
        }}>
          {removeIcon("scale-90")}
        </Button>

        <PaginationButtons table={table} />
        <ColumnFilter table={table} />
      </div>

      <BestiaryTableBody table={table} columns={columns} />
      <BestiaryTableFooter table={table} />
    </div>
  );
};
