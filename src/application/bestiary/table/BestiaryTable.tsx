"use client"

import { Input } from "@/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu"

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
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { ArrowLeft, ArrowRight } from "lucide-react"
import { namingConventions } from "@/domain/data/namingConventions"
import EmptyTable from "@/common/components/EmptyTable"
import { useSearchCharacters } from '@/application/characters/hooks/useSearchCharacters';
import { Button } from '@/ui/button';
import { bestiaryCategories } from "@/domain/bestiaryCategories"
import { columnKeys, columns } from "@/application/bestiary/table/bestiaryColumns"

export default function BestiaryTable()
{
  const { characters: data } = useSearchCharacters();

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

  // if (characters?.length < 1) return <NoCharacters />;

  return (
    <div>
      <div className="flex items-center py-4 gap-3">
        <Input
          placeholder="Szukaj po nazwie..."
          value={(table.getColumn(columnKeys.name)?.getFilterValue() as string) ?? ""}
          onChange={event => table.getColumn(columnKeys.name)?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />

        <Select name={columnKeys.category} defaultValue={"all"} value={selectedCategory} onValueChange={handleOnSelectedValueChange}>

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
                bestiaryCategories.map(bestiaryCategory => (
                  <SelectItem key={bestiaryCategory} value={bestiaryCategory}>
                    <span className='capitalize'>{bestiaryCategory}</span>
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
                  {column.id}
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
  );
};
