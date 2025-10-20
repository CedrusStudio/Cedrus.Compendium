/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AccessorKeyColumnDef, RowData } from "@tanstack/react-table";
import { Button } from "@/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Talent } from "@/domain/characters/Talent";
import { displayedText } from "@/presentation/translations";

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
  characteristics: "characteristics",
  grade: "grade",
  bonus: "bonus",
  penalty: "penalty",
} as const;

export const defaultColumns: AccessorKeyColumnDef<Talent>[] = 
[
  {
    id: defaultColumnKeys.name,
    accessorKey: defaultColumnKeys.name,
    header: () => <span className="capitalize">{displayedText[defaultColumnKeys.name]}</span>,
    cell: ({ row }) => <span className="capitalize">{row.original.name}</span>,
    enableHiding: false
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
          <span className="capitalize">{displayedText[defaultColumnKeys.category]}</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    meta: { initiallyHidden: true },
  },
  {
    id: defaultColumnKeys.characteristics,
    accessorKey: defaultColumnKeys.characteristics,
    cell: ({ row }) => <span className="capitalize">{row.original.characteristics}</span>,
    header: () => <span className="capitalize">{displayedText[defaultColumnKeys.characteristics]}</span>,
    meta: { initiallyHidden: true },
  },
  {
    id: defaultColumnKeys.grade,
    accessorKey: defaultColumnKeys.grade,
    cell: ({ row }) => <span className="capitalize">{row.original.grade}</span>,
    header: () => <span className="capitalize">{displayedText[defaultColumnKeys.grade]}</span>,
  },
  {
    id: defaultColumnKeys.bonus,
    accessorKey: defaultColumnKeys.bonus,
    cell: ({ row }) => <span className="capitalize">{row.original.bonus}</span>,
    header: () => <span className="capitalize">{displayedText[defaultColumnKeys.bonus]}</span>,
  },
  {
    id: defaultColumnKeys.penalty,
    accessorKey: defaultColumnKeys.penalty,
    cell: ({ row }) => <span>{row.original.penalty}</span>,
    header: () => <span className="capitalize">{displayedText[defaultColumnKeys.penalty]}</span>,
    meta: { initiallyHidden: true },
  }
]