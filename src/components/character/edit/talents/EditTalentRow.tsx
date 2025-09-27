"use client";

import ResetButton from "@/components/buttons/ResetButton";
import VerticalChangeButtons from "@/components/buttons/VerticalChangeButtons";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { Talent } from "@/domain/Character";
import { type UpsertCharacterTalentsType } from "@/persistence/characterSchemas";

import {
  flexRender,
  Row
} from "@tanstack/react-table";

import { Control } from "react-hook-form";
import { useTalentForm } from "@/components/character/edit/talents/useTalentForm";
import { Dispatch, SetStateAction } from "react";

export type AllowedTalentRoots = "grade" | "bonus";

type EditTalentRowProps = 
{
  row: Row<Talent>;
  control: Control<UpsertCharacterTalentsType>;
}

export default function EditTalentRow({ row, control }: EditTalentRowProps)
{
  const { talent, talentSetterFactory: talentSetterFactory } = useTalentForm(control, row.index, row.original);

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
              : <EditableCell name={cell.column.id} initialTalent={row.original} talent={talent} setTalentValue={talentSetterFactory(cell.column.id)} />
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
  name: AllowedTalentRoots;
  talent: Talent;
  initialTalent: Talent;
  setTalentValue: Dispatch<SetStateAction<number>>;
}

function EditableCell({ name, initialTalent, talent, setTalentValue }: EditableCellProps) 
{
  return (
    <div className="flex items-center">
      {talent[name]}
      <div className="flex items-center">
        <VerticalChangeButtons setValue={setTalentValue} />
        <ResetButton value={initialTalent[name]} setValue={setTalentValue} />
      </div>
    </div>
  );
}
