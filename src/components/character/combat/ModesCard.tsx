"use client";

import { Mode } from "@/domain/Character";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from "@/components/ui/label"
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import FieldView from "../FieldView";

export default function ModesCard({ name, modes }: { name: string, modes: Mode[]})
{  
  const [selectedMode, setSelectedMode] = useState<string>("None");
  const selectedModeObj = modes.find(mode => mode.name === selectedMode);

  return (
    <Card className='bg-muted flex flex-col'>
      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{name}</CardTitle>
      </CardHeader>

      <CardContent className='flex flex-col gap-y-4 flex-1'>

        <Select defaultValue="None" onValueChange={setSelectedMode}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">None</SelectItem>
            {
              modes.map(mode => (
                <SelectItem key={mode.name} value={mode.name}>
                  <div className="flex items-center gap-3">
                    <Label htmlFor={mode.name} >
                      <div className="flex items-start text-start gap-2">
                        <FieldView
                          name={mode.name} 
                          value={mode.grade} 
                          className="gap-1" 
                          nameClassName="w-4xs"
                        />
                      </div>
                    </Label>
                  </div>
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