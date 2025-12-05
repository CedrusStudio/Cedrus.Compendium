"use client";

import { useState } from "react";
import { Button } from "@/common/components/ui/button";
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/bestiarySlice";
import { toast } from "sonner";
import { ExternalParticipant, updateExternalParticipant } from "@/application/bestiary/battle/BattleCombatants";
import { displayedText } from "@/common/translations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/ui/label";
import { deleteIcon, editIcon } from "@/common/icons";
import { Textarea } from "@/common/components/ui/textarea";

type ExternalParticipantActionsCellProps = 
{
  participant: ExternalParticipant;
};

export default function ExternalParticipantActionsCell({ participant }: ExternalParticipantActionsCellProps) 
{
  const dispatch = useDispatch();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [initiativeGrade, setInitiativeGrade] = useState((participant.initiative?.grade ?? 3).toString());
  const [initiativeValue, setInitiativeValue] = useState((participant.initiative?.value ?? 0).toString());
  const [maxHealth, setMaxHealth] = useState((participant.maxHealth ?? 0).toString());
  const [name, setName] = useState(participant.name ?? "");
  const [notes, setNotes] = useState(participant.notes ?? "");

  const handleEditOpen = () => 
  {
    setInitiativeGrade((participant.initiative?.grade ?? 3).toString());
    setInitiativeValue((participant.initiative?.value ?? 0).toString());
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => 
  {
    const gradeValue = parseInt(initiativeGrade, 10);
    const valueValue = parseInt(initiativeValue, 10);
    const maxHealthValue = parseInt(maxHealth, 10);

    if (isNaN(gradeValue) || gradeValue < 1) 
    {
      toast.error(displayedText.invalidGrade || "Invalid grade value");
      return;
    }

    const updated = updateExternalParticipant(participant, 
    {
      name: name,
      maxHealth: maxHealthValue,
      notes: notes,
      initiative: 
      {
        grade: gradeValue || 3,
        value: valueValue || 0,
        bonus: 0,
        testBonus: 0,
      },
    });

    dispatch(actions.updateExternalParticipant(updated));
    setIsEditDialogOpen(false);
  };

  const handleDelete = () => 
  {
    dispatch(actions.removeExternalParticipant(participant.id));
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex gap-2">

        <Button size="sm" variant="outline" onClick={handleEditOpen}>
          {editIcon}
        </Button>

        <Button size="sm" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
          {deleteIcon}
        </Button>

      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>

        <DialogContent>

          <DialogHeader>
            <DialogTitle className="capitalize">{displayedText.editInitiative || "Edit Initiative"}</DialogTitle>
            <DialogDescription>
              {displayedText.editInitiativeDescription || "Update initiative grade and value for this participant."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="capitalize">
                {displayedText.name}
              </Label>

              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="maxHealth" className="capitalize">
                {displayedText.maxHealth}
              </Label>

              <Input
                id="maxHealth"
                type="number"
                value={maxHealth}
                onChange={e => setMaxHealth(e.target.value)}
                min="1"
                placeholder="3"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="initiativeGrade" className="capitalize">
                {displayedText.initiativeGrade}
              </Label>

              <Input
                id="initiativeGrade"
                type="number"
                value={initiativeGrade}
                onChange={e => setInitiativeGrade(e.target.value)}
                min="1"
                placeholder="3"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="initiativeValue" className="capitalize">
                {displayedText.initiativeValue}
              </Label>
              <Input
                id="initiativeValue"
                type="number"
                value={initiativeValue}
                onChange={e => setInitiativeValue(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes" className="capitalize">
                {displayedText.notes}
              </Label>

              <Textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <span className="capitalize">{displayedText.cancel}</span>
            </Button>
            <Button onClick={handleEditSave}>
              <span className="capitalize">{displayedText.save}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle className="capitalize">
              {displayedText.deleteParticipant || "Delete Participant"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {displayedText.confirmDelete || "Are you sure you want to remove this participant from battle?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel className="capitalize">{displayedText.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="capitalize bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {displayedText.delete || "Delete"}
            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
