"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/ui/table";
import { ExternalParticipant, updateExternalParticipant } from "@/application/bestiary/battle/ExternalParticipant";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { actions } from "@/persistence/slices/bestiarySlice";
import { RootState } from "@/persistence/slices/store";
import { Checkbox } from "@/common/components/ui/checkbox";
import { FaPencilAlt } from "react-icons/fa";
import { deleteIcon, rollIcon } from "@/presentation/icons";
import { displayedText } from "@/presentation/translations";
import { toast } from "sonner";
import { Textarea } from "@/common/components/ui/textarea";
import { rollInitiativeBase } from "@/domain/characters/statistics/Attributes";
import InitiativeCell from "./InitiativeCell";

type ExternalParticipantRowProps = 
{
  participant: ExternalParticipant;
  isSelected: boolean;
  onSelectionChange: (selected: boolean) => void;
  columnCount: number;
};

export default function ExternalParticipantRow({ 
  participant, 
  isSelected, 
  onSelectionChange,
  columnCount 
}: ExternalParticipantRowProps) 
{
  const dispatch = useDispatch();
  const initiativeEntry = useSelector((state: RootState) => state.bestiary.initiatives[participant.id]);
  const [isEditing, setIsEditing] = useState(false);
  
  // Editable fields
  const [name, setName] = useState(participant.name);
  const [health, setHealth] = useState(participant.health.toString());
  const [maxHealth, setMaxHealth] = useState(participant.maxHealth.toString());
  const [initiativeGrade, setInitiativeGrade] = useState((participant?.initiative?.grade ?? 3).toString());
  const [initiativeValue, setInitiativeValue] = useState((participant?.initiative?.value ?? 0).toString());
  const [notes, setNotes] = useState(participant.notes ?? "");
  const [manualInitiative, setManualInitiative] = useState(initiativeEntry?.initiative?.toString() ?? "");

  const currentInitiative = initiativeEntry?.initiative ?? null;

  const handleSave = () => 
  {
    const healthValue = parseInt(health) || 0;
    const maxHealthValue = parseInt(maxHealth) || 100;
    const initiativeGradeValue = parseInt(initiativeGrade) || 10;
    const initiativeValueValue = parseInt(initiativeValue) || 0;
    
    const updated = updateExternalParticipant(participant, {
      name: name.trim() || participant.name,
      health: Math.min(healthValue, maxHealthValue),
      maxHealth: maxHealthValue,
      initiative: { grade: initiativeGradeValue, value: initiativeValueValue, bonus: 0, testBonus: 0 },
      notes: notes.trim(),
    });
    
    dispatch(actions.updateExternalParticipant(updated));
    
    // Update initiative if changed
    const manualInitiativeValue = parseInt(manualInitiative);
    if (!isNaN(manualInitiativeValue) && manualInitiativeValue !== currentInitiative) 
    {
      dispatch(actions.setInitiative({ characterId: participant.id, initiative: manualInitiativeValue }));
    }
    
    setIsEditing(false);
    toast.success(displayedText.changesSaved);
  };

  const handleCancel = () => 
  {
    setName(participant.name);
    setHealth(participant.health.toString());
    setMaxHealth(participant.maxHealth.toString());
    setInitiativeGrade((participant?.initiative?.grade ?? 3).toString());
    setInitiativeValue((participant?.initiative?.value ?? 0).toString());
    setNotes(participant.notes ?? "");
    setManualInitiative(currentInitiative?.toString() ?? "");
    setIsEditing(false);
  };

  const handleRollInitiative = () => 
  {
    const grade = parseInt(initiativeGrade) || (participant?.initiative?.grade ?? 3);
    const value = parseInt(initiativeValue) || (participant?.initiative?.value ?? 0);
    const roll = rollInitiativeBase(grade, value, 0, 0);
    dispatch(actions.rollInitiativeForCharacter({ characterId: participant.id, rollResult: roll }));
    setManualInitiative(roll.toString());
  };

  const handleDelete = () => 
  {
    dispatch(actions.removeExternalParticipant(participant.id));
    toast.success(displayedText.externalParticipant + " " + displayedText.removed);
  };

  if (isEditing) 
  {
    return (
      <TableRow>

        <TableCell className="text-center">
          <Checkbox checked={isSelected} onCheckedChange={onSelectionChange} />
        </TableCell>

        <TableCell className="border-r">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full"
            placeholder={displayedText.enterName}
          />
        </TableCell>

        <TableCell className="border-r">
          <div className="flex flex-row gap-2">
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                value={manualInitiative}
                onChange={e => setManualInitiative(e.target.value)}
                className="w-20"
                placeholder="0"
              />
              <Button size="sm" variant="outline" onClick={handleRollInitiative}>
                {rollIcon}
              </Button>
            </div>
            <div className="flex gap-1 items-center text-xs">
              <span>{displayedText.grade}:</span>
              <Input
                type="number"
                value={initiativeGrade}
                onChange={(e) => setInitiativeGrade(e.target.value)}
                className="w-16 h-7"
                min="1"
              />
            </div>
            <div className="flex gap-1 items-center text-xs">
              <span>{displayedText.value}:</span>
              <Input
                type="number"
                value={initiativeValue}
                onChange={(e) => setInitiativeValue(e.target.value)}
                className="w-16 h-7"
              />
            </div>
          </div>
        </TableCell>

        <TableCell className="border-r">
          <div className="flex gap-2">
            <Input
              type="number"
              value={health}
              onChange={(e) => setHealth(e.target.value)}
              className="w-16"
              min="0"
            />
            <span className="self-center">/</span>
            <Input
              type="number"
              value={maxHealth}
              onChange={(e) => setMaxHealth(e.target.value)}
              className="w-16"
              min="1"
            />
          </div>
        </TableCell>

        <TableCell colSpan={columnCount - 8}>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[60px]"
            placeholder={displayedText.enterNotes}
          />
        </TableCell>

        <TableCell>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <span className="capitalize">{displayedText.cancel}</span>
            </Button>
            <Button size="sm" onClick={handleSave}>
              <span className="capitalize">{displayedText.save}</span>
            </Button>
          </div>
        </TableCell>

      </TableRow>
    );
  }

  return (
    <TableRow>

      <TableCell className="text-center">
        <Checkbox checked={isSelected} onCheckedChange={onSelectionChange} />
      </TableCell>

      <TableCell className="font-bold border-r text-center">
        <span>{participant.name}</span>
      </TableCell>

      <TableCell className="border-r">
        <InitiativeCell 
          id={participant.id} 
          initiative={participant.initiative ?? { grade: 3, value: 0, bonus: 0, testBonus: 0 }} 
        />
      </TableCell>

      <TableCell className="text-center border-r">
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              value={health}
              onChange={e => {
                const newHealth = e.target.value;
                setHealth(newHealth);
                const healthValue = parseInt(newHealth) || 0;
                const maxHealthValue = parseInt(maxHealth) || 100;
                const updated = updateExternalParticipant(participant, 
                {
                  health: Math.min(Math.max(0, healthValue), maxHealthValue),
                });
                dispatch(actions.updateExternalParticipant(updated));
              }}
              className="w-16 text-center"
              min="0"
              max={maxHealth}
            />
            <span>/</span>
            <span className="text-lg">{participant.maxHealth}</span>
          </div>
        </div>
      </TableCell>

      <TableCell colSpan={columnCount - 8}>
        {participant.notes && (
          <div className="text-sm text-muted-foreground">
            {participant.notes}
          </div>
        )}
      </TableCell>

      <TableCell>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <FaPencilAlt />
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            {deleteIcon}
          </Button>
        </div>
      </TableCell>
      
    </TableRow>
  );
}
