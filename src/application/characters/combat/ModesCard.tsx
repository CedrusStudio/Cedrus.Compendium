"use client";

import { Mode } from "@/domain/characters/combat/Mode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';
import { Label } from "@/ui/label";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import FieldView from "@/common/components/fields/FieldView";
import { displayedText } from "@/presentation/translations";

export default function ModesCard({ name, modes }: { name: string, modes: Mode[]})
{  
  const [selectedMode, setSelectedMode] = useState<string>(displayedText.none);
  const selectedModeObj = modes.find(mode => mode.name === selectedMode);

  return (
    <Card className='bg-muted flex flex-col w-full '>
      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{name}</CardTitle>
      </CardHeader>

      <CardContent className='flex flex-col items-center justify-center md:items-start md:justify-start gap-y-4 flex-1'>

        <Select defaultValue={displayedText.none} onValueChange={setSelectedMode}>
          
          <SelectTrigger className="w-[180px] capitalize">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={displayedText.none}>{displayedText.none}</SelectItem>
            {
              modes.map(mode => (
                <SelectItem key={mode.name} value={mode.name}>
                  <Label htmlFor={mode.name} className="flex items-center gap-3" >
                    <div className="flex items-start text-start gap-2">
                      <FieldView value={mode.grade} className="gap-1" childrenClassName="w-4xs">
                        {mode.name}
                      </FieldView>
                    </div>
                  </Label>
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>

        <div>
        {
          selectedModeObj && (
            <div className="pt-4 border-t border-border/40">
              <p className="text-sm text-muted-foreground text-center italic">
                {selectedModeObj.description}
              </p>
            </div>
          )
        }
        </div>

      </CardContent>
    </Card>
  );
};