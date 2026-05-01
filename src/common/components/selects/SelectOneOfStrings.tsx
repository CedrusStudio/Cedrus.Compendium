"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { cn } from '@/lib/utils';

type SelectOneOfStringsProps = 
{
  value: string;
  items: {label: string, value: string}[];
  onChange: (value: string) => void;
  id?: string;
  triggerClassName?: string;
  contentClassName?: string;
  placeholder?: string;
  capitalize?: boolean;
};

export default function SelectOneOfStrings
({
  value,
  items,
  onChange,
  id,
  triggerClassName,
  contentClassName,
  placeholder,
  capitalize = true,
}: SelectOneOfStringsProps)
{
  const handleOnSelectedChange = (value: string) => 
  {
    onChange(value);
  };

  return (
    <Select value={value} onValueChange={handleOnSelectedChange}>
      <SelectTrigger id={id} className={cn(capitalize && 'capitalize', triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent className={contentClassName}>
      {
        items.map(item => (
          <SelectItem key={item.value} value={item.value}>
            <span className={cn(capitalize && 'capitalize')}>{item.label}</span>
          </SelectItem>
        ))
      }
      </SelectContent>

    </Select>
  );
};