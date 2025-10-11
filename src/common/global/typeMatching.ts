function isAllowedValue<T extends readonly string[]>(value: string, allowedValues: T): value is T[number] 
{
  return allowedValues.includes(value as T[number]);
}

export function is<T extends readonly string[]>(allowedValues: T) 
{
  return (value: string): value is T[number] => isAllowedValue(value, allowedValues);
}