"use client"

import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu"

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
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Talent } from "@/domain/characters/Character"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { UpsertCharacterTalentsType } from "@/persistence/characterSchemas"
import { Control, useFieldArray, useFormContext } from "react-hook-form"
import EditTalentRow from "@/application/characters/edit/talents/EditTalentRow"
import { talentCategories } from "@/domain/data/categories"
import { defaultColumnKeys } from "../../talents/defaultColumns"
import { namingConventions } from "@/domain/data/namingConventions"
import EmptyTable from "@/application/characters/talents/EmptyTable"
import AddTalentView from "@/application/characters/edit/talents/AddTalentView"

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
  isPending: boolean;
  initialTalents: Talent[];
}

export function EditTalentsTable({ columns, initialTalents }: DataTableProps) 
{
  const { control } = useFormContext<UpsertCharacterTalentsType>();
  const { fields, update, remove, append } = useFieldArray
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
    table.getColumn(defaultColumnKeys.category)?.setFilterValue(value !== "all" ? value : "");
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
    state:
    {
      sorting,
      columnFilters,
      columnVisibility,
    },
    autoResetPageIndex: false,
  })

  const setNameFilter = (value: string) =>
  {
    table.getColumn(defaultColumnKeys.name)?.setFilterValue(value);
  }

  return (
    <div>
      <div className="flex items-center py-4 gap-3">

        <Input
          placeholder="Szukaj po nazwie..."
          value={(table.getColumn(defaultColumnKeys.name)?.getFilterValue() as string) ?? ""}
          onChange={event => setNameFilter(event.target.value)}
          className="max-w-sm"
        />

        <div className="flex items-start gap-2">
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

          <AddTalentView append={append} setNameFilter={setNameFilter} />

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
              ? table.getRowModel().rows.map(row => 
              {
                const currentTalent = fields.find(talent => talent.name === row.original.name)!;
                const initialTalent = initialTalents.find(talent => talent.name === row.original.name);

                return (
                  <EditTalentRow 
                    key={row.original.id} 
                    row={row} 
                    index={row.index} 
                    initialTalentOrNew={initialTalent || currentTalent} 
                    talent={currentTalent} 
                    update={update} 
                    remove={remove} 
                  />
                )
              })
              : <EmptyTable colSpan={columns.length} />
          }
          </TableBody>
        </Table>
      </div>

    </div>
  )
}
