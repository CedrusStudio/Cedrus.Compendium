"use client";

import { useState } from "react";
import { Button } from "@/common/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Textarea } from "@/common/components/ui/textarea";
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/bestiarySlice";
import { createExternalParticipant } from "@/application/bestiary/battle/ExternalParticipant";
import { displayedText } from "@/presentation/translations";
import { toast } from "sonner";
import { FaUserPlus } from "react-icons/fa";

export default function AddExternalParticipantDialog() 
{
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [maxHealth, setMaxHealth] = useState("50");
  const [initiativeGrade, setInitiativeGrade] = useState("3");
  const [initiativeTotalBonus, setInitiativeTotalBonus] = useState("0");
  const [notes, setNotes] = useState("");

  const handleAdd = () => 
  {
    if (!name.trim()) 
    {
      toast.error(displayedText.nameRequired);
      return;
    }

    const healthValue = parseInt(maxHealth) || 50;
    const gradeValue = parseInt(initiativeGrade) || 3;
    const valueValue = parseInt(initiativeTotalBonus) || 0;
    const participant = createExternalParticipant(name.trim(), healthValue, gradeValue, valueValue, notes.trim());
    
    dispatch(actions.addExternalParticipant(participant));

    // Reset form
    setName("");
    setMaxHealth("50");
    setInitiativeGrade("3");
    setInitiativeTotalBonus("0");
    setNotes("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogTrigger asChild>
        <Button variant="outline">
          <FaUserPlus className="mr-2" />
          {displayedText.addExternalParticipant}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex items-center">
          <DialogTitle>{displayedText.addExternalParticipant}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">

            <Label htmlFor="name">
              <span className="first-letter:capitalize">{displayedText.name}</span>
            </Label>

            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder={displayedText.enterName}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">

            <Label htmlFor="maxHealth">
              {displayedText.maxHealth}
            </Label>

            <Input
              id="maxHealth"
              type="number"
              value={maxHealth}
              onChange={e => setMaxHealth(e.target.value)}
              className="col-span-3"
              min="1"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">

            <Label htmlFor="initiative.grade">
              {displayedText.initiativeGrade}
            </Label>

            <Input
              id="initiative.grade"
              type="number"
              value={initiativeGrade}
              onChange={e => setInitiativeGrade(e.target.value)}
              className="col-span-3"
              min="1"
              placeholder="10"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">

            <Label htmlFor="initiative.value">
              {displayedText.initiativeValue}
            </Label>
            
            <Input
              id="initiative.value"
              type="number"
              value={initiativeTotalBonus}
              onChange={e => setInitiativeTotalBonus(e.target.value)}
              className="col-span-3"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">

            <Label htmlFor="notes">
              {displayedText.notes}
            </Label>

            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="col-span-3"
              placeholder={displayedText.enterNotes}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>

          <Button variant="outline" onClick={() => setOpen(false)}>
            <span className="first-letter:capitalize">{displayedText.cancel}</span>
          </Button>

          <Button onClick={handleAdd}>
            <span className="first-letter:capitalize">{displayedText.save}</span>
          </Button>
          
        </DialogFooter>
        
      </DialogContent>
    </Dialog>
  );
}
