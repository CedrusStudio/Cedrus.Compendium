"use client";

import { Mode } from "@/domain/characters/combat/Mode";
import { DataCard } from '@/common/components/cards/DataCard';
import { Label } from "@/ui/label";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Field } from "@/common/components/fields";
import { displayedText } from "@/common/translations";
import TagsView from "@/common/components/tags/TagsView";
import { Separator } from "@/common/components/ui/separator";

type ModesCardProps =
{
  name: string;
  modes: Mode[];
  selectedModeId?: string;
  onSelectedModeIdChange?: (modeId: string | undefined) => void;
};

const NONE_SELECTED_MODE = '__none__';

export default function ModesCard({ name, modes, selectedModeId, onSelectedModeIdChange }: ModesCardProps)
{  
  const [internalSelectedModeId, setInternalSelectedModeId] = useState<string | undefined>(undefined);
  const resolvedSelectedModeId = selectedModeId ?? internalSelectedModeId;
  const selectedModeObj = modes.find(mode => mode.id === resolvedSelectedModeId);

  const handleSelectedModeChange = (value: string) =>
  {
    const nextSelectedModeId = value === NONE_SELECTED_MODE ? undefined : value;

    if (onSelectedModeIdChange)
    {
      onSelectedModeIdChange(nextSelectedModeId);
      return;
    }

    setInternalSelectedModeId(nextSelectedModeId);
  };

  return (
    <DataCard 
      title={name} 
      variant="muted" 
      className='flex flex-col'
      contentClassName='flex flex-col place-content-start place-items-center gap-y-4 flex-1'
    >

        <Select value={resolvedSelectedModeId ?? NONE_SELECTED_MODE} onValueChange={handleSelectedModeChange}>
          
          <SelectTrigger className="w-fit capitalize">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={NONE_SELECTED_MODE}>{displayedText.none}</SelectItem>
            {
              modes.map(mode => (
                <SelectItem key={mode.id} value={mode.id}>
                  <Label htmlFor={mode.id} className="flex items-center gap-3" >
                    <div className="flex items-start text-start gap-2">
                      <Field value={mode.grade} className="gap-1">
                        <Field.Label className="w-4xs">{mode.name}</Field.Label>
                        <Field.Value />
                      </Field>
                    </div>
                  </Label>
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>

        <div className="w-full">
        {
          selectedModeObj && (
            <div className="pt-0.5 flex flex-col place-items-center place-content-center gap-2">
              <Separator />
              <p className="text-sm text-muted-foreground text-center italic">
                {selectedModeObj.description}
              </p>
              <TagsView tags={selectedModeObj.tags} variant="outline" />
            </div>
          )
        }
        </div>

    </DataCard>
  );
};