"use client";

import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

interface FieldIconProps 
{
  className?: string;
}

export function FieldIcon({ className, children }: PropsWithChildren<FieldIconProps>) 
{
  return (
    <div className={cn("flex items-center", className)}>
      {children}
    </div>
  );
}
