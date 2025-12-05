"use client";

import { createContext, useContext } from "react";

interface FieldContextValue 
{
  value: number | string;
  className?: string;
  valueClassName?: string;
}

const FieldContext = createContext<FieldContextValue | undefined>(undefined);

export function useFieldContext() 
{
  const context = useContext(FieldContext);
  
  if (!context) 
  {
    throw new Error("Field sub-components must be used within a Field component");
  }
  
  return context;
}

export const FieldProvider = FieldContext.Provider;
