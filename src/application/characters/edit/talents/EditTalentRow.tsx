"use client";

import ResetButton from "@/common/components/buttons/ResetButton";
import VerticalChangeButtons from "@/common/components/buttons/VerticalChangeButtons";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";
import { TableCell, TableRow } from "@/ui/table";
import { Talent } from "@/domain/characters/Character";
import { UpsertCharacterTalentsType } from "@/persistence/characterSchemas";
import { flexRender, Row } from "@tanstack/react-table";
import { type UseFieldArrayUpdate, type UseFieldArrayRemove } from "react-hook-form";
import { defaultTalent } from "@/domain/data/defaults";

export type AllowedTalentRoots = "grade" | "bonus";

type EditTalentRowProps = 
{
  row: Row<Talent>;
  initialTalent: Talent | undefined;
  index: number;
  update: UseFieldArrayUpdate<UpsertCharacterTalentsType, "talents">;
  remove: UseFieldArrayRemove;
}

export default function EditTalentRow({ row, initialTalent, index, update, remove }: EditTalentRowProps)
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
                  currentTalent={row.original}
                  initialTalent={initialTalent} 
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
  currentTalent: Talent;
  initialTalent: Talent | undefined;
  setTalentValue: (talent: Talent) => void;
}

function EditableCell({ name, initialTalent, currentTalent, setTalentValue }: EditableCellProps) 
{
  const initialOrDefaultTalent = initialTalent || defaultTalent;

  const setValue: React.Dispatch<React.SetStateAction<number>> = (input: number | ((prevState: number) => number)) =>
  {
    const prevState = currentTalent[name];
      console.log("prevState:", prevState);
      console.log("initialOrDefaultTalent:", initialOrDefaultTalent);
    
    const next = typeof input === "function" 
      ? (input as (p: number) => number)(prevState) 
      : (input as number);

      const talentX = { ...currentTalent, [name]: next };
      console.log("Setting talent value:", talentX);
    setTalentValue({ ...currentTalent, [name]: next });
  };

  return (
    <div className="flex items-center">
      {currentTalent[name]}
      <div className="flex items-center">
        <VerticalChangeButtons setValue={setValue} />
        <ResetButton defaultValuesWithSetters={[[initialOrDefaultTalent[name], setValue]]} />
      </div>
    </div>
  );
}
