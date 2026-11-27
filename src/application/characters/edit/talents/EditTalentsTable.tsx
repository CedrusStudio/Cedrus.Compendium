"use client";

import type { AccessorKeyColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { basicTalents, type Talent } from "@/domain/characters/Talent";
import CharacterTalentTable from "@/application/characters/talents/CharacterTalentTable";
import { type TalentsDto } from "@/persistence/schemas/characters/talentSchema";
import { useFieldArray, UseFieldArrayAppend, useFormContext } from "react-hook-form";
import EditTalentRow from "@/application/characters/edit/talents/EditTalentRow";
import { displayedText } from "@/common/translations";
import AddTalentView from "@/application/characters/edit/talents/AddTalentView";
import { Button } from "@/common/components/ui/button";
import { toast } from "sonner";
import { deleteIcon } from "@/common/icons";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog";
import { Description } from "@radix-ui/react-dialog";

interface DataTableProps
{
  columns: AccessorKeyColumnDef<Talent>[]
  initialTalents: Talent[];
}

export function EditTalentsTable({ columns, initialTalents }: DataTableProps)
{
  const { control } = useFormContext<TalentsDto>();
  const { fields, update, remove, append, replace } = useFieldArray
  ({
    name: "talents",
    control,
    keyName: "_rhfId" // Preserves your original id field
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <CharacterTalentTable
      data={fields}
      columns={columns}
      renderActions={showAddedTalent => (
        <>
          <AddTalentView append={append} setNameFilter={showAddedTalent} />
          <AddBasicTalentButton talents={fields} append={append} />

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>

            <DialogTrigger asChild>
              <Button type="button" variant="destructive" aria-label="Usuń wszystkie talenty">
                {deleteIcon}
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Czy na pewno chce usunąć wszystkie talenty postaci?</DialogTitle>
              </DialogHeader>

              <Description className="text-sm text-muted-foreground">
                Później będzie i tak wymagane kliknięcie zapisz
              </Description>

              <DialogFooter>

                <div className="flex flex-col-reverse md:flex-row gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    <span className="first-letter:capitalize">{displayedText.cancel}</span>
                  </Button>

                  <Button type="button" onClick={() => replace([])} variant="destructive" >
                    {"Usuń wszystkie talenty"}
                  </Button>
                </div>
                
              </DialogFooter>
              
            </DialogContent>
          </Dialog>
        </>
      )}
      renderRow={row => (
        <EditTalentRow
          key={row.id}
          row={row}
          index={row.index}
          initialTalent={initialTalents.find(talent => talent.id === row.original.id)}
          update={update}
          remove={remove}
        />
      )}
    />
  );
}

type AddBasicTalentButtonProps =
{
  talents: Talent[];
  append: UseFieldArrayAppend<TalentsDto, "talents">;
}

function AddBasicTalentButton({ talents, append }: AddBasicTalentButtonProps) 
{
  const handleAddBasicTalent = () => 
  {
    for (const talent of basicTalents)
    {
      if (talents.some(t => t.name === talent.name)) continue;
      append(talent);
    }

    toast.success(`Dodano podstawowe talenty. Kliknij "zapisz" aby je utrwalić.`);
  };

  return (
    <Button variant="outline" onClick={handleAddBasicTalent} type="button">
      {"Dodaj podstawowe talenty"}
    </Button>
  )
} 
