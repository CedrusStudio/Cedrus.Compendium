"use client"

import { AccessorKeyColumnDef } from "@tanstack/react-table"
import { Talent } from "@/domain/characters/Character"
import { useState } from "react"
import RollButton from "@/common/components/buttons/RollButton";
import { defaultColumns } from "@/application/characters/talents/defaultColumns"

export const columns: AccessorKeyColumnDef<Talent>[] = 
[
  ...defaultColumns,
  {
    id: "rzut",
    cell: ({ row }) => <RollCell talent={row.original} />
  },
] as AccessorKeyColumnDef<Talent>[];

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