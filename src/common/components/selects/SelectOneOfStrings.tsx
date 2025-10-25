"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';

type SelectOneOfProps = 
{
  defaultValue: string;
  items: {label: string, value: string}[];
  onChange: (value: string) => void;
};

export default function SelectOneOfStrings({ defaultValue, items, onChange }: SelectOneOfProps)
{
  const [currentValue, setCurrentValue] = useState(defaultValue);
  const handleOnSelectedChange = (value: string) => 
  {
    setCurrentValue(value);
    onChange(value);
  };

  return (
    <Select defaultValue={defaultValue} onValueChange={handleOnSelectedChange} >

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
          <SelectItem key={index} value={item.value}>
            <span className='capitalize'>{item.label}</span>
          </SelectItem>
        ))
      }
      </SelectContent>

    </Select>
  );
};