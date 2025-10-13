import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/ui/form";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";
import { Textarea } from "@/ui/textarea";

export type CustomFormFieldProps<TFieldValues extends FieldValues> = 
{
  path: FieldPath<TFieldValues>;
  inputPlaceholder?: string;
  inputClassName?: string;
};

export default function AreaInputFormField<TFieldValues extends FieldValues>(input: CustomFormFieldProps<TFieldValues>)
{
  const { control } = useFormContext<TFieldValues>();
  
  return (
    <FormField
        control={control}
        name={input.path}
        render={({ field }) => (
          <FormItem>
              <FormControl>
                  <Textarea placeholder={input.inputPlaceholder} className={`resize-none ${input.inputClassName}`} {...field} />
              </FormControl>
              <FormMessage />
          </FormItem>
        )}
    />
  );
};