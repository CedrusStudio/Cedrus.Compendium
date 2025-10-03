"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  AccessorKeyColumnDef,
  ColumnFiltersState,
  RowData,
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
} from "@/components/ui/table"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateDefaultTalent, Talent, talentCategories } from "@/domain/Character"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { UpsertCharacterTalentsType } from "@/persistence/characterSchemas"
import { Control, useFieldArray } from "react-hook-form"
import EditTalentRow from "@/components/character/edit/talents/EditTalentRow"
import AppendToArrayButton from "@/components/ui/AppendToArrayButton"

declare module '@tanstack/table-core' 
{
  interface TableMeta<TData extends RowData>
  {
    control?: Control<UpsertCharacterTalentsType>;
  }
}

interface DataTableProps
{
  columns: AccessorKeyColumnDef<Talent>[]
  control: Control<UpsertCharacterTalentsType>;
  isPending: boolean;
}

export function EditTalentsTable({ columns, control, isPending }: DataTableProps) 
{
  const { fields, update, append, remove } = useFieldArray
  ({
    name: "talents",
    control
  });

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
    table.getColumn("category")?.setFilterValue(value !== "all" ? value : null);
  };

  const table = useReactTable<Talent>
  ({
    data: fields,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    }
  })

  return (
    <div>
      <div className="flex items-center py-4 gap-3">

        <Input
          placeholder="Filter names..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={event => table.getColumn("name")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />

        <div className="flex items-start gap-2">
          <Select name='category' defaultValue={"all"} value={selectedCategory} onValueChange={handleOnSelectedValueChange}>
            <div className={'flex gap-x-10 items-center justify-around'}>
              <SelectTrigger className='capitalize'>
                <SelectValue />
              </SelectTrigger>
            </div>
      
            <SelectContent>
              <SelectItem key={"all"} value={"all"}>
                <span className='capitalize'>All</span>
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

          <AppendToArrayButton append={append} isPending={isPending} toAdd={CreateDefaultTalent} />
        </div>

        <div className="flex items-center justify-end space-x-2 py-4 ml-auto">
          <Button
            variant="outline"
            type="button"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
          <ArrowLeft />
          </Button>

          <Button
            variant="outline"
            type="button"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
          <ArrowRight />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
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
                  )
              )
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
            table.getRowModel().rows?.length > 0
              ? table.getRowModel().rows.map(row => <EditTalentRow key={row.original.id} row={row} index={row.index} formTalent={fields[row.index]} update={update} remove={remove} />)
              : <EmptyTable columns={columns} />
          }
          </TableBody>
        </Table>
      </div>

    </div>
  )
}

function EmptyTable({ columns }: { columns: AccessorKeyColumnDef<Talent>[] })
{
  return (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-24 text-center">
          No results.
      </TableCell>
    </TableRow>
  )
}