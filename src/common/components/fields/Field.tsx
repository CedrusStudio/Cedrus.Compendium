"use client";

import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";
import { FieldProvider } from "@/common/components/fields/FieldContext";

interface FieldProps 
{
  value: number | string;
  className?: string;
  valueClassName?: string;
}

export function Field({ value, className, valueClassName, children }: PropsWithChildren<FieldProps>) 
{
  return (
    <FieldProvider value={{ value, className, valueClassName }}>
      <div className={cn('flex gap-x-2 mx-2 place-items-center place-content-center', className)}>
        {children}
      </div>
    </FieldProvider>
  );
}
