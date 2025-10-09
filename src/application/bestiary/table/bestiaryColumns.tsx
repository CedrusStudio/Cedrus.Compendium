"use client"

import { Button } from "@/common/components/ui/button";
import { Character } from "@/domain/characters/Character";
import { AccessorKeyColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react";

export const columnKeys =
{
  addToBattle: "addToBattle",
  name: "name",
  health: "health",
  barrier: "barrier",
  defenses: "defenses",
  offenses: "offenses",
  attributes: "attributes",
  characteristics: "characteristics",
  maneuvers: "maneuvers",
  stances: "stances",
  states: "states",
  category: "category",
  characterView: "characterView",
} as const;

export const columnHeaders =
{
  addToBattle: "Dodaj do walki",
  name: "Nazwa",
  health: "Zdrowie",
  barrier: "Bariera",
  defenses: "Obrony",
  offenses: "Ataki",
  attributes: "Atrybuty",
  characteristics: "Cechy",
  maneuvers: "Manewry",
  stances: "Postawy",
  states: "Stany",
  category: "Kategoria",
  characterView: "Widok postaci",
} as const;

export const columns: AccessorKeyColumnDef<Character>[] = 
[
  {
    id: columnKeys.name,
    accessorKey: columnKeys.name,
    header: columnHeaders.name,
    cell: ({ row }) => <span className="capitalize">{row.original.name}</span>
  },
  {
    id: columnKeys.category,
    accessorKey: columnKeys.category,
    cell: ({ row }) => <span className="capitalize">{row.original.category}</span>,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          type="button"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {columnHeaders.category}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    }
  }
]