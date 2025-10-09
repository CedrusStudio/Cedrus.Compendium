"use client";

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

import {
  ColumnDef,
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Talent } from "@/domain/characters/Character";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { talentCategories } from "@/domain/data/categories";
import { defaultColumnKeys } from "@/application/characters/talents/defaultColumns";
import { namingConventions } from "@/domain/data/namingConventions";
import EmptyTable from "@/common/components/EmptyTable";
import NameInputSearch from "@/common/components/table/NameInputSearch";
import { translate } from "@/domain/data/translations";

interface DataTableProps
{
  columns: ColumnDef<Talent>[]
  data: Talent[],
}

export function TalentsView({ columns, data }: DataTableProps) 
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

        <Select name={defaultColumnKeys.category} defaultValue={"all"} value={selectedCategory} onValueChange={handleOnSelectedValueChange}>

            <div className={'flex gap-x-10 items-center justify-around'}>
              <SelectTrigger className='capitalize'>
                  <SelectValue />
              </SelectTrigger>
            </div>
    
            <SelectContent>
              <SelectItem key={"all"} value={"all"}>
                <span className='capitalize'>{namingConventions.all}</span>
              </SelectItem>
              {
                talentCategories.map(talentCategory => (
                  <SelectItem key={talentCategory} value={talentCategory}>
                    <span className='capitalize'>{talentCategory}</span>
                  </SelectItem>
                ))
              }
            </SelectContent>

        </Select>

        <div className="flex items-center justify-end space-x-2 py-4 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
            <ArrowLeft />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
            <ArrowRight />
            </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto capitalize">
              {namingConventions.columns}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
          {
            table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => (
                <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                >
                  {translate(column.id)}
                </DropdownMenuCheckboxItem>
              ))
          }
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
              <TableHeader>
              {
                table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                  {
                    headerGroup.headers.map(header => (
                      <TableHead key={header.id} className="">
                      {
                        header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())
                      }
                      </TableHead>
                    ))
                  }
                  </TableRow>
                ))
              }
              </TableHeader>

              <TableBody>
              {
                table.getRowModel().rows?.length 
                  ? (
                      table.getRowModel().rows.map(row => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                          >
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
                  : <EmptyTable colSpan={columns.length} />
              }
              </TableBody>
          </Table>
        </div>

    </div>
  )
}