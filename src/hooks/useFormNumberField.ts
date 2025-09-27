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

  return {
    value: field.value,
    onChange: field.onChange
  };
}
