"use client";

import ResetButton from "@/common/components/buttons/ResetButton";
import VerticalChangeButtons from "@/common/components/buttons/VerticalChangeButtons";
import RemoveFromArrayButton from "@/ui/RemoveFromArrayButton";
import {
  TableCell,
  TableRow,
} from "@/ui/table"
import { Talent } from "@/domain/Character";
import { UpsertCharacterTalentsType } from "@/persistence/characterSchemas"

import {
  flexRender,
  Row
} from "@tanstack/react-table";

import { type UseFieldArrayUpdate, type UseFieldArrayRemove } from "react-hook-form";

export type AllowedTalentRoots = "grade" | "bonus";

type EditTalentRowProps = 
{
  row: Row<Talent>;
  initialTalent: Talent;
  formTalent: Talent;
  index: number;
  update: UseFieldArrayUpdate<UpsertCharacterTalentsType, "talents">;
  remove: UseFieldArrayRemove;
}

export default function EditTalentRow({ row, formTalent, initialTalent, index, update, remove }: EditTalentRowProps)
{
  const updateTalent = (updatedTalent: Talent) => update(index, updatedTalent);

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
              : <EditableCell 
                  name={cell.column.id} 
                  initialTalent={initialTalent} 
                  talent={formTalent} 
                  setTalentValue={updateTalent} 
                />
          }
          </TableCell>
        )
      })
    }
      <TableCell className="flex items-center justify-center">
        <RemoveFromArrayButton remove={remove} index={index} />
      </TableCell>
    </TableRow>
  );
};

type EditableCellProps = 
{
  name: AllowedTalentRoots;
  talent: Talent;
  initialTalent: Talent;
  setTalentValue: (talent: Talent) => void;
}

function EditableCell({ name, initialTalent, talent, setTalentValue }: EditableCellProps) 
{
  const setValue: React.Dispatch<React.SetStateAction<number>> = (input: number | ((prevState: number) => number)) =>
  {
    const prevState = talent[name];
    
    const next = typeof input === "function" 
      ? (input as (p: number) => number)(prevState) 
      : (input as number);

    setTalentValue({ ...talent, [name]: next });
  };

  return (
    <div className="flex items-center">
      {talent[name]}
      <div className="flex items-center">
        <VerticalChangeButtons setValue={setValue} />
        <ResetButton defaultValuesWithSetters={[[initialTalent[name], setValue]]} />
      </div>
    </div>
  );
}
