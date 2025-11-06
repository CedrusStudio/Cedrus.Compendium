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

import { useState, useEffect } from "react";
import { displayedText } from "@/presentation/translations";
import { useSearchCharacters } from '@/application/characters/hooks/useSearchCharacters';
import { columnKeys, columns } from "@/application/bestiary/columns";
import NameInputSearch from "@/common/components/table/NameInputSearch";
import PaginationButtons from "@/common/components/table/PaginationButtons";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/bestiarySlice";
import { toast } from "sonner";
import BestiaryTableBody from "@/application/bestiary/BestiaryTableBody";
import BestiaryTableFooter from "@/application/bestiary/BestiaryTableFooter";


export default function BestiaryTable()
{
  const { characters: data } = useSearchCharacters();

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
  });

  return (
    <div className="mx-3">
      <div className="flex flex-wrap items-center justify-center py-4 gap-3">
        <NameInputSearch table={table} defaultColumnKeys={columnKeys} />

        <Button variant="outline" disabled={table.getFilteredSelectedRowModel().rows.length === 0} onClick={() => 
        { 
          const selectedCharacterIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
          dispatch(actions.addSelectedToBattle(selectedCharacterIds));
          toast.success(displayedText.addedToBattle);
        }}>
          {addIcon("scale-90")}
        </Button> 

        <PaginationButtons table={table} />
        <ColumnFilter table={table} />
      </div>

      <BestiaryTableBody table={table} columns={columns} />
      <BestiaryTableFooter table={table} />

    </div>
  );
};
