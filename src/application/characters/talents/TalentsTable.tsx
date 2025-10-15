"use client";

import {
  AccessorKeyColumnDef,
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
  TableCell,
  TableRow,
} from "@/ui/table";
import { useState, useEffect } from "react";
import { Talent } from "@/domain/characters/Talent";
import { allowedTalentCategories } from "@/domain/characters/Talent";
import { defaultColumnKeys } from "@/application/characters/talents/defaultColumns";
import { namingConventions } from "@/presentation/translations";
import NameInputSearch from "@/common/components/table/NameInputSearch";
import CategorySelectFilter from "@/common/components/table/CategorySelectFilter";
import PaginationButtons from "@/common/components/table/PaginationButtons";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import DefaultTableHeader from "@/common/components/table/DefaultTableHeader";
import DefaultTableBody from "@/common/components/table/DefaultTableBody";

interface DataTableProps
{ 
  columns: AccessorKeyColumnDef<Talent>[]
  data: Talent[],
}

export function TalentsTable({ columns, data }: DataTableProps) 
{
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
  }, [columns]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const handleOnSelectedValueChange = (value: string) => 
  {
    setSelectedCategory(value);
    table.getColumn(defaultColumnKeys.category)?.setFilterValue(value !== "all" ? value : "");
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
        <NameInputSearch table={table} defaultColumnKeys={defaultColumnKeys} />

        <CategorySelectFilter  
          selectedCategory={selectedCategory}
          handleOnSelectedValueChange={handleOnSelectedValueChange}
          defaultColumnKeys={defaultColumnKeys}
          allCategory={namingConventions.all}
          categories={allowedTalentCategories}
        />

        <PaginationButtons table={table} />

        <ColumnFilter table={table} />
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <DefaultTableHeader table={table} />

          <DefaultTableBody table={table} columns={columns} tableRowFactory=
          {
            row => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
              {
                row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))
              }
              </TableRow>
            )
          } />
        </Table>
      </div>

    </div>
  )
}