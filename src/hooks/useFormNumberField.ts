import { Control, FieldPath, FieldPathValue, FieldValues, useController } from "react-hook-form";

type NumberFieldPathValue<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = 
    FieldPathValue<TFieldValues, TName> extends number
        ? FieldPathValue<TFieldValues, TName>
         : never;

export function useFormNumberField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>
(
  control: Control<TFieldValues>,
  name: TName,
  defaultValue: NumberFieldPathValue<TFieldValues, TName>
) 
{
  const { field } = useController
  ({ 
    name, 
    control, 
    defaultValue 
  });

  const current = (): number => typeof field.value === "number" 
    ? field.value 
    : Number(field.value ?? defaultValue) || 0;

  const setValue: React.Dispatch<React.SetStateAction<number>> = (action) => 
  {
    const prev = current();
    const next = typeof action === "function" 
        ? (action as (p: number) => number)(prev) 
        : action;

    field.onChange(next);
  };

  const reset = () => field.onChange(defaultValue);

  return {
    value: current(),
    setValue,
    onChange: field.onChange,
    reset,
  };
}
