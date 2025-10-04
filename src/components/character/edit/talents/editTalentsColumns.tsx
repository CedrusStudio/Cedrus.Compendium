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
    accessorKey: "nazwa",
    header: "Nazwa",
    cell: ({ row }) => <span className="capitalize">{row.original.name}</span>
  },
  {
    accessorKey: "kategoria",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kategoria
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    meta: { initiallyHidden: true },
  },
  {
    accessorKey: "cechy",
    header: "Cechy",
    meta: { initiallyHidden: true },
  },
  {
    accessorKey: "ranga",
    header: "Ranga",
  },
  {
    accessorKey: "bonus",
    header: "Bonus",
  },
  {
    accessorKey: "kara",
    header: "Kara",
    meta: { initiallyHidden: true },
  }
]