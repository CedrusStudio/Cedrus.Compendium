"use client";

import ResetButton from "@/components/buttons/ResetButton";
import VerticalChangeButtons from "@/components/buttons/VerticalChangeButtons";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { Talent } from "@/domain/Character";
import { UpsertCharacterTalentsType } from "@/persistence/characterSchemas";

import {
  flexRender,
  Row
} from "@tanstack/react-table"

import { useState } from "react"
import { Control, ControllerRenderProps, useController } from "react-hook-form"

type EditTalentRow = 
{
  row: Row<Talent>;
  control?: Control<UpsertCharacterTalentsType>;
}

export default function EditTalentRow({ row, control }: EditTalentRow)
{
  const [talent, setTalent] = useState(row.original);
  
  const { field: talentField } = useController
  ({
    name: `${row.index}` as const,
    control: control,
    defaultValue: row.original,
  });

  return (
    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
    {
      row.getVisibleCells().map(cell => 
      {
        return (
          <TableCell key={cell.id} >
          {
            cell.column.id !== "grade" && cell.column.id !== "bonus"
              ? flexRender(cell.column.columnDef.cell, cell.getContext())
              : <EditableCell name={cell.column.id} talent={talent} setTalent={setTalent} controlTalent={talentField} />
          }
          </TableCell>
        )
      })
    }
    </TableRow>
  );
};

type EditableCellProps = 
{
  name: "grade" | "bonus";
  talent: Talent;
  setTalent: React.Dispatch<React.SetStateAction<Talent>>;
  controlTalent?: ControllerRenderProps<UpsertCharacterTalentsType>;
}

function EditableCell({ name, talent, setTalent, controlTalent }: EditableCellProps) 
{
  const setValue: React.Dispatch<React.SetStateAction<number>> = (value: number | ((prevState: number) => number)): void =>
  {
    setTalent(prev => 
    {
      const newValue = typeof value === "function" ? value(prev[name]) : value;
      const newTalent = { ...prev, [name]: newValue };
      controlTalent?.onChange(newTalent);
      return newTalent as Talent;
    });
  }
  
  return (
    <div className="flex items-center">
      {talent[name]}
      <div className="flex items-center">
        <VerticalChangeButtons setValue={setValue} />
        <ResetButton value={talent[name] as number} setValue={setValue} />
      </div>
    </div>
  );
}