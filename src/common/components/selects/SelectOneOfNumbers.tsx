"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';

type SelectOneOfNumbersProps = 
{
  defaultValue: number;
  items: {label: string, value: number}[];
  onChange: (value: number) => void;
};

export default function SelectOneOfNumbers({ defaultValue, items, onChange }: SelectOneOfNumbersProps)
{
  const [currentValue, setCurrentValue] = useState(defaultValue);
  
  const handleOnSelectedChange = (value: string) => 
  {
    const numValue = Number(value);
    setCurrentValue(numValue);
    onChange(numValue);
  };

  return (
    <Select defaultValue={String(defaultValue)} onValueChange={handleOnSelectedChange}>
      <div className={"capitalize"}>
        <SelectTrigger className='capitalize border-0'>
          <SelectValue>
          {
            items.find(item => item.value === currentValue)?.label ?? currentValue
          }
          </SelectValue>
        </SelectTrigger>
      </div>

      <SelectContent>
      {
        items.map((item, index) => (
          <SelectItem key={index} value={String(item.value)}>
            <span className='capitalize'>{item.label}</span>
          </SelectItem>
        ))
      }
      </SelectContent>
    </Select>
  );
};