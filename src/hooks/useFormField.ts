import { Control, FieldPath, FieldPathValue, FieldValues, useController } from "react-hook-form";

type FormFieldPathValue<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>, TType> = 
  FieldPathValue<TFieldValues, TName> extends TType
    ? FieldPathValue<TFieldValues, TName>
    : never;

export function useFormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>, TType>
(
  control: Control<TFieldValues>,
  name: TName,
  defaultValue: FormFieldPathValue<TFieldValues, TName, TType>
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