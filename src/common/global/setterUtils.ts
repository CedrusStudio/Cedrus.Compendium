import { Dispatch, SetStateAction } from "react";

export function setWithSideEffect<T>
(
  setState: Dispatch<SetStateAction<T>>, 
  sideEffect: (v: T) => void
)
  : Dispatch<SetStateAction<T>>
{
  return (input: SetStateAction<T>) => setState(prev =>
  {
      const next = typeof input === "function" 
        ? (input as (p: T) => T)(prev) 
        : (input as T);
        
      sideEffect(next);
      return next;
  });
}

export function singleValueSetterWithSideEffectFactory<T, K extends keyof T>
(
  setState: Dispatch<SetStateAction<T>>, 
  sideEffect: (v: T) => void
)
  : (name: K) => Dispatch<SetStateAction<T[K]>>
{
  return (name: K) => (processValue: T[K] | ((prev: T[K]) => T[K])) => setState(prev =>
  {
      const nextValue = typeof processValue === "function"
          ? (processValue as (v: T[K]) => T[K])(prev[name])
          : (processValue as T[K]);

      const next = { ...prev, [name]: nextValue };      
      sideEffect(next);
      return next;
  });
}