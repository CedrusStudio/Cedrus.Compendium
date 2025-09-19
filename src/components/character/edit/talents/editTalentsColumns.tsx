"use client"

import { AccessorKeyColumnDef, RowData } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { Talent } from "@/domain/Character"

declare module '@tanstack/table-core' 
{
  interface ColumnMeta<TData extends RowData, TValue>
  {
    initiallyHidden: boolean;
  }
}

export const columns: AccessorKeyColumnDef<Talent>[] = 
[
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="capitalize">{row.original.name}</span>
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    meta: { initiallyHidden: true },
  },
  {
    accessorKey: "characteristics",
    header: "Characteristics",
    meta: { initiallyHidden: true },
  },
  {
    accessorKey: "grade",
    header: "Grade",
  },
  {
    accessorKey: "bonus",
    header: "Bonus",
  },
  {
    accessorKey: "penalty",
    header: "Penalty",
    meta: { initiallyHidden: true },
  }
]