"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Talent } from "@/domain/Character"
import { useState } from "react"
import RollButton from "@/components/character/RollButton";
import { defaultColumns } from "@/components/character/talents/defaultColumns"

export const columns: ColumnDef<Talent>[] = 
[
  ...defaultColumns,
  {
    id: "rzut",
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