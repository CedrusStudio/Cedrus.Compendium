"use client";

import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

interface FieldLabelProps 
{
  className?: string;
}

export function FieldLabel({ className, children }: PropsWithChildren<FieldLabelProps>) 
{
  return (
    <div className={cn("capitalize", className)}>
      {children}
    </div>
  );
}
