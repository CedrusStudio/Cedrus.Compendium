import { Dispatch, SetStateAction } from "react";

export function setWithSideEffect<T>(setState: Dispatch<SetStateAction<T>>, onChange: (v: T) => void): Dispatch<SetStateAction<T>>
{
  return (input: SetStateAction<T>) => setState(prev =>
  {
      const next = typeof input === "function" 
        ? (input as (p: T) => T)(prev) 
        : (input as T);
        
      onChange(next);
      return next;
  });
}