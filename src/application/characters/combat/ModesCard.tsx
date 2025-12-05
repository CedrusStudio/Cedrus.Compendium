"use client";

import { Mode } from "@/domain/characters/combat/Mode";
import { Card, CardContent, CardTitle } from '@/ui/card';
import { Label } from "@/ui/label";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Field } from "@/common/components/fields";
import { displayedText } from "@/presentation/translations";
import TagsView from "@/common/components/tags/TagsView";
import { Separator } from "@/common/components/ui/separator";

export default function ModesCard({ name, modes }: { name: string, modes: Mode[]})
{  
  const [selectedMode, setSelectedMode] = useState<string>(displayedText.none);
  const selectedModeObj = modes.find(mode => mode.name === selectedMode);

  return (
    <Card className='bg-muted flex flex-col'>
      <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{name}</CardTitle>

      <CardContent className='flex flex-col place-content-start place-items-center gap-y-4 flex-1'>

        <Select defaultValue={displayedText.none} onValueChange={setSelectedMode}>
          
          <SelectTrigger className="w-fit capitalize">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={displayedText.none}>{displayedText.none}</SelectItem>
            {
              modes.map(mode => (
                <SelectItem key={mode.id} value={mode.name}>
                  <Label htmlFor={mode.name} className="flex items-center gap-3" >
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

      </CardContent>
    </Card>
  );
};