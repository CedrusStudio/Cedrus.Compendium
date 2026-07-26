"use client";

import { Mode } from "@/domain/characters/combat/Mode";
import { DataCard } from '@/common/components/cards/DataCard';
import { Label } from "@/ui/label";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Field } from "@/common/components/fields";
import { displayedText } from "@/common/translations";
import TagsView from "@/common/components/tags/TagsView";
import ExpandableText from "@/common/components/text/ExpandableText";
import { Separator } from "@/common/components/ui/separator";
import { Button } from "@/ui/button";
import { Plus, X, Check } from "lucide-react";

type ModesCardProps =
{
  name: string;
  modes: Mode[];
  selectedModeId?: string;
  onSelectedModeIdChange?: (modeId: string | undefined) => void;
  linkedProfiles?: LinkedModeProfile[];
  /** Ids of modes that have a linked wzmocnienie — surfaced as a badge in the list. */
  linkedModeIds?: string[];
};

type LinkedModeProfile =
{
  id: string;
  name: string;
  isActive: boolean;
  onApply: () => void;
  onWithdraw: () => void;
};

const NONE_SELECTED_MODE = '__none__';

export default function ModesCard({ name, modes, selectedModeId, onSelectedModeIdChange, linkedProfiles = [] }: ModesCardProps)
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
              <ExpandableText
                text={selectedModeObj.description}
                className="text-sm text-muted-foreground text-center italic"
                clampClassName="line-clamp-4"
                threshold={220}
              />
              <TagsView tags={selectedModeObj.tags} variant="outline" />

              {
                linkedProfiles.length > 0 && (
                  <div className="mt-2 flex w-full flex-col gap-2 rounded-lg border border-border/60 bg-background/60 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {displayedText.linkedProfile}
                    </p>

                    {
                      linkedProfiles.map(profile => (
                        <div key={profile.id} className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background px-3 py-2">
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            {profile.isActive && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                            {profile.name}
                          </span>

                          <div className="flex items-center gap-1">
                            <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={profile.onApply} disabled={profile.isActive} aria-label={displayedText.applyBuff} title={displayedText.applyBuff}>
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={profile.onWithdraw} disabled={!profile.isActive} aria-label={displayedText.withdrawBuff} title={displayedText.withdrawBuff}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )
              }
            </div>
          )
        }
        </div>

    </DataCard>
  );
};