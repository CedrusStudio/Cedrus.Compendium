"use client"

import { Character } from "@/domain/characters/Character";
import { AccessorKeyColumnDef } from "@tanstack/react-table"

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
  }
]