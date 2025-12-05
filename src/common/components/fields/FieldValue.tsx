"use client";

import { cn } from "@/lib/utils";
import { useFieldContext } from "@/common/components/fields/FieldContext";

interface FieldValueProps 
{
  className?: string;
}

export function FieldValue({ className }: FieldValueProps) 
{
  const { value, valueClassName } = useFieldContext();
  
  return (
    <div className={cn(valueClassName, className)}>
      {value}
    </div>
  );
}
