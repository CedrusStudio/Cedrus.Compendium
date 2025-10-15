"use client";

import {
  AccessorKeyColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Table } from "@/ui/table";
import { useState, useEffect } from "react";
import { allowedTalentCategories, Talent } from "@/domain/characters/Talent";
import { UpsertCharacterTalentsType } from "@/persistence/characterSchemas";
import { useFieldArray, useFormContext } from "react-hook-form";
import EditTalentRow from "@/application/characters/edit/talents/EditTalentRow";
import { defaultColumnKeys } from "@/application/characters/talents/defaultColumns";
import { namingConventions } from "@/presentation/translations";
import AddTalentView from "@/application/characters/edit/talents/AddTalentView";
import NameInputSearch from "@/common/components/table/NameInputSearch";
import CategorySelectFilter from "@/common/components/table/CategorySelectFilter";
import PaginationButtons from "@/common/components/table/PaginationButtons";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import DefaultTableHeader from "@/common/components/table/DefaultTableHeader";
import DefaultTableBody from "@/common/components/table/DefaultTableBody";


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
    control,
    keyName: "_rhfId" // Preserves your original id field
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
        <NameInputSearch table={table} defaultColumnKeys={defaultColumnKeys} />

        <div className="flex items-start gap-2">

          <CategorySelectFilter  
            selectedCategory={selectedCategory}
            handleOnSelectedValueChange={handleOnSelectedValueChange}
            defaultColumnKeys={defaultColumnKeys}
            allCategory={namingConventions.all}
            categories={allowedTalentCategories}
          />

          <AddTalentView append={append} setNameFilter={setNameFilter} />

        </div>

        <PaginationButtons table={table} />
        <ColumnFilter table={table} />
      </div>

      <Table className="overflow-hidden rounded-md border">
        <DefaultTableHeader table={table} />

        <DefaultTableBody table={table} columns={columns} tableRowFactory=
        {
          row => (
            <EditTalentRow 
              key={row.original.id} 
              row={row} 
              index={row.index} 
              initialTalent={initialTalents.find(talent => talent.id === row.original.id)} 
              update={update} 
              remove={remove} 
            />
          )
        } />
      </Table>
    </div>
  )
}
