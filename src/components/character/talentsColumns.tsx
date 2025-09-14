"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { Talent } from "@/domain/Character"
import { useState } from "react"
import RollButton from "@/components/character/RollButton";

export const columns: ColumnDef<Talent>[] = 
[
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => 
    {
        return <span className="capitalize">{row.original.name}</span>
    },
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
  },
  {
    id: "roll",
    cell: ({ row }) => <RollCell talent={row.original} />
  },
]

function RollCell({ talent }: { talent: Talent }) 
{
  const [rollResult, setRollResult] = useState(0);

  const handleRoll = () => 
  {
    const result = Math.floor(Math.random() * talent.grade * 2) + 1 + talent.bonus;
    setRollResult(result);
  };

  return <RollButton onClick={handleRoll} rollResult={rollResult} />;
}