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

import { useState, useEffect } from "react";
import { displayedText } from "@/presentation/translations";
import { columnKeys, columns } from "@/application/bestiary/columns";
import NameInputSearch from "@/common/components/table/NameInputSearch";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { Button } from "@/common/components/ui/button";
import { actions } from "@/persistence/slices/bestiarySlice";
import { toast } from "sonner";
import { removeIcon } from "@/presentation/icons";
import BestiaryTableBody from "@/application/bestiary/BestiaryTableBody";
import BestiaryTableFooter from "@/application/bestiary/BestiaryTableFooter";
import { useQuery } from "@tanstack/react-query";
import charactersClient from "@/infrastructure/clients/charactersClient";

const EMPTY_ARRAY: never[] = [];

export default function BattleTable()
{
  const charactersInBattle = useSelector((state: RootState) => state.bestiary.addedToBattle);
  const dispatch = useDispatch();

  const queryKey = ['characters', 'battle', charactersInBattle.join(',')];
  const { data } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      if (charactersInBattle.length === 0) return [];
      return await charactersClient.getByIds(charactersInBattle);
    },
    staleTime: 5_000,
    enabled: charactersInBattle.length > 0
  });

  const [sorting, setSorting] = useState<SortingState>(EMPTY_ARRAY);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(EMPTY_ARRAY);
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

  const table = useReactTable
  ({
    data: data ?? EMPTY_ARRAY,
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
  })

  return (
    <div className="mx-3">
      <div className="flex flex-wrap items-center justify-center py-4 gap-3">
        <NameInputSearch table={table} defaultColumnKeys={columnKeys} />

        <Button variant="outline" disabled={table.getFilteredSelectedRowModel().rows.length === 0} onClick={() => 
        { 
          const selectedCharacterIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
          dispatch(actions.removeSelectedFromBattle(selectedCharacterIds));
          toast.success(displayedText.removedFromBattle);
        }}>
          {removeIcon("scale-90")}
        </Button>

        <ColumnFilter table={table} />
      </div>

      <BestiaryTableBody table={table} columns={columns} />
      <BestiaryTableFooter table={table} />
    </div>
  );
};
