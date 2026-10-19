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
import { displayedText } from "@/common/translations";
import NameInputSearch from "@/common/components/table/NameInputSearch";
import SelectFilter from "@/common/components/table/SelectFilter";
import PaginationButtons from "@/common/components/table/PaginationButtons";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import DefaultTableHeader from "@/common/components/table/DefaultTableHeader";
import DefaultTableBody from "@/common/components/table/DefaultTableBody";

interface DataTableProps
{ 
  columns: AccessorKeyColumnDef<Talent>[]
  data: Talent[],
}

const talentColumnClassName = (columnId: string) => {
  if (columnId === defaultColumnKeys.name) return 'whitespace-normal [overflow-wrap:anywhere] sm:whitespace-nowrap';
  if (columnId === 'roll') return 'w-44 sm:w-auto';
  if (columnId === defaultColumnKeys.grade || columnId === defaultColumnKeys.bonus) return 'hidden sm:table-cell';
  return undefined;
};

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
      <div className="flex min-w-0 flex-wrap items-center -mt-2 lg:pb-1 gap-3">
        <NameInputSearch table={table} defaultColumnKeys={defaultColumnKeys} />

        <SelectFilter  
          selectedOption={selectedCategory}
          handleOnSelectedValueChange={handleOnSelectedValueChange}
          columnKey={defaultColumnKeys.category}
          options={allowedTalentCategories}
          allOption={displayedText.all}
        />

        <PaginationButtons table={table} />

        <ColumnFilter table={table} />
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table className="table-fixed sm:table-auto">
          <DefaultTableHeader table={table} columnClassName={talentColumnClassName} />

          <DefaultTableBody table={table} columns={columns} tableRowFactory=
          {
            row => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
              {
                row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className={talentColumnClassName(cell.column.id)}>
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
