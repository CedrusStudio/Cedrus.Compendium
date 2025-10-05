"use client"

import { AccessorKeyColumnDef, RowData } from "@tanstack/react-table"
import { Button } from "@/ui/button"
import { ArrowUpDown } from "lucide-react"
import { Talent } from "@/domain/characters/Character"

declare module '@tanstack/table-core' 
{
  interface ColumnMeta<TData extends RowData, TValue>
  {
    initiallyHidden: boolean;
  }
}

export const defaultColumnKeys =
{
  name: "name",
  category: "category",
  characteristic: "characteristics",
  grade: "grade",
  bonus: "bonus",
  penalty: "penalty",
} as const;

export const defaultColumnHeaders =
{
  name: "Nazwa",
  category: "Kategoria",
  characteristic: "Cechy",
  grade: "Ranga",
  bonus: "Bonus",
  penalty: "Kara",
} as const;

export const defaultColumns: AccessorKeyColumnDef<Talent>[] = 
[
  {
    id: defaultColumnKeys.name,
    accessorKey: defaultColumnKeys.name,
    header: defaultColumnHeaders.name,
    cell: ({ row }) => <span className="capitalize">{row.original.name}</span>
  },
  {
    id: defaultColumnKeys.category,
    accessorKey: defaultColumnKeys.category,
    cell: ({ row }) => <span className="capitalize">{row.original.category}</span>,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          type="button"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {defaultColumnHeaders.category}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    meta: { initiallyHidden: true },
  },
  {
    id: defaultColumnKeys.characteristic,
    accessorKey: defaultColumnKeys.characteristic,
    cell: ({ row }) => <span className="capitalize">{row.original.characteristics}</span>,
    header: defaultColumnHeaders.characteristic,
    meta: { initiallyHidden: true },
  },
  {
    id: defaultColumnKeys.grade,
    accessorKey: defaultColumnKeys.grade,
    cell: ({ row }) => <span className="capitalize">{row.original.grade}</span>,
    header: defaultColumnHeaders.grade,
  },
  {
    id: defaultColumnKeys.bonus,
    accessorKey: defaultColumnKeys.bonus,
    cell: ({ row }) => <span className="capitalize">{row.original.bonus}</span>,
    header: defaultColumnHeaders.bonus,
  },
  {
    id: defaultColumnKeys.penalty,
    accessorKey: defaultColumnKeys.penalty,
    cell: ({ row }) => <span className="capitalize">{row.original.penalty}</span>,
    header: defaultColumnHeaders.penalty,
    meta: { initiallyHidden: true },
  }
]