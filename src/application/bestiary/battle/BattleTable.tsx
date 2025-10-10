"use client";

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/ui/table";
import { useState, useEffect, useMemo } from "react";
import { namingConventions } from "@/domain/data/namingConventions";
import EmptyTable from "@/common/components/EmptyTable";
import { useSearchCharacters } from '@/application/characters/hooks/useSearchCharacters';
import { columnKeys, columns } from "@/application/bestiary/table/bestiaryColumns";
import NameInputSearch from "@/common/components/table/NameInputSearch";
import CategorySelectFilter from "@/common/components/table/CategorySelectFilter";
import PaginationButtons from "@/common/components/table/PaginationButtons";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import DefaultTableHeader from "@/common/components/table/DefaultTableHeader";
import { characterCategories } from "@/domain/data/categories";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { Button } from "@/common/components/ui/button";
import { actions } from "@/persistence/slices/bestiarySlice";
import { toast } from "sonner";
import { removeIcon } from "@/domain/data/icons";

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
  })

  return (
    <div>
      <div className="flex items-center py-4 gap-3">
        <NameInputSearch table={table} defaultColumnKeys={columnKeys} />

        <CategorySelectFilter 
          categories={characterCategories}
          selectedCategory={selectedCategory}
          handleOnSelectedValueChange={handleOnSelectedValueChange}
          defaultColumnKeys={columnKeys}
          allCategory={namingConventions.all}
        />

        <Button variant="outline" disabled={table.getFilteredSelectedRowModel().rows.length === 0} onClick={() => 
        { 
          const selectedCharacterIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
          dispatch(actions.removeSelectedFromBattle(selectedCharacterIds));
          toast.success("Usunięto z walki zaznaczone postacie.");
        }}>
          {removeIcon("scale-90")}
        </Button>

        <PaginationButtons table={table} />
        <ColumnFilter table={table} />
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
            <DefaultTableHeader table={table} />

            <TableBody>
            {
              table.getRowModel().rows?.length <= 0
                ? <EmptyTable colSpan={columns.length} />
                : (
                    table.getRowModel().rows.map(row => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {
                        row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))
                      }
                      </TableRow>
                  ))
                )
            }
            </TableBody>
        </Table>

      </div>

      <div className="text-muted-foreground flex-1 text-sm mt-2">
        Zaznaczono {table.getFilteredSelectedRowModel().rows.length} z{" "} {table.getFilteredRowModel().rows.length}.
      </div>
    </div>
  );
};
