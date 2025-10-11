export type DispatchSetInput<TValue> = TValue | ((prev: TValue) => TValue);

export function resolveSetState<T>(action: React.SetStateAction<T>, currentValue: T): T 
{
  return typeof action === 'function' 
    ? (action as (prev: T) => T)(currentValue) 
    : action;
}

export function setIf<TValue>
(
  predicate: (newValue: TValue) => boolean, 
  setState: React.Dispatch<React.SetStateAction<TValue>>, 
  value: DispatchSetInput<TValue>, 
  currentValue: TValue,
  adjustNewValue?: (newValue: TValue) => TValue
)
  : void
{
  const newValue = resolveSetState(value, currentValue);
  if (!predicate(newValue)) return;
  setState(adjustNewValue ? adjustNewValue(newValue) : newValue);
}