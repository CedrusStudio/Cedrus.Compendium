"use client";

import { Mode } from "@/domain/Character";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import FieldViewWithInfo from "@/components/character/FieldViewWithInfo";
import { useState } from "react";

export default function ModesCard({ name, modes }: { name: string, modes: Mode[]})
{  
  const [selectedMode, setSelectedMode] = useState<string>("None");
  const selectedModeObj = modes.find(mode => mode.name === selectedMode);


  return (
    <Card className='bg-muted'>
      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{name}</CardTitle>
      </CardHeader>

      <CardContent className='flex flex-col gap-y-4'>

        <RadioGroup defaultValue="comfortable" value={selectedMode} onValueChange={setSelectedMode} >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="None" id="None" />
            <Label htmlFor="None">None</Label>
          </div>

          {
            modes.map(mode => (
              <div key={mode.name} className="flex items-center gap-3">
                <RadioGroupItem value={mode.name} id={mode.name} />
                <Label htmlFor={mode.name} >
                  <div className="flex items-start text-start gap-2">
                    <FieldViewWithInfo 
                      name={mode.name} 
                      value={mode.grade} 
                      infoContent={mode.description} 
                      className="gap-1" 
                      nameClassName="w-4xs"
                    />
                  </div>
                </Label>
              </div>
            ))
          }
        </RadioGroup>

        {selectedModeObj && (
          <div className="mt-auto pt-4 border-t border-border/40">
            <p className="text-sm text-muted-foreground text-center italic">
              {selectedModeObj.description}
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  );
};