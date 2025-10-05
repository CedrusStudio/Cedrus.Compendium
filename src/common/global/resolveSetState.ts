export function resolveSetState<T>(action: React.SetStateAction<T>, currentValue: T): T 
{
  return typeof action === 'function' 
    ? (action as (prev: T) => T)(currentValue) 
    : action;
}